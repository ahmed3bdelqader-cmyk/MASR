import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // order matters due to foreign key constraints if not using TRUNCATE with cascade (MySQL can be picky)
        // or we can disable foreign key checks temporarily
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

        const tables = [
            'Client', 'ClientPayment', 'Supplier', 'SupplierPayment',
            'Attendance', 'PayrollTransaction', 'PurchaseInvoice', 'PurchaseItem',
            'MainCategory', 'InventoryItem', 'Product', 'Invoice', 'SaleItem',
            'Treasury', 'TreasuryTransaction', 'ExpenseCategory', 'ExpenseTransaction',
            'Expense', 'ManufacturingJob', 'JobMaterial', 'PaintEntry',
            'PaintPricingItem', 'SystemLog', 'ContactPhone', 'WhatsAppTemplate',
            'Setting', 'SystemSettings'
        ];

        for (const table of tables) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
        }

        // We keep Employee for now or at least keep the ADMIN one?
        // User said "don't forget any section", but typically you want to stay logged in.
        // Let's clear all employees EXCEPT those with role ADMIN.
        // Or better, just clear all except the current one if we knew it.
        // For safety, let's clear all Employees but maybe the user will be upset if they are locked out.
        // Actually, many reset systems clear everything and then you have to "register" again.
        // But if I use TRUNCATE on Employee, it's gone.
        // Let's do a DELETE on Employee where role != 'ADMIN'?
        // No, let's just clear everything as requested "everything".
        await prisma.$executeRawUnsafe('TRUNCATE TABLE `Employee`;');

        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

        return NextResponse.json({ success: true, message: '✅ تم تصفير البرنامج وحذف كافة البيانات بنجاح' });
    } catch (error: any) {
        console.error('Reset Error:', error);
        return NextResponse.json({ success: false, error: 'فشل تصفير البرنامج: ' + error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
