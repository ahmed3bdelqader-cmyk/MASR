import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        // 1. Find employee by username only (never pass password to DB query)
        const employee = await prisma.employee.findFirst({
            where: {
                username,
                canLogin: true
            }
        });

        if (employee && employee.password) {
            // 2a. Try bcrypt comparison first (for hashed passwords)
            let passwordMatch = false;

            const isHashed = employee.password.startsWith('$2');
            if (isHashed) {
                passwordMatch = await bcrypt.compare(password, employee.password);
            } else {
                // 2b. Fallback: plain-text comparison (legacy) — then auto-upgrade to hash
                passwordMatch = employee.password === password;
                if (passwordMatch) {
                    // ✅ Auto-upgrade: hash the password for next time
                    const hashed = await bcrypt.hash(password, 10);
                    await prisma.employee.update({
                        where: { id: employee.id },
                        data: { password: hashed }
                    });
                }
            }

            if (passwordMatch) {
                // Update lastLogin and lastActive
                await prisma.employee.update({
                    where: { id: employee.id },
                    data: {
                        lastLogin: new Date(),
                        lastActive: new Date()
                    }
                });

                return NextResponse.json({
                    success: true,
                    user: {
                        id: employee.id,
                        name: employee.name,
                        role: employee.role,
                        username: employee.username
                    }
                });
            }
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/auth/hash — utility to hash a password (admin use only)
export async function PUT(req: Request) {
    try {
        const { password } = await req.json();
        if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });
        const hashed = await bcrypt.hash(password, 10);
        return NextResponse.json({ hashed });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
