import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const level = searchParams.get('level');

        const logs = await (prisma as any).systemLog.findMany({
            where: level ? { level } : {},
            orderBy: { timestamp: 'desc' },
            take: limit
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await (prisma as any).systemLog.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error) {
        await logSystemError('API/Logs/DELETE', error);
        return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
    }
}
