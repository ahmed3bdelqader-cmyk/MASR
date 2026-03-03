import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        const prefixKey = type === 'sales' ? 'invoicePrefix' : 'purchasePrefix';
        const counterKey = type === 'sales' ? 'salesInvoiceCounter' : 'purchaseInvoiceCounter';
        const defaultPrefix = type === 'sales' ? 'INV' : 'PUR';

        const [prefixSetting, counterSetting] = await Promise.all([
            prisma.setting.findUnique({ where: { key: prefixKey } }),
            prisma.setting.findUnique({ where: { key: counterKey } })
        ]);

        const prefix = prefixSetting?.value || defaultPrefix;
        let nextVal = counterSetting ? parseInt(counterSetting.value) + 1 : 1;
        let generatedInvoiceNo = `${prefix}-${String(nextVal).padStart(4, '0')}`;

        // Verify it isn't taken in DB
        while (true) {
            generatedInvoiceNo = `${prefix}-${String(nextVal).padStart(4, '0')}`;
            let existing = null;
            if (type === 'sales') {
                existing = await prisma.invoice.findUnique({ where: { invoiceNo: generatedInvoiceNo } });
            } else {
                existing = await prisma.purchaseInvoice.findUnique({ where: { invoiceNo: generatedInvoiceNo } });
            }
            if (!existing) break;
            nextVal++;
        }

        return NextResponse.json({ invoiceNo: generatedInvoiceNo, nextVal });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
