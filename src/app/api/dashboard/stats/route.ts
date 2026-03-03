import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns';

export async function GET() {
    try {
        // 1. KPI Data
        const treasurySum = await prisma.treasury.aggregate({
            _sum: { balance: true }
        });

        const receivablesSum = await prisma.invoice.aggregate({
            where: { status: { in: ['UNPAID', 'PARTIAL'] } },
            _sum: { total: true }
        });

        const suppliersBalance = await prisma.supplier.aggregate({
            _sum: { balance: true }
        });

        const pendingPaintSum = await prisma.paintEntry.aggregate({
            where: { status: 'PENDING_PAYMENT' },
            _sum: { totalCost: true }
        });

        const activeJobsCount = await prisma.manufacturingJob.count({
            where: { status: 'IN_PROGRESS' }
        });

        // 2. Bar Chart: Sales vs Expenses (Last 6 Months)
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

        const invoices = await prisma.invoice.findMany({
            where: { date: { gte: sixMonthsAgo } },
            select: { total: true, date: true }
        });

        const expenses = await prisma.expenseTransaction.findMany({
            where: { date: { gte: sixMonthsAgo } },
            select: { amount: true, date: true }
        });

        // Grouping
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = subMonths(new Date(), i);
            const monthLabel = format(monthDate, 'MMM yyyy');
            const start = startOfMonth(monthDate);
            const end = endOfMonth(monthDate);

            const monthSales = invoices
                .filter(inv => inv.date >= start && inv.date <= end)
                .reduce((sum, inv) => sum + inv.total, 0);

            const monthExpenses = expenses
                .filter(exp => exp.date >= start && exp.date <= end)
                .reduce((sum, exp) => sum + exp.amount, 0);

            chartData.push({
                name: monthLabel,
                sales: monthSales,
                expenses: monthExpenses
            });
        }

        // 3. Donut Chart: Expenses by Category (Current Month)
        const currentMonthStart = startOfMonth(new Date());
        const expenseCategories = await prisma.expenseTransaction.findMany({
            where: { date: { gte: currentMonthStart } },
            include: { category: true }
        });

        const expenseDistributionMap: Record<string, number> = {};
        expenseCategories.forEach(exp => {
            const catName = exp.category.name;
            expenseDistributionMap[catName] = (expenseDistributionMap[catName] || 0) + exp.amount;
        });

        const donutData = Object.entries(expenseDistributionMap).map(([name, value]) => ({ name, value }));

        // 4. Low Stock Alerts
        const lowStockItems = await prisma.inventoryItem.findMany({
            where: {
                stock: { lt: prisma.inventoryItem.fields.minStockLevel }
            },
            take: 10
        });

        // 5. Recent Manufacturing Jobs
        const recentJobs = await prisma.manufacturingJob.findMany({
            where: { status: { not: 'COMPLETED' } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return NextResponse.json({
            kpis: {
                liquidity: treasurySum._sum.balance || 0,
                receivables: receivablesSum._sum.total || 0,
                debts: (suppliersBalance._sum.balance || 0) + (pendingPaintSum._sum.totalCost || 0),
                activeJobs: activeJobsCount
            },
            chartData,
            donutData,
            lowStockItems,
            recentJobs
        });
    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
