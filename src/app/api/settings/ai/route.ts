import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { encrypt, decrypt } from '@/core/encryption';

export async function GET() {
    try {
        const settings = await prisma.systemSettings.findFirst();

        let apiKey = '';
        if (settings?.ai_api_key) {
            apiKey = decrypt(settings.ai_api_key);
        }

        return NextResponse.json({ success: true, ai_api_key: apiKey });
    } catch (error: any) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ success: false, error: 'تعذر جلب الإعدادات' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { ai_api_key } = data;

        let settings = await prisma.systemSettings.findFirst();

        const encryptedKey = ai_api_key ? encrypt(ai_api_key) : null;

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: { ai_api_key: encryptedKey }
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: { ai_api_key: encryptedKey }
            });
        }

        // We emit a dummy response and let the client know success.
        return NextResponse.json({ success: true, message: 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح' });
    } catch (error: any) {
        console.error('Settings POST Error:', error);
        return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حفظ الإعدادات' }, { status: 500 });
    }
}
