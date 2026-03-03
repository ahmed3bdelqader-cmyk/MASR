import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';



export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ success: false, error: 'لم يتم رفع أي ملف' }, { status: 400 });
        }

        const sqlContent = await file.text();
        if (!sqlContent || sqlContent.trim() === '') {
            return NextResponse.json({ success: false, error: 'الملف فارغ أو غير مقروء' }, { status: 400 });
        }

        // Get Credentials from .env
        const envPath = path.join(process.cwd(), '.env');
        let dbUrl = '';
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/^DATABASE_URL="(.*)"/m);
            if (match && match[1]) {
                dbUrl = match[1];
            }
        }

        if (!dbUrl.startsWith('mysql://')) {
            throw new Error('Not configured for MySQL');
        }

        const stripped = dbUrl.replace('mysql://', '');
        const [auth, server] = stripped.split('@');
        const [userRaw, ...passArr] = auth.split(':');
        const username = decodeURIComponent(userRaw);
        const password = decodeURIComponent(passArr.join(':'));
        const [hostPort, dbSchema] = server.split('/');
        const [host, port] = hostPort.split(':');
        const dbName = dbSchema.split('?')[0];

        // Connect with mysql2
        const connection = await mysql.createConnection({
            host,
            user: username,
            password,
            database: dbName,
            port: port ? parseInt(port) : 3306,
            multipleStatements: true,
        });

        // First disable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        // In a real scenario we'd drop tables first or assume the dump contains DROP TABLE IF EXISTS.
        // mysqldump npm package defaults to creating DROP TABLE IF EXISTS statements, so it is safe.

        // Execute the whole dump
        await connection.query(sqlContent);

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

        await connection.end();

        return NextResponse.json({ success: true, message: 'تم استعادة البيانات بنجاح.' });
    } catch (error: any) {
        console.error('Restore Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'فشل استرجاع النسخة الاحتياطية' }, { status: 500 });
    }
}
