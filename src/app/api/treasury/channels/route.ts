import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const channels = await prisma.treasury.findMany({
            select: { id: true, type: true, name: true, color: true, balance: true, bankId: true, logoPath: true }
        });
        return NextResponse.json(channels);
    } catch (error) {
        await logSystemError('API/TreasuryChannels/GET', error);
        return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, name, color, bankId, logoPath } = body;

        if (!type || !name) {
            return NextResponse.json({ error: 'النوع والاسم مطلوبان' }, { status: 400 });
        }

        // @ts-ignore: Prisma schema needs reset due to EPERM
        const channel = await prisma.treasury.upsert({
            where: { type },
            update: { name, color, bankId, logoPath },
            create: { type, name, color, bankId, logoPath, balance: 0 }
        });

        return NextResponse.json(channel);
    } catch (error) {
        await logSystemError('API/TreasuryChannels/POST', error);
        return NextResponse.json({ error: 'فشل حفظ القناة' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID مطلوب' }, { status: 400 });

        // التحقق من وجود حركات قبل الحذف
        const txn = await prisma.treasuryTransaction.findFirst({
            where: { treasuryId: id }
        });

        if (txn) {
            return NextResponse.json({ error: 'لا يمكن حذف قناة تحتوي على حركات مالية' }, { status: 400 });
        }

        await prisma.treasury.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        await logSystemError('API/TreasuryChannels/DELETE', error);
        return NextResponse.json({ error: 'فشل حذف القناة' }, { status: 500 });
    }
}
