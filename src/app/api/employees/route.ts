import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

// GET /api/employees — الحصول على قائمة الموظفين
export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { id: 'asc' },
            include: {
                phones: true,
                payrollRecords: { take: 5, orderBy: { date: 'desc' } }
            }
        });
        return NextResponse.json(employees);
    } catch (error: any) {
        await logSystemError('API/Employees/GET', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/employees — إضافة موظف جديد
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // { name, title, age, address, contact, contractType, baseSalary, role, username, password, canLogin }

        // توليد الرقم الوظيفي التالي
        const lastEmp = await prisma.employee.findFirst({ orderBy: { employeeId: 'desc' } });
        // ✅ إصلاح: يبدأ الترقيم من 1000 (الأول = 1000)
        const nextId = (lastEmp?.employeeId ?? 999) + 1;

        const employee = await prisma.employee.create({
            data: {
                name: body.name,
                title: body.title,
                age: parseInt(body.age) || null,
                address: body.address,
                nationalId: body.nationalId,
                qualification: body.qualification,
                department: body.department,
                hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
                contractType: body.contractType,
                baseSalary: parseFloat(body.baseSalary) || 0,
                canLogin: body.canLogin || false,
                role: body.role || 'WORKER',
                username: body.canLogin && body.username ? body.username : null,
                password: body.canLogin && body.password ? body.password : null,
                employeeId: nextId,
                phones: {
                    create: (body.phones || []).length > 0
                        ? body.phones.map((p: any) => ({
                            phone: p.phone,
                            isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                        }))
                        : []
                }
            }
        });

        return NextResponse.json(employee, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/employees — تعديل موظف
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                name: data.name,
                title: data.title,
                age: parseInt(data.age) || null,
                address: data.address,
                nationalId: data.nationalId,
                qualification: data.qualification,
                department: data.department,
                hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
                contractType: data.contractType,
                baseSalary: parseFloat(data.baseSalary) || 0,
                canLogin: data.canLogin || false,
                role: data.role || 'WORKER',
                username: data.canLogin && data.username ? data.username : null,
                password: !data.canLogin ? null : data.password ? data.password : undefined,
                phones: {
                    deleteMany: {},
                    create: (data.phones || []).length > 0 ? data.phones.map((p: any) => ({
                        phone: p.phone,
                        isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                    })) : []
                }
            }
        });

        return NextResponse.json(employee, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/employees?id=XYZ — حذف أمين مخزن/موظف
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.employee.delete({
            where: { id }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        await logSystemError('API/Employees/DELETE', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
