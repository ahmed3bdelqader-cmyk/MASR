import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [
            clients, clientPayments, employees, attendances, payrolls,
            purchases, purchaseItems, inventory, products, invoices,
            saleItems, treasuries, treasuryTxs, expenses, jobs, jobMaterials, settings
        ] = await Promise.all([
            prisma.client.findMany(),
            prisma.clientPayment.findMany(),
            prisma.employee.findMany(),
            prisma.attendance.findMany(),
            prisma.payrollTransaction.findMany(),
            prisma.purchaseInvoice.findMany(),
            prisma.purchaseItem.findMany(),
            prisma.inventoryItem.findMany(),
            prisma.product.findMany(),
            prisma.invoice.findMany(),
            prisma.saleItem.findMany(),
            prisma.treasury.findMany(),
            prisma.treasuryTransaction.findMany(),
            prisma.expense.findMany(),
            prisma.manufacturingJob.findMany(),
            prisma.jobMaterial.findMany(),
            prisma.setting.findMany(),
        ]);

        const backupData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            data: {
                clients, clientPayments, employees, attendances, payrolls,
                purchases, purchaseItems, inventory, products, invoices,
                saleItems, treasuries, treasuryTxs, expenses, jobs, jobMaterials, settings
            }
        };

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="erp_backup_${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error: any) {
        console.error('Backup Error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء النسخة الاحتياطية' }, { status: 500 });
    }
}
