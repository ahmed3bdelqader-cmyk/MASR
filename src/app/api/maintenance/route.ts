import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const target = searchParams.get('target');

        if (target === 'clients') {
            await prisma.$transaction([
                prisma.saleItem.deleteMany({ where: { invoice: { clientId: { not: '' } } } }),
                prisma.clientPayment.deleteMany({}),
                prisma.invoice.deleteMany({}),
                prisma.client.deleteMany({}),
            ]);
            return NextResponse.json({ message: 'تم حذف جميع بيانات العملاء والعمليات المرتبطة بها بنجاح' });
        }

        if (target === 'products') {
            await prisma.$transaction([
                prisma.saleItem.deleteMany({}),
                prisma.jobMaterial.deleteMany({}),
                prisma.manufacturingJob.deleteMany({}),
                prisma.product.deleteMany({}),
            ]);
            return NextResponse.json({ message: 'تم حذف جميع المنتجات والموديلات المقترنة بها بنجاح' });
        }

        if (target === 'all') {
            // Destructive reset - order matters for foreign keys
            await prisma.$transaction([
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
                // We keep Treasury records themselves but reset balance? 
                // Or delete transactions and set balance to 0.
                prisma.treasury.updateMany({ data: { balance: 0 } }),
                // We keep Settings (counters etc) or reset them? 
                // Resetting counters might be better for a "Full Reset".
                prisma.setting.deleteMany({}),
            ]);
            return NextResponse.json({ message: 'تم تصفير قاعدة البيانات بالكامل بنجاح' });
        }

        return NextResponse.json({ error: 'Target not specified' }, { status: 400 });
    } catch (error: any) {
        console.error('Maintenance Error:', error);
        return NextResponse.json({ error: 'فشل في تنفيذ العملية: ' + error.message }, { status: 500 });
    }
}
