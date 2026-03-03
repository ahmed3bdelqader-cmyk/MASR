import { NextResponse } from 'next/server';
import prisma from '@/core/prisma';
import { logSystemError } from '@/core/logger';

// POST /api/payroll — تسجيل عملية صرف (راتب، سلفة، يومية، الخ)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // body: { employeeId, type, amount, treasuryType, channel, note, month, year }

        const amount = parseFloat(body.amount) || 0;
        const empId = body.employeeId;
        const type = body.type; // SALARY | DAILY_WAGE | ADVANCE | BONUS | PENALTY
        const treasuryType = body.treasuryType || 'MAIN';
        const channel = body.channel || 'CASH';

        if (!empId || amount <= 0 || !type) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. تحقق من الموظف
            const emp = await tx.employee.findUnique({ where: { id: empId } });
            if (!emp) throw new Error('الموظف غير موجود');

            // 2. تأكد من الخزينة وجاهزية الرصيد
            const treasury = await tx.treasury.findUnique({ where: { type: treasuryType } });
            if (!treasury || treasury.balance < amount) {
                // ملاحظة: قد نسمح بالسحب بالسالب في بعض الحالات، لكن نفضل المنع حالياً
                throw new Error('رصيد الخزينة غير كافٍ');
            }

            // 3. أنشئ حركة الخزينة (صرف = OUT) إلا لو كان نوعها جزاء (لا يؤثر على رصيد الخزينة بالسحب)
            const typeLabels: Record<string, string> = {
                SALARY: 'صرف راتب شهر',
                DAILY_WAGE: 'صرف يومية',
                ADVANCE: 'صرف سلفة',
                BONUS: 'مكافأة إضافية',
                PENALTY: 'خصم / جزاء للموظف'
            };

            const monthStr = body.month ? ` ش ${body.month}` : '';
            const yearStr = body.year ? `/${body.year}` : '';
            const desc = `${typeLabels[type] || type}${monthStr}${yearStr} للموظف: ${emp.name} ${body.note ? '| ' + body.note : ''}`;

            let treasuryTxId = null;

            // إذا لم يكن جزاء أو لم يطلب تخطي الخزينة، اخصمه من الخزينة
            if (type !== 'PENALTY' && body.skipTreasury !== true) {
                const treasuryTx = await tx.treasuryTransaction.create({
                    data: {
                        treasuryId: treasury.id,
                        type: 'OUT',
                        amount,
                        channel,
                        description: desc,
                    }
                });
                treasuryTxId = treasuryTx.id;

                await tx.treasury.update({
                    where: { id: treasury.id },
                    data: { balance: treasury.balance - amount }
                });
            }

            // 5. أنشئ سجل الرواتب
            const payroll = await tx.payrollTransaction.create({
                data: {
                    employeeId: empId,
                    type,
                    amount,
                    month: body.month || null,
                    year: body.year || null,
                    note: body.note,
                    treasuryTxId: treasuryTxId
                }
            });

            return { payroll, treasuryTxId };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/payroll — مسح حركة مالية (واسترجاع القيمة للخزينة إن وجدت)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. جلب الحركة
            const payrollTx = await tx.payrollTransaction.findUnique({
                where: { id }
            });

            if (!payrollTx) throw new Error('الحركة غير موجودة');

            // 2. إذا كانت هناك حركة خزينة مرتبطة (عملية سحب)، يجب إرجاع المبلغ للخزينة
            if (payrollTx.treasuryTxId) {
                const treasuryTx = await tx.treasuryTransaction.findUnique({
                    where: { id: payrollTx.treasuryTxId }
                });

                if (treasuryTx) {
                    await tx.treasury.update({
                        where: { id: treasuryTx.treasuryId },
                        data: { balance: { increment: treasuryTx.amount } }
                    });

                    // حذف حركة الخزينة المرتبطة
                    await tx.treasuryTransaction.delete({
                        where: { id: treasuryTx.id }
                    });
                }
            }

            // 3. حذف حركة الرواتب نفسها
            await tx.payrollTransaction.delete({
                where: { id }
            });

            return true;
        });

        return NextResponse.json({ success: true, result }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
