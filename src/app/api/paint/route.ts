import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            where: {
                description: { startsWith: 'دهان:' },
                jobId: { not: null }
            },
            include: {
                job: {
                    include: {
                        invoice: {
                            include: { client: true }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(expenses);
    } catch (error) {
        await logSystemError('API/Paint/GET', error);
        return NextResponse.json({ error: 'Failed to fetch paint expenses' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, amount, description } = await req.json();

        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

        const difference = (parseFloat(amount) || 0) - expense.amount;

        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.expense.update({
                where: { id },
                data: { amount: parseFloat(amount) || 0, description }
            });

            if (expense.jobId) {
                const job = await tx.manufacturingJob.findUnique({ where: { id: expense.jobId } });
                if (job) {
                    await tx.manufacturingJob.update({
                        where: { id: job.id },
                        data: {
                            totalOperatingCost: job.totalOperatingCost + difference,
                            netProfit: job.netProfit !== null ? job.netProfit - difference : null
                        }
                    });
                }
            }
            return updated;
        });

        return NextResponse.json(result);
    } catch (error) {
        await logSystemError('API/Paint/PUT', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            if (expense.jobId) {
                const job = await tx.manufacturingJob.findUnique({ where: { id: expense.jobId } });
                if (job) {
                    await tx.manufacturingJob.update({
                        where: { id: job.id },
                        data: {
                            totalOperatingCost: job.totalOperatingCost - expense.amount,
                            netProfit: job.netProfit !== null ? job.netProfit + expense.amount : null
                        }
                    });
                }
            }
            await tx.expense.delete({ where: { id } });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        await logSystemError('API/Paint/DELETE', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
