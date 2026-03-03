import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    try {
        const suppliers = await prisma.supplier.findMany({
            where: type ? { type } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                phones: true,
                purchases: { select: { id: true, invoiceNo: true, totalAmount: true, date: true } },
                paintJobs: { select: { id: true, productName: true, totalCost: true, createdAt: true } },
                supplierPayments: { select: { id: true, amount: true, date: true, method: true } }
            }
        });
        return NextResponse.json(suppliers);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        if (!data.phones || data.phones.length === 0 || !data.phones.some((p: any) => p.isPrimaryWhatsApp)) {
            return NextResponse.json({ error: 'يجب إضافة رقم هاتف واحد على الأقل وتحديده كواتساب أساسي' }, { status: 400 });
        }

        const lastSupplier = await prisma.supplier.findFirst({ orderBy: { serial: 'desc' } });
        const nextSerial = lastSupplier ? (lastSupplier.serial || 0) + 1 : 1;

        const supplier = await prisma.supplier.create({
            data: {
                serial: nextSerial,
                name: data.name,
                type: data.type || 'MATERIAL',
                address: data.address || null,
                balance: data.balance || 0,
                phones: {
                    create: data.phones.map((p: any) => ({
                        phone: p.phone,
                        isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                    }))
                }
            }
        });
        return NextResponse.json(supplier);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const data = await req.json();
        if (!data.phones || data.phones.length === 0 || !data.phones.some((p: any) => p.isPrimaryWhatsApp)) {
            return NextResponse.json({ error: 'يجب إضافة رقم هاتف واحد على الأقل وتحديده كواتساب أساسي' }, { status: 400 });
        }

        const supplier = await prisma.supplier.update({
            where: { id: data.id },
            data: {
                name: data.name,
                type: data.type,
                address: data.address,
                balance: data.balance,
                serial: data.serial, // Maintain serial on update
                phones: {
                    deleteMany: {},
                    create: data.phones.map((p: any) => ({
                        phone: p.phone,
                        isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                    }))
                }
            }
        });
        return NextResponse.json(supplier);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.supplier.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
