import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const categories = await prisma.mainCategory.findMany();
        return NextResponse.json(categories);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
