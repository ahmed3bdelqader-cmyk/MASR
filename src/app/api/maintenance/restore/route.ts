import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data, version } = body;

        if (!data || !version) {
            return NextResponse.json({ error: 'ملف النسخة الاحتياطية غير صالح' }, { status: 400 });
        }

        // Destructive Restore Strategy: Clear all then insert
        // Order is critical for foreign keys
        await prisma.$transaction([
            // 1. Clear everything
            prisma.saleItem.deleteMany({}),
            prisma.invoice.deleteMany({}),
            prisma.clientPayment.deleteMany({}),
            prisma.client.deleteMany({}),
            prisma.jobMaterial.deleteMany({}),
            prisma.manufacturingJob.deleteMany({}),
            prisma.product.deleteMany({}),
            prisma.purchaseItem.deleteMany({}),
            prisma.purchaseInvoice.deleteMany({}),
            prisma.inventoryItem.deleteMany({}),
            prisma.payrollTransaction.deleteMany({}),
            prisma.attendance.deleteMany({}),
            prisma.employee.deleteMany({}),
            prisma.expense.deleteMany({}),
            prisma.treasuryTransaction.deleteMany({}),
            prisma.treasury.deleteMany({}),
            prisma.setting.deleteMany({}),

            // 2. Insert from backup
            prisma.client.createMany({ data: data.clients || [] }),
            prisma.clientPayment.createMany({ data: data.clientPayments || [] }),
            prisma.employee.createMany({ data: data.employees || [] }),
            prisma.attendance.createMany({ data: data.attendances || [] }),
            prisma.payrollTransaction.createMany({ data: data.payrolls || [] }),
            prisma.purchaseInvoice.createMany({ data: data.purchases || [] }),
            prisma.purchaseItem.createMany({ data: data.purchaseItems || [] }),
            prisma.inventoryItem.createMany({ data: data.inventory || [] }),
            prisma.product.createMany({ data: data.products || [] }),
            prisma.invoice.createMany({ data: data.invoices || [] }),
            prisma.saleItem.createMany({ data: data.saleItems || [] }),
            prisma.treasury.createMany({ data: data.treasuries || [] }),
            prisma.treasuryTransaction.createMany({ data: data.treasuryTxs || [] }),
            prisma.expense.createMany({ data: data.expenses || [] }),
            prisma.manufacturingJob.createMany({ data: data.jobs || [] }),
            prisma.jobMaterial.createMany({ data: data.jobMaterials || [] }),
            prisma.setting.createMany({ data: data.settings || [] }),
        ]);

        return NextResponse.json({ message: 'تم استرجاع النسخة الاحتياطية بنجاح بنسبة 100%' });
    } catch (error: any) {
        console.error('Restore Error:', error);
        return NextResponse.json({ error: 'فشل في استرجاع النسخة: ' + error.message }, { status: 500 });
    }
}
