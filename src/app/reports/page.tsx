'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type ReportType = 'sales' | 'purchases' | 'treasury' | 'inventory' | 'jobs' | 'clients';

const REPORT_ITEMS = [
    { key: 'sales', label: 'تقرير المبيعات', icon: '🧾', color: '#E35E35', desc: 'إجمالي الفواتير والمدفوعات والمتأخرة' },
    { key: 'purchases', label: 'تقرير المشتريات', icon: '📦', color: '#29b6f6', desc: 'فواتير التوريد والموردين والمبالغ' },
    { key: 'treasury', label: 'تقرير الخزينة', icon: '🏦', color: '#66bb6a', desc: 'حركات الخزينة والأرصدة' },
    { key: 'inventory', label: 'تقرير المخزن', icon: '📊', color: '#ffa726', desc: 'جرد المواد والمنتجات والقيمة الكلية' },
    { key: 'jobs', label: 'تقرير التصنيع', icon: '🏭', color: '#ab47bc', desc: 'أوامر التصنيع والأرباح والتكاليف' },
    { key: 'clients', label: 'تقرير العملاء', icon: '👥', color: '#26c6da', desc: 'أرصدة وديون وسجل تحصيلات العملاء' },
] as const;

export default function ReportsPage() {
    const [salesData, setSalesData] = useState<any[]>([]);
    const [purchasesData, setPurchasesData] = useState<any[]>([]);
    const [treasuryData, setTreasuryData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [jobsData, setJobsData] = useState<any[]>([]);
    const [clientsData, setClientsData] = useState<any[]>([]);
    const [activeReport, setActiveReport] = useState<ReportType>('sales');
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const sym = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } })();
    const companyName = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').appName || 'Stand Masr ERP'; } catch { return 'Stand Masr ERP'; } })();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/sales').then(r => r.json()).catch(() => []),
            fetch('/api/purchases').then(r => r.json()).catch(() => []),
            fetch('/api/treasury').then(r => r.json()).catch(() => []),
            fetch('/api/inventory').then(r => r.json()).catch(() => []),
            fetch('/api/jobs').then(r => r.json()).catch(() => []),
            fetch('/api/clients').then(r => r.json()).catch(() => []),
        ]).then(([s, p, t, inv, j, c]) => {
            setSalesData(Array.isArray(s) ? s : []);
            setPurchasesData(Array.isArray(p) ? p : []);
            setTreasuryData(Array.isArray(t) ? t : []);
            setInventoryData(Array.isArray(inv) ? inv : []);
            setJobsData(Array.isArray(j) ? j : []);
            setClientsData(Array.isArray(c) ? c : []);
            setLoading(false);
        });
    }, []);

    const filterByDate = (items: any[], dateField = 'date') => {
        if (!dateFrom && !dateTo) return items;
        return items.filter(item => {
            const d = new Date(item[dateField] || item.createdAt);
            if (dateFrom && d < new Date(dateFrom)) return false;
            if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
            return true;
        });
    };

    const printReport = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const reportInfo = REPORT_ITEMS.find(r => r.key === activeReport)!;
        const content = buildPrintContent(reportInfo);
        win.document.write(content);
        win.document.close();
    };

    const buildPrintContent = (reportInfo: typeof REPORT_ITEMS[number]) => {
        let tableHtml = '';
        let summaryHtml = '';

        if (activeReport === 'sales') {
            const data = filterByDate(salesData, 'createdAt');
            const total = data.reduce((s, i) => s + (i.total || 0), 0);
            const paid = data.filter(i => i.status === 'PAID').length;
            const unpaid = data.filter(i => i.status === 'UNPAID' || i.status === 'PARTIAL').length;
            summaryHtml = `<div style="display:flex;gap:20px;margin-bottom:15px">
                <div style="padding:10px 16px;background:#E35E3522;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#E35E35">${total.toFixed(0)} ${sym}</div><div style="font-size:0.8rem;color:#888">الإجمالي</div></div>
                <div style="padding:10px 16px;background:#66bb6a22;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#388E3C">${paid}</div><div style="font-size:0.8rem;color:#888">مدفوعة</div></div>
                <div style="padding:10px 16px;background:#ffa72622;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#e65100">${unpaid}</div><div style="font-size:0.8rem;color:#888">متأخرة</div></div>
            </div>`;
            tableHtml = `<table><thead><tr><th>#</th><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>
                ${data.map((inv, i) => `<tr><td>${i + 1}</td><td>${inv.invoiceNo}</td><td>${inv.client?.name || '-'}</td><td>${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td><td>${inv.total?.toFixed(0)} ${sym}</td><td>${inv.status === 'PAID' ? 'مدفوعة' : inv.status === 'PARTIAL' ? 'جزئي' : 'غير مدفوعة'}</td></tr>`).join('')}
            </tbody></table>`;
        } else if (activeReport === 'inventory') {
            const data = inventoryData.filter(i => i.category !== 'MANUFACTURED_PRICING');
            const totalValue = data.reduce((s, i) => s + (i.stock * (i.lastPurchasedPrice || 0)), 0);
            const lowStock = data.filter(i => i.stock <= 5).length;
            summaryHtml = `<div style="display:flex;gap:20px;margin-bottom:15px">
                <div style="padding:10px 16px;background:#ffa72622;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#e65100">${data.length}</div><div style="font-size:0.8rem;color:#888">إجمالي الأصناف</div></div>
                <div style="padding:10px 16px;background:#29b6f622;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#0288d1">${totalValue.toFixed(0)} ${sym}</div><div style="font-size:0.8rem;color:#888">القيمة الكلية</div></div>
                <div style="padding:10px 16px;background:#E35E3522;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#E35E35">${lowStock}</div><div style="font-size:0.8rem;color:#888">أصناف منخفضة</div></div>
            </div>`;
            tableHtml = `<table><thead><tr><th>#</th><th>اسم الصنف</th><th>النوع</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>القيمة</th></tr></thead><tbody>
                ${data.map((item, i) => `<tr style="${item.stock <= 5 ? 'color:#c0392b;' : ''}"><td>${i + 1}</td><td>${item.name}</td><td>${item.type === 'MATERIAL' ? 'خامة' : 'منتج'}</td><td>${item.stock.toFixed(0)}${item.stock <= 5 ? ' ⚠' : ''}</td><td>${item.unit}</td><td>${item.lastPurchasedPrice?.toFixed(0) || 0} ${sym}</td><td>${(item.stock * (item.lastPurchasedPrice || 0)).toFixed(0)} ${sym}</td></tr>`).join('')}
            </tbody></table>`;
        } else if (activeReport === 'jobs') {
            const data = filterByDate(jobsData, 'createdAt');
            const totalCost = data.reduce((s, j) => s + (j.totalMaterialCost || 0) + (j.totalOperatingCost || 0), 0);
            const totalProfit = data.reduce((s, j) => s + (j.netProfit || 0), 0);
            summaryHtml = `<div style="display:flex;gap:20px;margin-bottom:15px">
                <div style="padding:10px 16px;background:#ab47bc22;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#ab47bc">${data.length}</div><div style="font-size:0.8rem;color:#888">إجمالي الأوامر</div></div>
                <div style="padding:10px 16px;background:#29b6f622;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#0288d1">${totalCost.toFixed(0)} ${sym}</div><div style="font-size:0.8rem;color:#888">إجمالي التكاليف</div></div>
                <div style="padding:10px 16px;background:#66bb6a22;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#388E3C">${totalProfit.toFixed(0)} ${sym}</div><div style="font-size:0.8rem;color:#888">إجمالي الأرباح</div></div>
            </div>`;
            tableHtml = `<table><thead><tr><th>#</th><th>اسم الشغلانة</th><th>الحالة</th><th>تكلفة الخامات</th><th>تكلفة التشغيل</th><th>صافي الربح</th></tr></thead><tbody>
                ${data.map((job, i) => `<tr><td>${job.serialNo || i + 1}</td><td>${job.name}</td><td>${job.status === 'COMPLETED' ? 'مكتملة' : 'جارية'}</td><td>${job.totalMaterialCost?.toFixed(0)} ${sym}</td><td>${job.totalOperatingCost?.toFixed(0)} ${sym}</td><td style="color:#388E3C">${(job.netProfit || 0).toFixed(0)} ${sym}</td></tr>`).join('')}
            </tbody></table>`;
        } else if (activeReport === 'clients') {
            summaryHtml = `<div style="display:flex;gap:20px;margin-bottom:15px">
                <div style="padding:10px 16px;background:#26c6da22;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#26c6da">${clientsData.length}</div><div style="font-size:0.8rem;color:#888">إجمالي العملاء</div></div>
            </div>`;
            tableHtml = `<table><thead><tr><th>#</th><th>اسم العميل</th><th>اسم المتجر</th><th>التليفون</th><th>العنوان</th></tr></thead><tbody>
                ${clientsData.map((c, i) => `<tr><td>${c.serial || i + 1}</td><td>${c.name}</td><td>${c.storeName || '-'}</td><td>${c.phone1 || '-'}</td><td>${c.address || '-'}</td></tr>`).join('')}
            </tbody></table>`;
        } else if (activeReport === 'purchases') {
            const data = filterByDate(purchasesData, 'date');
            const total = data.reduce((s, p) => s + (p.totalAmount || 0), 0);
            summaryHtml = `<div style="display:flex;gap:20px;margin-bottom:15px">
                <div style="padding:10px 16px;background:#29b6f622;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#0288d1">${total.toFixed(0)} ${sym}</div><div style="font-size:0.8rem;color:#888">إجمالي المشتريات</div></div>
                <div style="padding:10px 16px;background:#ffa72622;border-radius:8px;text-align:center"><div style="font-size:1.3rem;font-weight:bold;color:#e65100">${data.length}</div><div style="font-size:0.8rem;color:#888">عدد الفواتير</div></div>
            </div>`;
            tableHtml = `<table><thead><tr><th>#</th><th>رقم الفاتورة</th><th>المورد</th><th>التاريخ</th><th>الإجمالي</th></tr></thead><tbody>
                ${data.map((p, i) => `<tr><td>${i + 1}</td><td>${p.invoiceNo}</td><td>${p.supplier || '-'}</td><td>${new Date(p.date || p.createdAt).toLocaleDateString('ar-EG')}</td><td>${p.totalAmount?.toFixed(0)} ${sym}</td></tr>`).join('')}
            </tbody></table>`;
        } else {
            tableHtml = '<p>جاري إعداد هذا التقرير..</p>';
        }

        return `<html dir="rtl"><head><title>تقرير - ${reportInfo.label}</title><style>
            @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#222;font-size:12px;margin:0}
            .header{border-bottom:3px solid ${reportInfo.color};padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:start}
            h1{margin:0;color:${reportInfo.color};font-size:1.3rem}h2{margin:0;font-size:1rem;color:#555}
            table{width:100%;border-collapse:collapse;margin-top:10px}th{background:${reportInfo.color};color:#fff;padding:7px 10px;text-align:right;font-size:0.82rem}
            td{padding:6px 10px;border-bottom:1px solid #eee;font-size:0.8rem}tr:nth-child(even) td{background:#f9f9f9}
            .footer{margin-top:20px;padding-top:10px;border-top:1px solid #eee;text-align:center;color:#888;font-size:0.78rem}
        </style></head><body onload="window.print()">
            <div class="header">
                <div><h1>${companyName}</h1><h2>${reportInfo.icon} ${reportInfo.label}</h2><p style="margin:4px 0 0;color:#888;font-size:0.8rem">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}${dateFrom ? ' | من: ' + dateFrom : ''}${dateTo ? ' | إلى: ' + dateTo : ''}</p></div>
            </div>
            ${summaryHtml}
            ${tableHtml}
            <div class="footer">تم إنشاء هذا التقرير بواسطة ${companyName} — نظام ERP الذكي</div>
        </body></html>`;
    };

    const getSalesSummary = () => {
        const data = filterByDate(salesData, 'createdAt');
        return {
            total: data.reduce((s, i) => s + (i.total || 0), 0),
            count: data.length,
            paid: data.filter(i => i.status === 'PAID').length,
            unpaid: data.filter(i => i.status === 'UNPAID' || i.status === 'PARTIAL').reduce((s, i) => s + (i.total || 0), 0),
        };
    };

    const getInventorySummary = () => {
        const data = inventoryData.filter(i => i.category !== 'MANUFACTURED_PRICING');
        return {
            count: data.length,
            value: data.reduce((s, i) => s + (i.stock * (i.lastPurchasedPrice || 0)), 0),
            low: data.filter(i => i.stock <= 5).length,
        };
    };

    const getJobsSummary = () => {
        const data = filterByDate(jobsData, 'createdAt');
        return {
            count: data.length,
            totalCost: data.reduce((s, j) => s + (j.totalMaterialCost || 0) + (j.totalOperatingCost || 0), 0),
            totalProfit: data.reduce((s, j) => s + (j.netProfit || 0), 0),
        };
    };

    const activeInfo = REPORT_ITEMS.find(r => r.key === activeReport)!;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>📊 التقارير المفصلة</h1>
                    <p>تقارير شاملة قابلة للحفظ والطباعة PDF لكل أقسام النظام</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/reports/designer" style={{ padding: '10px 18px', background: 'color-mix(in srgb, var(--primary-color), transparent 85%)', border: '1px solid color-mix(in srgb, var(--primary-color), transparent 70%)', color: 'var(--primary-color)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎨 مصمم التقارير
                    </Link>
                    <button onClick={printReport} className="btn-primary" style={{ padding: '10px 22px' }}>
                        🖨 طباعة التقرير
                    </button>
                </div>
            </header>

            {/* Date Filter */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span id="date_filter_label" style={{ color: '#919398', fontWeight: 600, fontSize: '0.9rem' }}>📅 تصفية بالتاريخ:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="date_from" style={{ fontSize: '0.85rem', color: '#888' }}>من</label>
                    <input id="date_from" type="date" className="input-glass" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '6px 10px' }} title="تاريخ البداية" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="date_to" style={{ fontSize: '0.85rem', color: '#888' }}>إلى</label>
                    <input id="date_to" type="date" className="input-glass" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '6px 10px' }} title="تاريخ النهاية" />
                </div>
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ padding: '6px 12px', background: 'rgba(227,94,53,0.1)', border: '1px solid rgba(227,94,53,0.3)', color: '#E35E35', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }} title="مسح الفلترة">✕ مسح الفلتر</button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Report Sidebar */}
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#919398', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>اختر التقرير</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {REPORT_ITEMS.map(r => (
                            <button key={r.key} onClick={() => setActiveReport(r.key as ReportType)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${activeReport === r.key ? r.color + '44' : 'transparent'}`, background: activeReport === r.key ? `${r.color}15` : 'transparent', color: activeReport === r.key ? r.color : '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeReport === r.key ? 700 : 400, textAlign: 'right', width: '100%', transition: 'all 0.2s' }}>
                                <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
                                <span style={{ fontSize: '0.88rem' }}>{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Content */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: activeInfo.color }}>{activeInfo.icon} {activeInfo.label}</h3>
                            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>{activeInfo.desc}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>⏳ جاري تحميل البيانات...</div>
                    ) : (
                        <>
                            {/* Sales Report */}
                            {activeReport === 'sales' && (() => {
                                const s = getSalesSummary();
                                const data = filterByDate(salesData, 'createdAt');
                                return (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: 'إجمالي المبيعات', value: s.total.toFixed(0) + ' ' + sym, color: '#E35E35' },
                                                { label: 'عدد الفواتير', value: s.count, color: '#29b6f6' },
                                                { label: 'فواتير مدفوعة', value: s.paid, color: '#66bb6a' },
                                                { label: 'رصيد غير محصّل', value: s.unpaid.toFixed(0) + ' ' + sym, color: '#ffa726' },
                                            ].map((c, i) => (
                                                <div key={i} style={{ padding: '14px', background: `${c.color}11`, border: `1px solid ${c.color}33`, borderRadius: '12px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="table-glass">
                                                <thead><tr><th>#</th><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
                                                <tbody>
                                                    {data.slice(0, 50).map((inv, i) => (
                                                        <tr key={inv.id}>
                                                            <td style={{ color: '#888', fontSize: '0.78rem' }}>{i + 1}</td>
                                                            <td style={{ fontWeight: 700 }}>{inv.invoiceNo}</td>
                                                            <td>{inv.client?.name || '-'}</td>
                                                            <td style={{ color: '#888', fontSize: '0.82rem' }}>{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                                                            <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{inv.total?.toFixed(0)} {sym}</td>
                                                            <td><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: inv.status === 'PAID' ? '#66bb6a22' : '#ffa72622', color: inv.status === 'PAID' ? '#66bb6a' : '#ffa726' }}>{inv.status === 'PAID' ? 'مدفوعة' : inv.status === 'PARTIAL' ? 'جزئي' : 'غير مدفوعة'}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Inventory Report */}
                            {activeReport === 'inventory' && (() => {
                                const s = getInventorySummary();
                                const data = inventoryData.filter(i => i.category !== 'MANUFACTURED_PRICING');
                                return (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: 'إجمالي الأصناف', value: s.count, color: '#ffa726' },
                                                { label: 'القيمة الكلية', value: s.value.toFixed(0) + ' ' + sym, color: '#29b6f6' },
                                                { label: 'أصناف منخفضة', value: s.low, color: '#E35E35' },
                                            ].map((c, i) => (
                                                <div key={i} style={{ padding: '14px', background: `${c.color}11`, border: `1px solid ${c.color}33`, borderRadius: '12px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="table-glass">
                                                <thead><tr><th>#</th><th>الصنف</th><th>النوع</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>القيمة</th></tr></thead>
                                                <tbody>
                                                    {data.map((item, i) => (
                                                        <tr key={item.id} style={{ background: item.stock <= 5 ? 'rgba(227,94,53,0.04)' : 'transparent' }}>
                                                            <td style={{ color: '#888', fontSize: '0.78rem' }}>{i + 1}</td>
                                                            <td style={{ fontWeight: 700 }}>{item.name}</td>
                                                            <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', background: item.type === 'MATERIAL' ? '#29b6f622' : '#66bb6a22', color: item.type === 'MATERIAL' ? '#29b6f6' : '#66bb6a' }}>{item.type === 'MATERIAL' ? 'خامة' : 'منتج'}</span></td>
                                                            <td style={{ fontWeight: 700, color: item.stock <= 5 ? '#E35E35' : '#66bb6a' }}>{item.stock.toFixed(0)}{item.stock <= 5 && ' ⚠️'}</td>
                                                            <td style={{ color: '#888' }}>{item.unit}</td>
                                                            <td style={{ color: 'var(--primary-color)' }}>{item.lastPurchasedPrice?.toFixed(0)} {sym}</td>
                                                            <td style={{ fontWeight: 700, color: '#29b6f6' }}>{(item.stock * (item.lastPurchasedPrice || 0)).toFixed(0)} {sym}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Jobs Report */}
                            {activeReport === 'jobs' && (() => {
                                const s = getJobsSummary();
                                const data = filterByDate(jobsData, 'createdAt');
                                return (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: 'إجمالي الأوامر', value: s.count, color: '#ab47bc' },
                                                { label: 'إجمالي التكاليف', value: s.totalCost.toFixed(0) + ' ' + sym, color: '#29b6f6' },
                                                { label: 'إجمالي الأرباح', value: s.totalProfit.toFixed(0) + ' ' + sym, color: '#66bb6a' },
                                            ].map((c, i) => (
                                                <div key={i} style={{ padding: '14px', background: `${c.color}11`, border: `1px solid ${c.color}33`, borderRadius: '12px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="table-glass">
                                                <thead><tr><th>#</th><th>اسم الشغلانة</th><th>الحالة</th><th>تكلفة الخامات</th><th>تكلفة التشغيل</th><th>صافي الربح</th></tr></thead>
                                                <tbody>
                                                    {data.map((job, i) => (
                                                        <tr key={job.id}>
                                                            <td style={{ color: '#888' }}>{job.serialNo}</td>
                                                            <td style={{ fontWeight: 700 }}>{job.name}</td>
                                                            <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', background: job.status === 'COMPLETED' ? '#66bb6a22' : '#ffa72622', color: job.status === 'COMPLETED' ? '#66bb6a' : '#ffa726' }}>{job.status === 'COMPLETED' ? 'مكتملة' : 'جارية'}</span></td>
                                                            <td style={{ color: '#29b6f6' }}>{job.totalMaterialCost?.toFixed(0)} {sym}</td>
                                                            <td style={{ color: '#ffa726' }}>{job.totalOperatingCost?.toFixed(0)} {sym}</td>
                                                            <td style={{ color: '#66bb6a', fontWeight: 700 }}>{(job.netProfit || 0).toFixed(0)} {sym}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Clients Report */}
                            {activeReport === 'clients' && (
                                <div>
                                    <div style={{ padding: '12px', background: `#26c6da11`, border: '1px solid #26c6da33', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#26c6da' }}>{clientsData.length}</div>
                                        <div style={{ fontSize: '0.82rem', color: '#888' }}>إجمالي العملاء المسجلين</div>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="table-glass">
                                            <thead><tr><th>#</th><th>اسم العميل</th><th>اسم المتجر</th><th>التليفون</th><th>العنوان</th></tr></thead>
                                            <tbody>
                                                {clientsData.map((c, i) => (
                                                    <tr key={c.id}>
                                                        <td style={{ color: '#888' }}>{c.serial || i + 1}</td>
                                                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                                                        <td style={{ color: '#888' }}>{c.storeName || '-'}</td>
                                                        <td>{c.phone1 || '-'}</td>
                                                        <td style={{ color: '#888', fontSize: '0.82rem' }}>{c.address || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Purchases Report */}
                            {activeReport === 'purchases' && (() => {
                                const data = filterByDate(purchasesData, 'date');
                                const total = data.reduce((s, p) => s + (p.totalAmount || 0), 0);
                                return (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: 'إجمالي المشتريات', value: total.toFixed(0) + ' ' + sym, color: '#29b6f6' },
                                                { label: 'عدد الفواتير', value: data.length, color: '#ffa726' },
                                            ].map((c, i) => (
                                                <div key={i} style={{ padding: '14px', background: `${c.color}11`, border: `1px solid ${c.color}33`, borderRadius: '12px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="table-glass">
                                                <thead><tr><th>#</th><th>رقم الفاتورة</th><th>المورد</th><th>التاريخ</th><th>الإجمالي</th></tr></thead>
                                                <tbody>
                                                    {data.map((p, i) => (
                                                        <tr key={p.id}>
                                                            <td style={{ color: '#888' }}>{i + 1}</td>
                                                            <td style={{ fontWeight: 700 }}>{p.invoiceNo}</td>
                                                            <td>{p.supplier || '-'}</td>
                                                            <td style={{ color: '#888' }}>{new Date(p.date || p.createdAt).toLocaleDateString('ar-EG')}</td>
                                                            <td style={{ color: '#29b6f6', fontWeight: 700 }}>{p.totalAmount?.toFixed(0)} {sym}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}

                            {activeReport === 'treasury' && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                    <div style={{ fontSize: '3rem' }}>🏦</div>
                                    <p>تقرير الخزينة التفصيلي قيد التطوير</p>
                                    <Link href="/treasury" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 700 }}>انتقل لصفحة الخزينة ←</Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
