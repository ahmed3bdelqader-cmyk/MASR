import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

// GET /api/attendance?date=YYYY-MM-DD
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date');

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        // --- Monthly Report Logic ---
        const reportType = searchParams.get('reportType');
        if (reportType === 'MONTHLY') {
            const employeeId = searchParams.get('employeeId');
            const month = parseInt(searchParams.get('month') || '1');
            const year = parseInt(searchParams.get('year') || '2026');

            if (!employeeId) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });

            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { id: true, name: true, employeeId: true, department: true, title: true, baseSalary: true, contractType: true }
            });

            // ✅ إصلاح: متغير واحد فقط بدلاً من اثنين
            let dateQuery: any = {};
            if (startDate && endDate) {
                dateQuery = { gte: startDate, lte: endDate };
            } else {
                const monthPrefix = `${year}-${month.toString().padStart(2, '0')}-`;
                dateQuery = { startsWith: monthPrefix };
            }

            const attendance = await prisma.attendance.findMany({
                where: {
                    employeeId,
                    dateStr: dateQuery
                },
                orderBy: { dateStr: 'asc' }
            });

            return NextResponse.json({ employee, attendance });
        }

        // Get all active employees
        const employees = await prisma.employee.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, employeeId: true, department: true, title: true }
        });

        // Get attendance records for the given date
        const attendanceRecords = await prisma.attendance.findMany({
            where: { dateStr }
        });

        const mapped = employees.map(emp => {
            const record = attendanceRecords.find(a => a.employeeId === emp.id);
            return {
                ...emp,
                status: record?.status || 'PENDING',
                checkIn: record?.checkIn || null,
                checkOut: record?.checkOut || null,
                hoursWorked: record?.hoursWorked || null,
                note: record?.note || ''
            };
        });

        return NextResponse.json(mapped);
    } catch (error: any) {
        await logSystemError('API/Attendance/GET', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/attendance
// { dateStr: string, records: [{ employeeId, status, checkIn, checkOut, hoursWorked, note }] }
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { dateStr, records } = body;

        if (!dateStr || !Array.isArray(records)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            for (const rec of records) {
                if (rec.status === 'PENDING') continue; // Don't save empty states

                // ✅ إصلاح: حساب ساعات العمل تلقائياً إذا لم تُدخَل يدوياً
                let hoursWorked: number | null = rec.hoursWorked ? parseFloat(rec.hoursWorked) : null;
                if (!hoursWorked && rec.checkIn && rec.checkOut) {
                    const diff = new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime();
                    if (diff > 0) {
                        hoursWorked = Math.round((diff / 3600000) * 100) / 100;
                    }
                }

                await tx.attendance.upsert({
                    where: {
                        employeeId_dateStr: {
                            employeeId: rec.id, // using emp.id passed from frontend as rec.id
                            dateStr: dateStr
                        }
                    },
                    update: {
                        status: rec.status,
                        checkIn: rec.checkIn ? new Date(rec.checkIn) : null,
                        checkOut: rec.checkOut ? new Date(rec.checkOut) : null,
                        hoursWorked,
                        note: rec.note
                    },
                    create: {
                        employeeId: rec.id, // emp.id
                        dateStr: dateStr,
                        status: rec.status,
                        checkIn: rec.checkIn ? new Date(rec.checkIn) : null,
                        checkOut: rec.checkOut ? new Date(rec.checkOut) : null,
                        hoursWorked,
                        note: rec.note
                    }
                });
            }
            return true;
        });

        return NextResponse.json({ success: true, result }, { status: 200 });
    } catch (error: any) {
        await logSystemError('API/Attendance/POST', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
