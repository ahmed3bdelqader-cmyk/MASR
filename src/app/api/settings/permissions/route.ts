import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';

const DEFAULT_PERMISSIONS = {
    '/clients': ['ADMIN', 'ACCOUNTANT', 'SALES'],
    '/sales': ['ADMIN', 'ACCOUNTANT', 'SALES'],
    '/jobs': ['ADMIN', 'ACCOUNTANT', 'SALES'],
    '/paint': ['ADMIN', 'ACCOUNTANT'],
    '/inventory': ['ADMIN', 'INVENTORY', 'ACCOUNTANT'],
    '/purchases': ['ADMIN', 'INVENTORY', 'ACCOUNTANT'],
    '/products': ['ADMIN', 'INVENTORY', 'ACCOUNTANT', 'SALES'],
    '/treasury': ['ADMIN', 'ACCOUNTANT'],
    '/employees': ['ADMIN', 'ACCOUNTANT'],
    '/settings': ['ADMIN'],
    '/database': ['ADMIN'],
    '/print-template': ['ADMIN'],
    '/permissions': ['ADMIN']
};

export async function GET() {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: 'role_permissions' }
        });

        if (!setting) {
            return NextResponse.json(DEFAULT_PERMISSIONS);
        }

        return NextResponse.json(JSON.parse(setting.value));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        await prisma.setting.upsert({
            where: { key: 'role_permissions' },
            update: { value: JSON.stringify(data) },
            create: { key: 'role_permissions', value: JSON.stringify(data) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
    }
}
