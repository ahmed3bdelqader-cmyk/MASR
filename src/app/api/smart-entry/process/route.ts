import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { type, partyName, partyPhone, items, total, documentStatus, invoiceNumber, invoiceDate } = data;
        const isArchived = documentStatus === 'ARCHIVED';

        if (!partyName || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: false, error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const parsedTotal = parseFloat(String(total).replace(/[^0-9.-]+/g, "")) || 0;

        if (type === 'PURCHASE') {
            // 1. Find or Create Supplier
            let supplier = await prisma.supplier.findFirst({
                where: { name: partyName }
            });

            if (!supplier) {
                supplier = await prisma.supplier.create({
                    data: {
                        name: partyName,
                        type: 'MATERIAL',
                        balance: 0
                    }
                });
            }

            // 2. Prepare Inventory Updates & Purchase Items
            const purchaseItemsData = [];
            const inventoryUpdateOperations = [];

            for (const item of items) {
                const qtyStr = String(item.quantity || 1).replace(/[^0-9.-]+/g, "");
                const priceStr = String(item.unitPrice || 0).replace(/[^0-9.-]+/g, "");

                const qty = parseFloat(qtyStr) || 1;
                const price = parseFloat(priceStr) || 0;
                // Purchase Items
                purchaseItemsData.push({
                    type: 'RAW_MATERIAL', // Default assumption
                    name: String(item.name || 'مادة غير معروفة').trim(),
                    quantity: qty,
                    unitPrice: price,
                    totalPrice: qty * price
                });

                // Find or create InventoryItem
                const itemNameStr = String(item.name || 'مادة غير معروفة').trim();
                const invItem = await prisma.inventoryItem.findFirst({
                    where: { name: itemNameStr }
                });

                if (invItem) {
                    inventoryUpdateOperations.push(
                        prisma.inventoryItem.update({
                            where: { id: invItem.id },
                            data: {
                                stock: { increment: item.quantity },
                                lastPurchasedPrice: item.unitPrice
                            }
                        })
                    );
                } else {
                    inventoryUpdateOperations.push(
                        prisma.inventoryItem.create({
                            data: {
                                name: itemNameStr,
                                type: 'MATERIAL',
                                unit: 'قطعة', // fallback unit
                                stock: qty,
                                lastPurchasedPrice: price
                            }
                        })
                    );
                }
            }

            // Generate Invoice sequence
            const count = await prisma.purchaseInvoice.count();
            const invoiceNo = `PUR-SE-${1000 + count}`;

            // Create operations array
            const operations: any[] = [
                prisma.purchaseInvoice.create({
                    data: {
                        invoiceNo,
                        invoiceNumber: invoiceNumber ? String(invoiceNumber) : null,
                        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
                        documentStatus: documentStatus || 'POSTED',
                        supplier: supplier.name,
                        supplierId: supplier.id,
                        totalAmount: parsedTotal,
                        items: {
                            create: purchaseItemsData
                        }
                    }
                })
            ];

            // 3. Execute Transaction
            // Only update inventory and balance if NOT archived
            if (!isArchived) {
                operations.push(
                    prisma.supplier.update({
                        where: { id: supplier.id },
                        data: {
                            balance: { increment: parsedTotal }
                        }
                    })
                );
                operations.push(...inventoryUpdateOperations);
            }

            await prisma.$transaction(operations);

            return NextResponse.json({ success: true, message: isArchived ? 'تم حفظ مسودة فاتورة المشتريات (أرشيف)' : 'تم حفظ فاتورة المشتريات وتحديث المخزن' });

        } else if (type === 'SALE') {
            // Sales Logic
            // 1. Find or Create Client
            let client = await prisma.client.findFirst({
                where: { name: partyName }
            });

            if (!client) {
                // Find highest serial to auto-assign
                const lastClient = await prisma.client.findFirst({ orderBy: { serial: 'desc' } });
                const nextSerial = lastClient ? lastClient.serial + 1 : 1000;

                client = await prisma.client.create({
                    data: {
                        name: partyName,
                        serial: nextSerial,
                    }
                });
            }

            // Invoice sequence (removed redundant declarations here)

            const saleItemsData = [];
            const inventoryDecreaseOps = [];

            for (const item of items) {
                const qtyStr = String(item.quantity || 1).replace(/[^0-9.-]+/g, "");
                const priceStr = String(item.unitPrice || 0).replace(/[^0-9.-]+/g, "");

                const qty = Math.round(parseFloat(qtyStr)) || 1; // Int requirement
                const price = parseFloat(priceStr) || 0;

                // Find Product
                const itemNameStr = String(item.name || 'منتج غير معروف').trim();
                let prod = await prisma.product.findFirst({
                    where: { name: itemNameStr }
                });

                if (!prod) {
                    // If not exists, mock create so we can attach it to invoice (OCR might misspell)
                    const pCount = await prisma.product.count();
                    prod = await prisma.product.create({
                        data: {
                            name: itemNameStr,
                            code: `P-SE-${pCount + 1}-${Date.now()}`,
                            price: price,
                            stock: 0
                        }
                    });
                }

                saleItemsData.push({
                    productId: prod.id,
                    quantity: qty,
                    unitPrice: price,
                    totalPrice: qty * price
                });

                inventoryDecreaseOps.push(
                    prisma.product.update({
                        where: { id: prod.id },
                        data: {
                            stock: { decrement: qty }
                        }
                    })
                );
            }

            // Generate Invoice sequence
            const invoicesCount = await prisma.invoice.count();
            const finalInvoiceNo = `INV-SE-${2000 + invoicesCount}`;

            const operations: any[] = [
                prisma.invoice.create({
                    data: {
                        invoiceNo: finalInvoiceNo,
                        invoiceNumber: invoiceNumber ? String(invoiceNumber) : null,
                        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
                        documentStatus: documentStatus || 'POSTED',
                        clientId: client.id,
                        subtotal: parsedTotal,
                        total: parsedTotal,
                        status: "UNPAID",
                        sales: {
                            create: saleItemsData
                        }
                    }
                })
            ];

            if (!isArchived) {
                operations.push(...inventoryDecreaseOps);
                // IF we wanted to increment client balance we would do it here
            }

            await prisma.$transaction(operations);

            return NextResponse.json({ success: true, message: isArchived ? 'تم الرجوع للفاتورة (أرشيف)' : 'تم حفظ فاتورة المبيعات آلياً' });
        }

        return NextResponse.json({ success: false, error: 'نوع العملية غير مدعوم' }, { status: 400 });

    } catch (error: any) {
        console.error('Smart Entry Error Details:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'حدث خطأ سيرفر داخلي أثناء الحفظ'
        }, { status: 500 });
    }
}
