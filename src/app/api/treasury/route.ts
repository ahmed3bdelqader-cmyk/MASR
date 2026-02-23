import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const treasuries = await prisma.treasury.findMany({
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                    take: 50 // Limit to recent 50 for performance
                }
            }
        });
        return NextResponse.json(treasuries);
    } catch (error) {
        await logSystemError('API/Treasury/GET', error);
        return NextResponse.json({ error: 'Failed to fetch treasury data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await prisma.$transaction(async (tx) => {
            // 1. Ensure Treasury Exists or Create it
            let treasury = await tx.treasury.findUnique({
                where: { type: body.type } // MAIN, EMPLOYEE_CUSTODY, ADVANCES
            });

            if (!treasury) {
                treasury = await tx.treasury.create({
                    data: { type: body.type, balance: 0 }
                });
            }

            // 2. Add Transaction
            const amount = parseFloat(body.amount);
            const isDeposit = body.transactionType === 'IN';

            const transaction = await tx.treasuryTransaction.create({
                data: {
                    treasuryId: treasury.id,
                    type: body.transactionType, // IN, OUT
                    amount: amount,
                    channel: body.channel || 'CASH', // BANK, CASH, VODAFONE
                    description: body.description,
                    refNumber: body.refNumber || null
                }
            });

            // 3. Update Balance
            const newBalance = isDeposit ? treasury.balance + amount : treasury.balance - amount;
            await tx.treasury.update({
                where: { id: treasury.id },
                data: { balance: newBalance }
            });

            return { treasury, transaction };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        await logSystemError('API/Treasury/POST', error);
        return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            const transaction = await tx.treasuryTransaction.findUnique({
                where: { id },
                include: { treasury: true }
            });

            if (!transaction) throw new Error('الحركة غير موجودة');

            // عكس الحركة في الرصيد
            const isDeposit = transaction.type === 'IN';
            const adjustment = isDeposit ? -transaction.amount : transaction.amount;

            await tx.treasury.update({
                where: { id: transaction.treasuryId },
                data: { balance: { increment: adjustment } }
            });

            // حذف الحركة الأساسية
            await tx.treasuryTransaction.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        await logSystemError('API/Treasury/DELETE', error);
        return NextResponse.json({ error: error.message || 'فشل حذف الحركة' }, { status: 500 });
    }
}
