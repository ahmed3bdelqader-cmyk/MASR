import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

// ── GET: جلب كل بنود الدهانات
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status');
        const entries = await prisma.paintEntry.findMany({
            where: statusFilter && statusFilter !== 'all' ? { status: statusFilter } : undefined,
            include: {
                job: {
                    select: {
                        id: true, serialNo: true, name: true, quantityProduced: true,
                        invoice: { include: { client: { select: { name: true } } } }
                    }
                },
                supplier: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(entries);
    } catch (error) {
        await logSystemError('API/Jobs/Paint/GET', error);
        return NextResponse.json({ error: 'فشل جلب بنود الدهانات' }, { status: 500 });
    }
}

// ── POST: إضافة بنود دهان لأمر تصنيع قائم
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobId, entries } = body;
        if (!jobId || !Array.isArray(entries) || entries.length === 0) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
        }
        const result = await prisma.$transaction(async (tx) => {
            let paintTotal = 0;
            const created: any[] = [];
            for (const e of entries) {
                const unitPrice = parseFloat(e.unitPrice) || 0;
                const quantity = parseFloat(e.quantity) || 1;
                const totalCost = unitPrice * quantity;
                paintTotal += totalCost;
                const entry = await tx.paintEntry.create({
                    data: { jobId, productName: e.productName || 'دهان', quantity, color: e.color || null, colorCode: e.colorCode || null, unitPrice, totalCost, status: 'PENDING_PAYMENT' }
                });
                created.push(entry);
            }
            await tx.manufacturingJob.update({ where: { id: jobId }, data: { paintCostTotal: { increment: paintTotal } } });
            return { created, addedTotal: paintTotal };
        });
        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        await logSystemError('API/Jobs/Paint/POST', error);
        return NextResponse.json({ error: error.message || 'فشل إضافة بنود الدهان' }, { status: 500 });
    }
}

// ── PUT: تعديل بند دهان (PENDING فقط)
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { entryId, productName, quantity, color, colorCode, unitPrice } = body;
        if (!entryId) return NextResponse.json({ error: 'entryId مطلوب' }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.paintEntry.findUnique({ where: { id: entryId } });
            if (!existing) throw new Error('البند غير موجود');
            if (existing.status === 'PAID') throw new Error('لا يمكن تعديل بند مدفوع');

            const newQty = parseFloat(quantity) || existing.quantity;
            const newPrice = parseFloat(unitPrice) || existing.unitPrice;
            const newTotal = newQty * newPrice;
            const diff = newTotal - existing.totalCost;

            const updated = await tx.paintEntry.update({
                where: { id: entryId },
                data: {
                    productName: productName || existing.productName,
                    quantity: newQty,
                    color: color ?? existing.color,
                    colorCode: colorCode ?? existing.colorCode,
                    unitPrice: newPrice,
                    totalCost: newTotal,
                }
            });

            // تحديث إجمالي الدهان على أمر الشغل
            if (diff !== 0) {
                await tx.manufacturingJob.update({
                    where: { id: existing.jobId },
                    data: { paintCostTotal: { increment: diff } }
                });
            }
            return updated;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        await logSystemError('API/Jobs/Paint/PUT', error);
        return NextResponse.json({ error: error.message || 'فشل التعديل' }, { status: 500 });
    }
}

// ── PATCH: تأكيد الدفع (PENDING → PAID + خصم من الخزينة)
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { entryId, treasuryId } = body;
        if (!entryId) return NextResponse.json({ error: 'entryId مطلوب' }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            const entry = await tx.paintEntry.findUnique({
                where: { id: entryId },
                include: { job: { select: { id: true, serialNo: true, name: true } } }
            });
            if (!entry) throw new Error('بند الدهان غير موجود');
            if (entry.status === 'PAID') throw new Error('تم دفع هذا البند مسبقاً');

            let treasury: any;
            if (treasuryId) {
                treasury = await tx.treasury.findUnique({ where: { id: treasuryId } });
            } else {
                treasury = await tx.treasury.findFirst({ where: { type: 'MAIN' } });
            }
            if (!treasury) throw new Error('لا توجد خزينة رئيسية');
            if (treasury.balance < entry.totalCost) {
                throw new Error(`رصيد الخزينة غير كافٍ (الرصيد: ${treasury.balance.toFixed(2)}، المطلوب: ${entry.totalCost.toFixed(2)})`);
            }

            const expense = await tx.expense.create({
                data: {
                    category: 'PAINT',
                    description: `دهانات — ${entry.productName}${entry.color ? ` (${entry.color})` : ''} × ${entry.quantity} — شغلانة #${entry.job.serialNo}: ${entry.job.name}`,
                    amount: entry.totalCost,
                    jobId: entry.jobId,
                    supplierId: entry.supplierId || null,
                }
            });

            if (entry.supplierId) {
                await tx.supplier.update({
                    where: { id: entry.supplierId },
                    data: { balance: { decrement: entry.totalCost } }
                });
            }

            const treasuryTx = await tx.treasuryTransaction.create({
                data: {
                    treasuryId: treasury.id,
                    type: 'OUT',
                    amount: entry.totalCost,
                    channel: 'CASH',
                    description: `دهانات — ${entry.productName} — شغلانة #${entry.job.serialNo}`,
                    expenseId: expense.id,
                }
            });

            await tx.treasury.update({ where: { id: treasury.id }, data: { balance: { decrement: entry.totalCost } } });

            const updated = await tx.paintEntry.update({
                where: { id: entryId },
                data: { status: 'PAID', paidAt: new Date(), expenseId: expense.id, treasuryTxId: treasuryTx.id }
            });

            return { entry: updated, expense, treasuryTx };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        await logSystemError('API/Jobs/Paint/PATCH', error);
        return NextResponse.json({ error: error.message || 'فشل تأكيد الدفع' }, { status: 500 });
    }
}

// ── DELETE: حذف بند دهان (PENDING فقط)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const entryId = searchParams.get('id');
        if (!entryId) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            const entry = await tx.paintEntry.findUnique({ where: { id: entryId } });
            if (!entry) throw new Error('البند غير موجود');
            if (entry.status === 'PAID') throw new Error('لا يمكن حذف بند مدفوع — يرجى التواصل مع المحاسب');

            await tx.paintEntry.delete({ where: { id: entryId } });

            // إنقاص تكلفة الدهان من أمر الشغل
            await tx.manufacturingJob.update({
                where: { id: entry.jobId },
                data: { paintCostTotal: { decrement: entry.totalCost } }
            });

            if (entry.supplierId) {
                await tx.supplier.update({
                    where: { id: entry.supplierId },
                    data: { balance: { decrement: entry.totalCost } }
                });
            }
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        await logSystemError('API/Jobs/Paint/DELETE', error);
        return NextResponse.json({ error: error.message || 'فشل الحذف' }, { status: 500 });
    }
}
