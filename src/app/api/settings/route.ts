import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings — return all settings as a flat object { key: value }
export async function GET() {
    try {
        const rows = await prisma.setting.findMany();
        const obj: Record<string, string> = {};
        rows.forEach(r => { obj[r.key] = r.value; });
        return NextResponse.json(obj);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PUT /api/settings — upsert multiple settings atomically
// Body: { key: value, ... }
export async function PUT(req: Request) {
    try {
        const body: Record<string, string> = await req.json();
        const ops = Object.entries(body).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                create: { key, value },
                update: { value },
            })
        );
        await prisma.$transaction(ops);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
