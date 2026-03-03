import { NextResponse } from 'next/server';
import mysqldump from 'mysqldump';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
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

        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `StandMasr_Backup_${dateStr}.sql`;
        const tmpPath = path.join(process.cwd(), fileName);

        await mysqldump({
            connection: {
                host,
                port: port ? parseInt(port) : 3306,
                user: username,
                password: password,
                database: dbName,
            },
            dumpToFile: tmpPath,
        });

        const fileBuffer = fs.readFileSync(tmpPath);
        fs.unlinkSync(tmpPath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Type': 'application/sql',
            }
        });

    } catch (error: any) {
        console.error('Backup Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'فشل تكوين النسخة الاحتياطية' }, { status: 500 });
    }
}
