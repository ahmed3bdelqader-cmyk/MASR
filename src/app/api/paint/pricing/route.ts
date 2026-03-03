import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

export async function GET() {
    try {
        const items = await prisma.paintPricingItem.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        await logSystemError('API/PaintPricing/GET', error);
        return NextResponse.json({ error: 'Failed to fetch paint pricing items' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.description || !body.price) {
            return NextResponse.json({ error: 'البيان والسعر مطلوبان' }, { status: 400 });
        }

        const item = await prisma.paintPricingItem.create({
            data: {
                description: body.description,
                price: parseFloat(body.price) || 0
            }
        });
        return NextResponse.json(item, { status: 201 });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'هذا البيان مسجل مسبقاً' }, { status: 400 });
        }
        await logSystemError('API/PaintPricing/POST', error);
        return NextResponse.json({ error: 'Failed to create paint pricing item' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, description, price } = body;

        if (!id || !description || price === undefined) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const item = await prisma.paintPricingItem.update({
            where: { id },
            data: {
                description,
                price: parseFloat(price) || 0
            }
        });
        return NextResponse.json(item);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'هذا البيان مسجل مسبقاً' }, { status: 400 });
        }
        await logSystemError('API/PaintPricing/PUT', error);
        return NextResponse.json({ error: 'Failed to update paint pricing item' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            const body = await req.json().catch(() => ({}));
            if (body.id) {
                await prisma.paintPricingItem.delete({ where: { id: body.id } });
                return NextResponse.json({ success: true });
            }
            return NextResponse.json({ error: 'معرف البند مطلوب' }, { status: 400 });
        }

        await prisma.paintPricingItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        await logSystemError('API/PaintPricing/DELETE', error);
        return NextResponse.json({ error: 'Failed to delete paint pricing item' }, { status: 500 });
    }
}
