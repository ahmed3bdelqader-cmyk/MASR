const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const emps = await prisma.employee.findMany();
        console.log('Success! Found', emps.length, 'employees');
        console.log('Model keys:', Object.keys(prisma.employee));
    } catch (e) {
        console.error('Prisma Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
