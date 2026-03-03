import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logSystemError } from '@/lib/logger';

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                phones: true,
                invoices: {
                    select: { id: true, total: true, status: true, invoiceNo: true, date: true }
                },
                payments: {
                    select: { amount: true, paymentDate: true, method: true }
                }
            }
        });

        // ✅ إصلاح: حساب الرصيد المتبقي فعلياً (بدون الفواتير المدفوعة بالكامل)
        const enrichedClients = clients.map(client => {
            const totalInvoices = client.invoices.reduce((acc, inv) => acc + inv.total, 0);
            const totalPayments = client.payments.reduce((acc, pay) => acc + pay.amount, 0);
            const unpaidInvoices = client.invoices.filter(inv => inv.status !== 'PAID');
            const unpaidTotal = unpaidInvoices.reduce((acc, inv) => acc + inv.total, 0);

            return {
                ...client,
                totalInvoices,
                totalPayments,
                unpaidTotal,
                // الرصيد الحقيقي = إجمالي الفواتير - ما تم دفعه
                balanceDue: Math.max(0, totalInvoices - totalPayments)
            };
        });

        return NextResponse.json(enrichedClients);
    } catch (error) {
        await logSystemError('API/Clients/GET', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const lastClient = await prisma.client.findFirst({ orderBy: { serial: 'desc' } });
        let nextSerial = lastClient && lastClient.serial ? lastClient.serial + 1 : 1;

        if (Array.isArray(body)) {
            // Batch create
            const created = [];
            for (const item of body) {
                const client = await prisma.client.create({
                    data: {
                        serial: nextSerial++,
                        name: item.name,
                        storeName: item.storeName || null,
                        address: item.address || null,
                        email: item.email || null,
                        phones: {
                            create: (item.phones || []).length > 0
                                ? item.phones.map((p: any) => ({
                                    phone: p.phone,
                                    isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                                }))
                                : []
                        }
                    }
                });
                created.push(client);
            }
            return NextResponse.json(created, { status: 201 });
        } else {
            // Single create
            if (!body.phones || body.phones.length === 0 || !body.phones.some((p: any) => p.isPrimaryWhatsApp)) {
                return NextResponse.json({ error: 'يجب إضافة رقم هاتف واحد على الأقل وتحديده كواتساب أساسي' }, { status: 400 });
            }

            const client = await prisma.client.create({
                data: {
                    serial: nextSerial,
                    name: body.name,
                    storeName: body.storeName || null,
                    address: body.address || null,
                    email: body.email || null,
                    phones: {
                        create: body.phones.map((p: any) => ({
                            phone: p.phone,
                            isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                        }))
                    }
                }
            });
            return NextResponse.json(client, { status: 201 });
        }
    } catch (error) {
        await logSystemError('API/Clients/POST', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}

// ✅ إضافة جديدة: تعديل بيانات عميل
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: 'Client ID required' }, { status: 400 });

        if (!body.phones || body.phones.length === 0 || !body.phones.some((p: any) => p.isPrimaryWhatsApp)) {
            return NextResponse.json({ error: 'يجب إضافة رقم هاتف واحد على الأقل وتحديده كواتساب أساسي' }, { status: 400 });
        }

        const client = await prisma.client.update({
            where: { id },
            data: {
                name: data.name,
                storeName: data.storeName || null,
                address: data.address || null,
                email: data.email || null,
                phones: {
                    deleteMany: {},
                    create: data.phones.map((p: any) => ({
                        phone: p.phone,
                        isPrimaryWhatsApp: !!p.isPrimaryWhatsApp
                    }))
                }
            }
        });

        return NextResponse.json(client);
    } catch (error: any) {
        await logSystemError('API/Clients/PUT', error);
        return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
    }
}

// ✅ إضافة جديدة: حذف عميل
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Client ID required' }, { status: 400 });

        // تحقق من عدم وجود فواتير مرتبطة بالعميل قبل الحذف
        const invoicesCount = await prisma.invoice.count({ where: { clientId: id } });
        if (invoicesCount > 0) {
            return NextResponse.json(
                { error: `لا يمكن حذف العميل — لديه ${invoicesCount} فاتورة مسجلة` },
                { status: 400 }
            );
        }

        await prisma.clientPayment.deleteMany({ where: { clientId: id } });
        await prisma.client.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        await logSystemError('API/Clients/DELETE', error);
        return NextResponse.json({ error: error.message || 'Failed to delete client' }, { status: 500 });
    }
}
