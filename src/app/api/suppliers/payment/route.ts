import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Record the supplier payment
            const payment = await tx.supplierPayment.create({
                data: {
                    supplierId: data.supplierId,
                    amount: data.amount,
                    method: data.method,
                    date: data.date ? new Date(data.date) : new Date(),
                }
            });

            // 2. Adjust supplier balance (subtract amount paid from their balance)
            const supplier = await tx.supplier.update({
                where: { id: data.supplierId },
                data: {
                    balance: {
                        decrement: data.amount // Paid them, so their balance goes down safely
                    }
                }
            });

            // 3. Treasury integration (Outflow)
            if (data.treasuryId) {
                const trTx = await tx.treasuryTransaction.create({
                    data: {
                        treasuryId: data.treasuryId,
                        type: 'OUT',
                        amount: data.amount,
                        channel: data.method,
                        description: `دفعة لمورد: ${supplier.name}`,
                        date: data.date ? new Date(data.date) : new Date()
                    }
                });

                await tx.treasury.update({
                    where: { id: data.treasuryId },
                    data: { balance: { decrement: data.amount } }
                });

                await tx.supplierPayment.update({
                    where: { id: payment.id },
                    data: { treasuryTxId: trTx.id }
                });
            }

            return { payment, supplier };
        });

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
