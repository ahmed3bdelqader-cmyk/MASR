import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const expenses = await prisma.expenseTransaction.findMany({
            include: { category: true },
            orderBy: { date: 'desc' }
        });
        const categories = await prisma.expenseCategory.findMany();
        return NextResponse.json({ expenses, categories });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { categoryId, amount, description, date } = body;

        if (!categoryId || !amount || !description) {
            throw new Error("يجب تعبئة جميع الحقول: البند، المبلغ، البيان.");
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) throw new Error("المبلغ غير صحيح");

        const mainTreasury = await prisma.treasury.findUnique({ where: { type: 'MAIN' } });
        if (!mainTreasury) throw new Error("الخزينة الرئيسية غير موجودة بالنظام");

        if (mainTreasury.balance < amt) {
            throw new Error(`رصيد الخزينة الرئيسية (${mainTreasury.balance}) لا يكفي لتسجيل هذا المصروف`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct from treasury
            const tr = await tx.treasury.update({
                where: { type: 'MAIN' },
                data: { balance: { decrement: amt } }
            });

            // 2. Add Treasury OUT transaction
            const categoryMatch = await tx.expenseCategory.findUnique({ where: { id: categoryId } });

            const trTx = await tx.treasuryTransaction.create({
                data: {
                    treasuryId: tr.id,
                    type: 'OUT',
                    amount: amt,
                    channel: 'CASH',
                    description: `مصروفات (${categoryMatch?.name}): ${description}`,
                }
            });

            // 3. Create expense transaction
            const expense = await tx.expenseTransaction.create({
                data: {
                    categoryId,
                    amount: amt,
                    description,
                    date: date ? new Date(date) : new Date(),
                    treasuryTxId: trTx.id
                }
            });

            return expense;
        });

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
