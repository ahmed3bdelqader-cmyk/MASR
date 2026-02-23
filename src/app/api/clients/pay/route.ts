import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/clients/pay — تسجيل دفعة تحصيل من عميل + ترحيل الخزينة في نفس الوقت
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // body: { clientId, amount, invoiceId?, channel, treasuryType, note }
        const amount = parseFloat(body.amount) || 0;
        const channel = body.channel || 'CASH';   // CASH | BANK | VODAFONE
        const treasuryType = body.treasuryType || 'MAIN'; // MAIN | BANK | VODAFONE_CASH
        const clientId = body.clientId;
        const invoiceId = body.invoiceId || null;

        if (!clientId || amount <= 0) {
            return NextResponse.json({ error: 'clientId و amount مطلوبان' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. تحقق من وجود العميل
            const client = await tx.client.findUnique({ where: { id: clientId } });
            if (!client) throw new Error('العميل غير موجود');

            // 2. احفظ دفعة العميل
            const payment = await tx.clientPayment.create({
                data: {
                    clientId,
                    invoiceId,
                    amount,
                    method: channel,
                }
            });

            // 3. لو كانت مرتبطة بفاتورة → حدّث حالتها
            if (invoiceId) {
                const invoice = await tx.invoice.findUnique({
                    where: { id: invoiceId },
                    include: { payments: true }
                });
                if (invoice) {
                    const totalPaid = invoice.payments.reduce((s: number, p: any) => s + p.amount, 0) + amount;
                    const newStatus = totalPaid >= invoice.total ? 'PAID'
                        : totalPaid > 0 ? 'PARTIAL'
                            : 'UNPAID';
                    await tx.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });
                }
            }

            // 4. تأكد من وجود الخزينة أو أنشئها
            let treasury = await tx.treasury.findUnique({ where: { type: treasuryType } });
            if (!treasury) {
                treasury = await tx.treasury.create({
                    data: { type: treasuryType, balance: 0 }
                });
            }

            // 5. أضف حركة الخزينة (إيداع/تحصيل = IN)
            const bankPart = body.bankName ? ` (${body.bankName})` : '';
            const desc = `تحصيل${bankPart} من: ${client.name}${body.invoiceRef ? ' - فاتورة ' + body.invoiceRef : ''}${body.note ? ' | ' + body.note : ''}`;
            const txRecord = await tx.treasuryTransaction.create({
                data: {
                    treasuryId: treasury.id,
                    type: 'IN',
                    amount,
                    channel,
                    description: desc,
                    refNumber: body.invoiceRef || null,
                    clientPaymentId: payment.id,
                }
            });

            // 6. حدّث رصيد الخزينة
            await tx.treasury.update({
                where: { id: treasury.id },
                data: { balance: treasury.balance + amount }
            });

            return { payment, txRecord, clientName: client.name };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'فشل تسجيل الدفعة' }, { status: 500 });
    }
}
