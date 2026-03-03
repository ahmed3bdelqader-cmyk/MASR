import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const invoices = await prisma.purchaseInvoice.findMany({
            include: { items: true, supplierObj: { select: { name: true, phones: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(invoices);
    } catch (error) {
        await logSystemError('API/Purchases/GET', error);
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Using a transaction to ensure both Invoice Creation and Inventory Updates happen together
        const result = await prisma.$transaction(async (tx) => {
            // -- Auto Generate Invoice No --
            const currentCounter = await tx.setting.findUnique({ where: { key: 'purchaseInvoiceCounter' } });
            let nextVal = currentCounter ? parseInt(currentCounter.value) + 1 : 1;
            const prefixSetting = await tx.setting.findUnique({ where: { key: 'purchasePrefix' } });
            const prefix = prefixSetting?.value || 'PUR';

            let finalInvoiceNo = body.invoiceNo?.trim();

            if (!finalInvoiceNo || finalInvoiceNo === `${prefix}-####` || finalInvoiceNo.startsWith(prefix + '-')) {
                // Generate next sequence
                while (true) {
                    finalInvoiceNo = `${prefix}-${String(nextVal).padStart(4, '0')}`;
                    const existing = await tx.purchaseInvoice.findUnique({ where: { invoiceNo: finalInvoiceNo } });
                    if (!existing) break;
                    nextVal++;
                }
                // Update counter only if we are using the sequence
                await tx.setting.upsert({
                    where: { key: 'purchaseInvoiceCounter' },
                    update: { value: nextVal.toString() },
                    create: { key: 'purchaseInvoiceCounter', value: nextVal.toString() }
                });
            } else {
                // User provided a completely custom invoice number manually. Verify it doesn't already exist.
                const existing = await tx.purchaseInvoice.findUnique({ where: { invoiceNo: finalInvoiceNo } });
                if (existing) throw new Error(`رقم فاتورة المشتريات (${finalInvoiceNo}) مسجل مسبقاً!`);
            }

            // 1. Create the invoice and its items
            let calculatedTotal = 0;
            const itemsToCreate = body.items.map((item: any) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                const total = qty * price;
                calculatedTotal += total;

                return {
                    type: item.type,
                    name: item.name,
                    thickness: item.thickness ? parseFloat(item.thickness) : null,
                    dimensions: item.dimensions || null,
                    quantity: qty,
                    unitPrice: price,
                    totalPrice: total,
                };
            });

            const invoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNo: finalInvoiceNo,
                    supplier: body.supplier || null, // Keep string for backwards compat if needed
                    supplierId: body.supplierId || null,
                    totalAmount: calculatedTotal,
                    items: {
                        create: itemsToCreate
                    }
                },
                include: { items: true }
            });

            // Update Supplier Balance (increase balance owed to them)
            if (body.supplierId) {
                await tx.supplier.update({
                    where: { id: body.supplierId },
                    data: { balance: { increment: calculatedTotal } }
                });
            }

            // 2. Logistics Link: Automatically update the smart inventory
            for (const rawItem of body.items) {
                const item = invoice.items.find((i: any) => i.name === rawItem.name) || {};
                // Use pricePerPiece if provided (kg ÷ piecesPerKg), else fall back to unitPrice
                const inventoryUnitCost = rawItem.pricePerPiece
                    ? parseFloat(rawItem.pricePerPiece)
                    : parseFloat(rawItem.unitPrice) || 0;

                const existingInventory = await tx.inventoryItem.findFirst({
                    where: { name: rawItem.name, type: 'MATERIAL' }
                });

                if (existingInventory) {
                    await tx.inventoryItem.update({
                        where: { id: existingInventory.id },
                        data: {
                            category: rawItem.inventoryCategory || existingInventory.category, // updating existing to be classified
                            // @ts-ignore
                            mainCategoryId: rawItem.mainCategoryId || (existingInventory as any).mainCategoryId,
                            stock: existingInventory.stock + (parseFloat(rawItem.quantity) || 0),
                            lastPurchasedPrice: inventoryUnitCost,       // ⭐ سعر القطعة – يُستخدم في التصنيع
                        }
                    });
                } else {
                    const unit = rawItem.customUnit ? rawItem.customUnit : (rawItem.type === 'RAW_MATERIAL' ? 'كجم' : 'قطعة');
                    await tx.inventoryItem.create({
                        data: {
                            type: 'MATERIAL',
                            category: rawItem.inventoryCategory || rawItem.type,
                            // @ts-ignore
                            mainCategoryId: rawItem.mainCategoryId || null,
                            name: rawItem.name,
                            stock: parseFloat(rawItem.quantity) || 0,
                            unit,
                            lastPurchasedPrice: inventoryUnitCost,       // ⭐ سعر القطعة
                        }
                    });
                }
            }

            return invoice;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        await logSystemError('API/Purchases/POST', error);
        return NextResponse.json({ error: 'Failed to process purchase transaction' }, { status: 500 });
    }
}
