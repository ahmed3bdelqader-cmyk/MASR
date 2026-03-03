import { PrismaClient } from '@prisma/client';
import { fakerAR as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 بدء عملية توليد البيانات التجريبية (10 بنود لكل نوع)...');

    // تنظيف البيانات الحالية لتجنب تعارض الـ unique constraints
    console.log('🧹 تنظيف قاعدة البيانات...');
    await prisma.clientPayment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchaseInvoice.deleteMany();
    await prisma.payrollTransaction.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.jobMaterial.deleteMany();
    await prisma.paintEntry.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.manufacturingJob.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.mainCategory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.contactPhone.deleteMany();
    await prisma.supplierPayment.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.client.deleteMany();
    await prisma.expenseTransaction.deleteMany();
    await prisma.expenseCategory.deleteMany();
    await prisma.treasuryTransaction.deleteMany();
    await prisma.treasury.deleteMany();
    await prisma.paintPricingItem.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.systemLog.deleteMany();
    await prisma.whatsAppTemplate.deleteMany();

    // 1. الخزينة
    console.log('💰 إنشاء الخزائن...');
    const treasuries = [];
    const treasuryTypes = ['MAIN', 'BANK', 'VODAFONE_CASH'];
    const treasuryNames = ['الخزينة الرئيسية', 'الحساب البنكي', 'فودافون كاش'];
    for (let i = 0; i < treasuryTypes.length; i++) {
        treasuries.push(await prisma.treasury.create({
            data: {
                type: treasuryTypes[i],
                name: treasuryNames[i],
                balance: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 }),
                color: faker.internet.color()
            }
        }));
    }

    // 2. تصنيفات المصروفات
    console.log('📁 إنشاء تصنيفات المصروفات...');
    const expenseCategories = [];
    const catNames = ['كهرباء وظل', 'صيانة ماكينات', 'إيجار المصنع', 'أجور إضافية', 'نقل وشحن', 'أدوات مكتبية', 'ضيافة', 'بوفيه', 'إصلاحات طارئة', 'أخرى'];
    for (let i = 0; i < 10; i++) {
        expenseCategories.push(await prisma.expenseCategory.create({
            data: { name: catNames[i] }
        }));
    }

    // 3. العملاء
    console.log('👥 إنشاء العملاء...');
    const clients = [];
    for (let i = 0; i < 10; i++) {
        clients.push(await prisma.client.create({
            data: {
                serial: 1000 + i,
                name: faker.person.fullName(),
                storeName: faker.company.name(),
                address: faker.location.city() + ', ' + faker.location.streetAddress(),
                email: faker.internet.email(),
                phones: {
                    create: [{ phone: faker.phone.number(), isPrimaryWhatsApp: true }]
                }
            }
        }));
    }

    // 4. الموردين
    console.log('🚚 إنشاء الموردين...');
    const suppliers = [];
    for (let i = 0; i < 10; i++) {
        suppliers.push(await prisma.supplier.create({
            data: {
                serial: 2000 + i,
                name: faker.company.name(),
                type: faker.helpers.arrayElement(['MATERIAL', 'PAINT', 'OTHER']),
                address: faker.location.streetAddress(),
                balance: faker.number.float({ min: -5000, max: 15000, fractionDigits: 2 }),
                phones: {
                    create: [{ phone: faker.phone.number(), isPrimaryWhatsApp: true }]
                }
            }
        }));
    }

    // 5. الموظفين
    console.log('👷 إنشاء الموظفين...');
    const employees = [];
    const jobTitles = ['مهندس نجارة', 'فني لحام', 'عامل إنتاج', 'محاسب', 'أمين مخزن', 'سائق', 'مدير جودة', 'عامل تجميع', 'فني دهان', 'مشرف وردية'];
    for (let i = 0; i < 10; i++) {
        employees.push(await prisma.employee.create({
            data: {
                employeeId: 3000 + i,
                name: faker.person.fullName(),
                title: jobTitles[i],
                department: faker.helpers.arrayElement(['الإنتاج', 'الحسابات', 'المخازن', 'الإدارة']),
                baseSalary: faker.number.int({ min: 4000, max: 20000 }),
                contractType: faker.helpers.arrayElement(['MONTHLY', 'DAILY']),
                nationalId: faker.string.numeric(14),
                phones: {
                    create: [{ phone: faker.phone.number(), isPrimaryWhatsApp: true }]
                }
            }
        }));
    }

    // 6. التصنيفات الرئيسية للمخزن
    console.log('🏷️ إنشاء تصنيفات المخزن...');
    const mainCategories = [];
    const mainCatNames = ['مواسير حديد', 'ألواح صاج', 'إكسسوارات', 'مواد كيميائية', 'دهانات بودرة', 'قطع غيار', 'أدوات تغليف', 'مواد خام خشبية', 'علب معدنية', 'بلاستيكات'];
    for (let i = 0; i < 10; i++) {
        mainCategories.push(await prisma.mainCategory.create({
            data: {
                name: mainCatNames[i],
                formType: faker.helpers.arrayElement(['METAL_FORM', 'STANDARD_FORM', 'PAINT_FORM'])
            }
        }));
    }

    // 7. أصناف المخزن
    console.log('📦 إنشاء أصناف المخزن...');
    const inventoryItems = [];
    for (let i = 0; i < 10; i++) {
        inventoryItems.push(await prisma.inventoryItem.create({
            data: {
                name: faker.commerce.productName(),
                type: faker.helpers.arrayElement(['MATERIAL', 'FINAL_PRODUCT']),
                mainCategoryId: mainCategories[i].id,
                stock: faker.number.float({ min: 10, max: 1000 }),
                minStockLevel: 20,
                unit: faker.helpers.arrayElement(['متر', 'كيلو', 'قطعة', 'علبة']),
                lastPurchasedPrice: faker.number.float({ min: 10, max: 500 })
            }
        }));
    }

    // 8. المنتجات
    console.log('🎁 إنشاء المنتجات...');
    const products = [];
    for (let i = 0; i < 10; i++) {
        products.push(await prisma.product.create({
            data: {
                code: `PRD-${1000 + i}`,
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: faker.number.int({ min: 500, max: 10000 }),
                stock: faker.number.int({ min: 5, max: 50 }),
                dimensions: '100x200x50'
            }
        }));
    }

    // 9. فواتير المبيعات
    console.log('📄 إنشاء فواتير المبيعات...');
    for (let i = 0; i < 10; i++) {
        const subtotal = faker.number.int({ min: 1000, max: 5000 });
        await prisma.invoice.create({
            data: {
                invoiceNo: `INV-${Date.now()}-${i}`,
                clientId: clients[i].id,
                subtotal: subtotal,
                total: subtotal,
                status: faker.helpers.arrayElement(['PAID', 'UNPAID', 'PARTIAL']),
                sales: {
                    create: [{
                        productId: products[i].id,
                        quantity: faker.number.int({ min: 1, max: 5 }),
                        unitPrice: subtotal / 1,
                        totalPrice: subtotal
                    }]
                }
            }
        });
    }

    // 10. أوامر التصنيع
    console.log('⚙️ إنشاء أوامر التصنيع...');
    for (let i = 0; i < 10; i++) {
        await prisma.manufacturingJob.create({
            data: {
                serialNo: 5000 + i,
                name: `أمر تصنيع: ${faker.commerce.productName()}`,
                status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
                stage: faker.helpers.arrayElement(['RAW_MATERIAL', 'PAINTING', 'QUALITY']),
                productId: products[i].id,
                quantityProduced: faker.number.int({ min: 1, max: 10 })
            }
        });
    }

    // 11. تسعير الدهانات
    console.log('🎨 إنشاء بنود تسعير الدهانات...');
    const paintPricingItems = ['أستاند مقاس 50*240', 'رف تجميع 100 سم', 'حامل جانبي 3 مستويات', 'مسند خلفي معدني', 'قاعدة أستاند 60 سم', 'إطار خارجي 120*200', 'شبكة سلك 5*5', 'ماسورة تعليق ملابس', 'مشبك تثبيت صاج', 'غطاء بلاستيكي جانبي'];
    for (let i = 0; i < 10; i++) {
        await prisma.paintPricingItem.create({
            data: {
                description: paintPricingItems[i],
                price: faker.number.int({ min: 20, max: 200 })
            }
        });
    }

    console.log('✨ تم إنشاء جميع البيانات التجريبية بنجاح!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
