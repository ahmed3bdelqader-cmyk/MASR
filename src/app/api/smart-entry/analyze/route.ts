import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

// Memory cache for API Key to avoid DB hitting on every request. Valid for 10 minutes.
let cachedApiKey: { key: string, time: number } | null = null;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'application/pdf';

        const prompt = `أنت محاسب محترف تعمل في مصنع أثاث معدني. قم بتحليل صورة الفاتورة المرفقة واستخرج البيانات التالية بدقة شديدة. يجب أن يكون الرد عبارة عن كائن JSON فقط (بدون أي نصوص إضافية) يطابق الهيكل التالي.
{
  "customer_name": "اسم العميل أو المورد",
  "invoice_date": "تاريخ الفاتورة YYYY-MM-DD",
  "invoice_number": "رقم الفاتورة",
  "items": [
    {
      "product_description": "بيان المنتج",
      "unit_price": 0,
      "quantity": 0,
      "total_price": 0
    }
  ],
  "grand_total": 0,
  "phone_number": "أي رقم هاتف موجود (أو فارغ إن لم يوجد)"
}`;

        let jsonResult: any = null;

        // Fetch AI Key from cache or DB
        let apiKey = '';
        if (cachedApiKey && (Date.now() - cachedApiKey.time < 10 * 60 * 1000)) {
            apiKey = cachedApiKey.key;
        } else {
            const settings = await prisma.systemSettings.findFirst();
            if (settings?.ai_api_key) {
                apiKey = decrypt(settings.ai_api_key);
                if (apiKey) cachedApiKey = { key: apiKey, time: Date.now() };
            }
        }

        if (!apiKey) {
            throw new Error("يرجى إعداد وتحميل مفتاح الذكاء الاصطناعي (Gemini API) السري من صفحة الإعدادات أولاً (تبويب الذكاء الاصطناعي).");
        }

        try {
            // Direct standard `fetch` call to Gemini 2.5 flash API
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: buffer.toString('base64')
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);
            }
        } catch (err: any) {
            console.error("Gemini API Error:", err);
            const isAuthError = err.message && err.message.includes('API key');
            if (isAuthError) {
                // Invalidate cache if there's an auth error (maybe key changed or revoked)
                cachedApiKey = null;
                throw new Error("مفتاح الذكاء الاصطناعي غير صحيح، يرجى مراجعة إعدادات الربط.");
            }
            throw new Error("فشل الذكاء الاصطناعي في الاستخراج. " + err.message);
        }

        // --- FALLBACK REMOVED ---
        if (!jsonResult) {
            throw new Error("تعذر على الذكاء الاصطناعي قراءة البيانات بالصيغة المطلوبة، يرجى المحاولة بصورة أوضح.");
        }

        // Map the forced schema to our Frontend format structure:
        const mappedItems = jsonResult.items.map((item: any, index: number) => ({
            id: String(index + 1),
            name: item.product_description,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unit_price) || 0,
            total: Number(item.total_price) || 0
        }));

        const finalData = {
            partyName: String(jsonResult.customer_name),
            partyPhone: String(jsonResult.phone_number || ''),
            items: mappedItems,
            total: Number(jsonResult.grand_total) || 0
        };

        // Return the structured JSON
        return NextResponse.json({
            success: true,
            data: finalData,
            isFallback: false
        });

    } catch (error: any) {
        console.error('Analyze API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
