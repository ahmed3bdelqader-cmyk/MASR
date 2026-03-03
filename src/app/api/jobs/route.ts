import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

export async function GET() {
    try {
        const jobs = await prisma.manufacturingJob.findMany({
            include: {
                invoice: true,
                materials: { include: { item: true } },
                expenses: true,
                paintEntries: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(jobs);
    } catch (error) {
        await logSystemError('API/Jobs/GET', error);
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await prisma.$transaction(async (tx) => {
            let totalMaterialCost = 0;
            let totalOperatingCost = 0;

            // ──────────────────────────────────────────────────────────────────
            // 1. Verify and deduct raw materials from inventory
            // ──────────────────────────────────────────────────────────────────
            const materialsToCreate: any[] = [];
            for (const m of body.materials) {
                const item = await tx.inventoryItem.findUnique({ where: { id: m.itemId } });
                if (!item || item.stock < m.quantity) {
                    throw new Error(`رصيد غير كافٍ للخامة: ${item?.name || m.itemId}`);
                }

                const mUnitCost = parseFloat(m.unitCost) || 0;
                const mQty = parseFloat(m.quantity) || 0;
                const mTotal = mUnitCost * mQty;
                totalMaterialCost += mTotal;

                await tx.inventoryItem.update({
                    where: { id: item.id },
                    data: { stock: item.stock - mQty }
                });

                materialsToCreate.push({ itemId: item.id, quantity: mQty, unitCost: mUnitCost, totalCost: mTotal });
            }

            // ──────────────────────────────────────────────────────────────────
            // 2. Operating expenses
            // ──────────────────────────────────────────────────────────────────
            const expensesToCreate: any[] = [];
            for (const exp of body.expenses) {
                const amt = parseFloat(exp.amount) || 0;
                totalOperatingCost += amt;
                expensesToCreate.push({ category: 'SERVICE', description: exp.description, amount: amt, isPeriodic: false, supplierId: exp.supplierId || null });

                if (exp.supplierId) {
                    await tx.supplier.update({
                        where: { id: exp.supplierId },
                        data: { balance: { increment: amt } }
                    });
                }
            }

            // ──────────────────────────────────────────────────────────────────
            // 2B. Paint entries (saved as PENDING_PAYMENT, NOT deducted from treasury here)
            // ──────────────────────────────────────────────────────────────────
            const paintEntriesToCreate: any[] = [];
            let paintCostTotal = 0;
            const paintItems: any[] = body.paintItems || [];
            for (const p of paintItems) {
                const unitPrice = parseFloat(p.unitPrice) || 0;
                const qty = parseFloat(p.quantity) || 1;
                if (unitPrice <= 0) continue; // بنود بدون سعر لا تُحفظ
                const totalCost = unitPrice * qty;
                paintCostTotal += totalCost;
                paintEntriesToCreate.push({
                    productName: p.productName || 'دهان',
                    quantity: qty,
                    color: p.color || null,
                    colorCode: p.colorCode || null,
                    unitPrice,
                    totalCost,
                    status: 'PENDING_PAYMENT',
                    supplierId: p.supplierId || null
                });

                if (p.supplierId) {
                    await tx.supplier.update({
                        where: { id: p.supplierId },
                        data: { balance: { increment: totalCost } }
                    });
                }
            }

            // ──────────────────────────────────────────────────────────────────
            // 3. Cost calculations
            // ──────────────────────────────────────────────────────────────────
            const operatingMarginPct = parseFloat(body.operatingMarginPct) || 0;
            // تكلفة الدهان تُضاف للتكلفة الأساسية لحساب سعر الوحدة
            const baseCost = totalMaterialCost + totalOperatingCost + paintCostTotal;
            const marginAmount = baseCost * (operatingMarginPct / 100);
            const totalJobCost = baseCost + marginAmount;
            const qty = parseFloat(body.outputQuantity) || 0;
            const unitCost = qty > 0 ? totalJobCost / qty : totalJobCost;

            // ──────────────────────────────────────────────────────────────────
            // 4. Routing based on destinationType
            // ──────────────────────────────────────────────────────────────────
            const destinationType = body.destinationType || 'INVENTORY';
            let finalProductId: string | null = null;
            let invoiceId: string | null = null;

            if (destinationType === 'INVENTORY') {
                // ── Route A: Add to Smart Warehouse (InventoryItem) ──────────
                let resolvedName = body.outputProductName || 'منتج مصنع';
                if (body.outputProductId) {
                    const prod = await tx.product.findUnique({ where: { id: body.outputProductId } });
                    resolvedName = prod?.name || resolvedName;
                    finalProductId = body.outputProductId;
                }

                const existingInv = await tx.inventoryItem.findFirst({
                    where: { name: resolvedName, type: 'FINAL_PRODUCT' }
                });

                if (existingInv) {
                    await tx.inventoryItem.update({
                        where: { id: existingInv.id },
                        data: { stock: existingInv.stock + qty, lastPurchasedPrice: unitCost }
                    });
                } else {
                    await tx.inventoryItem.create({
                        data: {
                            type: 'FINAL_PRODUCT',
                            category: 'MANUFACTURED',
                            name: resolvedName,
                            stock: qty,
                            unit: 'قطعة',
                            lastPurchasedPrice: unitCost,
                        }
                    });
                }

            } else {
                // ── Route B: Client-bound — add to Product Catalog + Invoice ──
                let finalProduct: any = null;

                if (body.outputProductId) {
                    finalProduct = await tx.product.update({
                        where: { id: body.outputProductId },
                        data: { stock: { increment: qty }, price: unitCost }
                    });
                } else if (body.outputProductName) {
                    finalProduct = await tx.product.create({
                        data: {
                            code: body.outputProductCode || 'PRD-' + Math.floor(Math.random() * 1000000).toString(),
                            name: body.outputProductName,
                            price: unitCost,
                            stock: qty
                        }
                    });
                }

                if (finalProduct) {
                    finalProductId = finalProduct.id;

                    let clientId: string = body.clientId || '';
                    if (destinationType === 'NEW_CLIENT' && body.newClientName) {
                        const lastClient = await tx.client.findFirst({ orderBy: { serial: 'desc' } });
                        const newClient = await tx.client.create({ data: { name: body.newClientName, serial: (lastClient?.serial || 0) + 1 } });
                        clientId = newClient.id;
                    }

                    if (clientId) {
                        // -- Auto Generate Invoice No --
                        const currentCounter = await tx.setting.findUnique({ where: { key: 'salesInvoiceCounter' } });
                        let nextVal = currentCounter ? parseInt(currentCounter.value) + 1 : 1;

                        const prefixSetting = await tx.setting.findUnique({ where: { key: 'invoicePrefix' } });
                        const prefix = prefixSetting?.value || 'INV';
                        let invoiceNo = '';

                        while (true) {
                            invoiceNo = `${prefix}-${String(nextVal).padStart(4, '0')}`;
                            const existing = await tx.invoice.findUnique({ where: { invoiceNo } });
                            if (!existing) break;
                            nextVal++;
                        }

                        await tx.setting.upsert({
                            where: { key: 'salesInvoiceCounter' },
                            update: { value: nextVal.toString() },
                            create: { key: 'salesInvoiceCounter', value: nextVal.toString() }
                        });

                        const saleTotal = Math.round(unitCost * qty * 100) / 100;

                        const invoice = await tx.invoice.create({
                            data: {
                                invoiceNo,
                                clientId,
                                subtotal: saleTotal,
                                total: saleTotal,
                                status: 'UNPAID',
                                sales: {
                                    create: [{
                                        productId: finalProduct.id,
                                        quantity: Math.max(1, Math.round(qty)),
                                        unitPrice: unitCost,
                                        totalPrice: saleTotal
                                    }]
                                }
                            }
                        });
                        invoiceId = invoice.id;

                        // Product delivered immediately → clear catalog stock
                        await tx.product.update({
                            where: { id: finalProduct.id },
                            data: { stock: { decrement: qty } }
                        });
                    }
                }
            }

            // ──────────────────────────────────────────────────────────────────
            // 5. Create Manufacturing Job record
            // ──────────────────────────────────────────────────────────────────
            const lastJob = await tx.manufacturingJob.findFirst({ orderBy: { serialNo: 'desc' } });
            const serialNo = lastJob?.serialNo ? lastJob.serialNo + 1 : 1;

            const job = await tx.manufacturingJob.create({
                data: {
                    serialNo,
                    name: body.name,
                    invoiceId: invoiceId,
                    status: invoiceId ? 'COMPLETED' : 'IN_PROGRESS',
                    completedAt: invoiceId ? new Date() : null,
                    totalMaterialCost,
                    totalOperatingCost,
                    paintCostTotal,
                    operatingMarginPct,
                    netProfit: marginAmount,
                    productId: finalProductId,
                    quantityProduced: qty,
                    materials: { create: materialsToCreate },
                    expenses: { create: expensesToCreate },
                    paintEntries: paintEntriesToCreate.length > 0
                        ? { create: paintEntriesToCreate }
                        : undefined,
                },
                include: { materials: true, expenses: true, paintEntries: true }
            });

            return job;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        await logSystemError('API/Jobs/POST', error);
        return NextResponse.json({ error: error.message || 'فشل تسجيل أمر التصنيع' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, stage, status } = body;
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const isCompleted = stage === 'COMPLETED' || status === 'COMPLETED';
        const updated = await prisma.manufacturingJob.update({
            where: { id },
            data: {
                stage: stage || undefined,
                status: isCompleted ? 'COMPLETED' : (status || 'IN_PROGRESS'),
                completedAt: isCompleted ? new Date() : undefined
            }
        });
        return NextResponse.json(updated);
    } catch (error: any) {
        await logSystemError('API/Jobs/PUT', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
