import prisma from './prisma';

export async function logSystemError(page: string, error: any, user?: string) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';

    // Still log to console for development visibility
    console.error(`[SystemLog] ${page}: ${message}`);

    try {
        await (prisma as any).systemLog.create({
            data: {
                page,
                message: `${message}${stack ? '\nStack: ' + stack.substring(0, 500) : ''}`,
                user: user || 'System/API',
                level: 'ERROR'
            }
        });
    } catch (logErr) {
        console.error('CRITICAL: Failed to write to SystemLog table:', logErr);
    }
}

export async function logSystemInfo(page: string, message: string, user?: string) {
    try {
        await (prisma as any).systemLog.create({
            data: {
                page,
                message,
                user: user || 'System/API',
                level: 'INFO'
            }
        });
    } catch (logErr) {
        console.error('Failed to write info log:', logErr);
    }
}
