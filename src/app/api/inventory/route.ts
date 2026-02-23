import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const items = await prisma.inventoryItem.findMany({ orderBy: { updatedAt: 'desc' } });
        return NextResponse.json(items);
    } catch (error) {
        await logSystemError('API/Inventory/GET', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const item = await prisma.inventoryItem.create({
            data: {
                type: body.type,
                category: body.category || null,
                name: body.name,
                stock: parseFloat(body.stock) || 0,
                unit: body.unit
            }
        });
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        await logSystemError('API/Inventory/POST', error);
        return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, stock, unit, category, type } = body;
        const item = await prisma.inventoryItem.update({
            where: { id },
            data: {
                name,
                stock: parseFloat(stock) || 0,
                unit,
                category: category || null,
                type,
            }
        });
        return NextResponse.json(item);
    } catch (error) {
        await logSystemError('API/Inventory/PUT', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        await prisma.inventoryItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        await logSystemError('API/Inventory/DELETE', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
