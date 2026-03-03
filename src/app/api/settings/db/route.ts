import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getEnvPath() {
    return path.join(process.cwd(), '.env');
}

export async function GET() {
    try {
        const envPath = getEnvPath();
        let dbUrl = '';
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/^DATABASE_URL="(.*)"/m);
            if (match && match[1]) {
                dbUrl = match[1];
            }
        }

        // Parse something like: mysql://user:password@host:port/dbname
        let host = 'localhost', port = '3306', dbName = '', username = '', password = '';
        if (dbUrl.startsWith('mysql://')) {
            const stripped = dbUrl.replace('mysql://', '');
            const [auth, server] = stripped.split('@');
            if (auth && server) {
                const [userRaw, ...passArr] = auth.split(':');
                username = decodeURIComponent(userRaw);
                password = decodeURIComponent(passArr.join(':'));

                const [hostPort, dbSchema] = server.split('/');
                const [h, p] = hostPort.split(':');
                host = h;
                if (p) port = p;
                if (dbSchema) {
                    dbName = dbSchema.split('?')[0];
                }
            }
        }

        return NextResponse.json({ success: true, host, port, dbName, username, password });
    } catch (error) {
        console.error('Error reading env:', error);
        return NextResponse.json({ success: false, error: 'Failed to read connection details' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { host, port, dbName, username, password } = await req.json();

        if (!host || !dbName || !username) {
            return NextResponse.json({ success: false, error: 'بيانات الاتصال غير مكتملة' }, { status: 400 });
        }

        const encodedUser = encodeURIComponent(username);
        const encodedPass = encodeURIComponent(password);
        const newUrl = `mysql://${encodedUser}:${encodedPass}@${host}:${port || 3306}/${dbName}`;

        const envPath = getEnvPath();
        let currentEnv = '';
        if (fs.existsSync(envPath)) {
            currentEnv = fs.readFileSync(envPath, 'utf8');
        }

        const newEnvLine = `DATABASE_URL="${newUrl}"`;
        if (currentEnv.match(/^DATABASE_URL=/m)) {
            currentEnv = currentEnv.replace(/^DATABASE_URL=.*$/m, newEnvLine);
        } else {
            currentEnv += `\n${newEnvLine}\n`;
        }

        fs.writeFileSync(envPath, currentEnv, 'utf8');

        return NextResponse.json({ success: true, message: 'تم حفظ بيانات الاتصال بنجاح. يرجى إعادة تشغيل السيرفر (Restart) لتطبيق التغييرات.' });
    } catch (error) {
        console.error('Error writing env:', error);
        return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تحديث ملف .env' }, { status: 500 });
    }
}
