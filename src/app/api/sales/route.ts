import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

export async function GET() {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { client: true, sales: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(invoices);
    } catch (error) {
        await logSystemError('API/Sales/GET', error);
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await prisma.$transaction(async (tx) => {
            // -- Auto Generate Invoice No --
            const currentCounter = await tx.setting.findUnique({ where: { key: 'salesInvoiceCounter' } });
            let nextVal = currentCounter ? parseInt(currentCounter.value) + 1 : 1;
            const prefixSetting = await tx.setting.findUnique({ where: { key: 'invoicePrefix' } });
            const prefix = prefixSetting?.value || 'INV';

            let finalInvoiceNo = body.invoiceNo?.trim();

            if (!finalInvoiceNo || finalInvoiceNo === `${prefix}-####` || finalInvoiceNo.startsWith(prefix + '-')) {
                while (true) {
                    finalInvoiceNo = `${prefix}-${String(nextVal).padStart(4, '0')}`;
                    const existing = await tx.invoice.findUnique({ where: { invoiceNo: finalInvoiceNo } });
                    if (!existing) break;
                    nextVal++;
                }

                await tx.setting.upsert({
                    where: { key: 'salesInvoiceCounter' },
                    update: { value: nextVal.toString() },
                    create: { key: 'salesInvoiceCounter', value: nextVal.toString() }
                });
            } else {
                const existing = await tx.invoice.findUnique({ where: { invoiceNo: finalInvoiceNo } });
                if (existing) throw new Error(`رقم فاتورة المبيعات (${finalInvoiceNo}) مسجل مسبقاً!`);
            }

            let subtotal = 0;
            const salesToCreate = [];

            for (const item of body.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error('Product not found');

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }

                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: product.stock - item.quantity }
                });

                const invItem = await tx.inventoryItem.findFirst({
                    where: { type: 'FINAL_PRODUCT', name: product.name }
                });
                if (invItem && invItem.stock >= item.quantity) {
                    await tx.inventoryItem.update({
                        where: { id: invItem.id },
                        data: { stock: invItem.stock - item.quantity }
                    });
                }

                const itemTotal = item.quantity * item.unitPrice;
                subtotal += itemTotal;

                salesToCreate.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: itemTotal
                });
            }

            const discountVal = (subtotal * (parseFloat(body.discountPct) || 0)) / 100;
            const taxVal = ((subtotal - discountVal) * (parseFloat(body.taxPct) || 0)) / 100;
            const total = subtotal - discountVal + taxVal;

            const invoice = await tx.invoice.create({
                data: {
                    invoiceNo: finalInvoiceNo,
                    clientId: body.clientId,
                    subtotal,
                    discountPct: parseFloat(body.discountPct) || 0,
                    taxPct: parseFloat(body.taxPct) || 0,
                    total,
                    status: 'UNPAID',
                    sales: { create: salesToCreate }
                },
                include: { sales: true }
            });

            return invoice;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        await logSystemError('API/Sales/POST', error);
        return NextResponse.json({ error: error.message || 'Failed to process sales invoice' }, { status: 500 });
    }
}

// ─── PUT: Update invoice status only ───────────────────────────────────────
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, status } = body;
        if (!id) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                ...(status !== undefined && { status }),
            },
            include: { client: true, sales: { include: { product: true } } }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        await logSystemError('API/Sales/PUT', error);
        return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
    }
}

// ─── DELETE: Cancel invoice — restore stock ──────────────────────────────────
export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id },
                include: { sales: { include: { product: true } } }
            });
            if (!invoice) throw new Error('Invoice not found');

            // Restore stock for each sales line
            for (const sale of invoice.sales) {
                await tx.product.update({
                    where: { id: sale.productId },
                    data: { stock: { increment: sale.quantity } }
                });
                const invItem = await tx.inventoryItem.findFirst({
                    where: { type: 'FINAL_PRODUCT', name: sale.product?.name }
                });
                if (invItem) {
                    await tx.inventoryItem.update({
                        where: { id: invItem.id },
                        data: { stock: { increment: sale.quantity } }
                    });
                }
            }

            // Delete sales lines then invoice (cascade handles SaleItem)
            await tx.invoice.delete({ where: { id } });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        await logSystemError('API/Sales/DELETE', error);
        return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 });
    }
}
