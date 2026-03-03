import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';

export async function GET() {
    try {
        const templates = await prisma.whatsAppTemplate.findMany();
        return NextResponse.json(templates);
    } catch (error) {
        console.error('Failed to fetch WhatsApp templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const data = await req.json();
        const { type, message, active } = data;

        if (!type || message === undefined) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const template = await prisma.whatsAppTemplate.upsert({
            where: { type },
            update: { message, active: active ?? true },
            create: { type, message, active: active ?? true },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Failed to update WhatsApp template:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}
