import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        await logSystemError('API/Products/GET', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const dimStr = `${body.height}x${body.width}x${body.depth}`;

        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    code: body.code,
                    name: body.name,
                    description: body.description || null,
                    dimensions: dimStr,
                    height: body.height,
                    width: body.width,
                    depth: body.depth,
                    coating: body.coating || null,
                    material: body.material || null,
                    price: parseFloat(body.price) || 0,
                    stock: parseInt(body.stock) || 0
                }
            });

            // Sync with smart inventory
            await tx.inventoryItem.create({
                data: {
                    type: 'FINAL_PRODUCT',
                    name: body.name,
                    stock: parseFloat(body.stock) || 0,
                    unit: 'قطعة',
                    lastPurchasedPrice: 0 // Manufactured items don't have purchase price
                }
            });

            return newProduct;
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        await logSystemError('API/Products/POST', error);
        return NextResponse.json({ error: error?.message || 'Failed to create product' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        if (!body.id) throw new Error('Product ID is required');

        const dimStr = `${body.height}x${body.width}x${body.depth}`;

        const updatedProduct = await prisma.$transaction(async (tx) => {
            const originalProduct = await tx.product.findUnique({ where: { id: body.id } });

            const product = await tx.product.update({
                where: { id: body.id },
                data: {
                    code: body.code,
                    name: body.name,
                    description: body.description || null,
                    dimensions: dimStr,
                    height: body.height,
                    width: body.width,
                    depth: body.depth,
                    price: parseFloat(body.price) || 0,
                    stock: parseInt(body.stock) || 0
                }
            });

            // also try to update the name/stock in inventory if name matches original
            if (originalProduct) {
                const invItem = await tx.inventoryItem.findFirst({
                    where: { type: 'FINAL_PRODUCT', name: originalProduct.name }
                });
                if (invItem) {
                    await tx.inventoryItem.update({
                        where: { id: invItem.id },
                        data: {
                            name: body.name,
                            stock: parseFloat(body.stock) || 0,
                        }
                    });
                }
            }

            return product;
        });

        return NextResponse.json(updatedProduct, { status: 200 });
    } catch (error: any) {
        await logSystemError('API/Products/PUT', error);
        return NextResponse.json({ error: error?.message || 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        if (!body.id) throw new Error('Product ID is required');

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: body.id } });
            if (!product) throw new Error('المنتج غير موجود');

            // Remove linked inventory item by name match
            const invItem = await tx.inventoryItem.findFirst({
                where: { type: 'FINAL_PRODUCT', name: product.name }
            });
            if (invItem) {
                await tx.inventoryItem.delete({ where: { id: invItem.id } });
            }

            await tx.product.delete({ where: { id: body.id } });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        await logSystemError('API/Products/DELETE', error);
        return NextResponse.json({ error: error?.message || 'Failed to delete product' }, { status: 500 });
    }
}
