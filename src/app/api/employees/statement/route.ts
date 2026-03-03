import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!employeeId) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                phones: true,
                payrollRecords: {
                    where: startDate && endDate ? {
                        date: {
                            gte: new Date(startDate),
                            lte: new Date(endDate + 'T23:59:59.999Z')
                        }
                    } : undefined,
                    orderBy: { date: 'desc' }
                },
                attendances: {
                    where: startDate && endDate ? {
                        dateStr: {
                            gte: startDate,
                            lte: endDate
                        }
                    } : undefined,
                    orderBy: { dateStr: 'desc' }
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error: any) {
        console.error('Error fetching employee statement:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
