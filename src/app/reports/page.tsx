'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchReportTemplate, generatePrintHtml } from '@/core/reportTemplate';


type ReportType = 'sales' | 'purchases' | 'treasury' | 'inventory' | 'jobs' | 'clients' | 'attendance' | 'salaries';

const REPORT_ITEMS = [
    { key: 'sales', label: 'تقرير المبيعات', icon: '🧾', color: '#E35E35', desc: 'إجمالي الفواتير والمدفوعات والمتأخرة' },
    { key: 'purchases', label: 'تقرير المشتريات', icon: '📦', color: '#29b6f6', desc: 'فواتير التوريد والموردين والمبالغ' },
    { key: 'treasury', label: 'تقرير الخزينة', icon: '🏦', color: '#66bb6a', desc: 'حركات الخزينة والأرصدة' },
    { key: 'inventory', label: 'تقرير المخزن', icon: '📊', color: '#ffa726', desc: 'جرد المواد والمنتجات والقيمة الكلية' },
    { key: 'jobs', label: 'تقرير التصنيع', icon: '🏭', color: '#ab47bc', desc: 'أوامر التصنيع والأرباح والتكاليف' },
    { key: 'clients', label: 'تقرير العملاء', icon: '👥', color: '#26c6da', desc: 'أرصدة وديون وسجل تحصيلات العملاء' },
    { key: 'attendance', label: 'تقرير الحضور والإنصراف', icon: '📅', color: '#ff7043', desc: 'سجل حضور الموظفين والغياب والمكافآت' },
    { key: 'salaries', label: 'تقرير رواتب الموظفين', icon: '💸', color: '#ec407a', desc: 'كشف المرتبات والخصومات والسلف' },
] as const;

export default function ReportsPage() {
    const [salesData, setSalesData] = useState<any[]>([]);
    const [purchasesData, setPurchasesData] = useState<any[]>([]);
    const [treasuryData, setTreasuryData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [jobsData, setJobsData] = useState<any[]>([]);
    const [clientsData, setClientsData] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [salariesData, setSalariesData] = useState<any[]>([]);
    const [activeReport, setActiveReport] = useState<ReportType>('sales');
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sealInfo, setSealInfo] = useState({ image: '', align: 'right', size: '120' });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5);

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
            fetch('/api/employees').then(r => r.json()).catch(() => []), // For generic employee data
        ]).then(([s, p, t, inv, j, c, emps]) => {
            setSalesData(Array.isArray(s) ? s : []);
            setPurchasesData(Array.isArray(p) ? p : []);
            setTreasuryData(Array.isArray(t) ? t : []);
            setInventoryData(Array.isArray(inv) ? inv : []);
            setJobsData(Array.isArray(j) ? j : []);
            setClientsData(Array.isArray(c) ? c : []);

            // Handle Attendance/Salaries Data from employees
            const allAttendances: any[] = [];
            const allSalaries: any[] = [];
            if (Array.isArray(emps)) {
                emps.forEach((emp: any) => {
                    if (emp.attendances) {
                        emp.attendances.forEach((a: any) => allAttendances.push({ ...a, employeeName: emp.name }));
                    }
                    if (emp.payrollRecords) {
                        emp.payrollRecords.forEach((pr: any) => allSalaries.push({ ...pr, employeeName: emp.name }));
                    }
                });
            }
            setAttendanceData(allAttendances);
            setSalariesData(allSalaries);
            setLoading(false);
        });

        // Load Seal Settings
        fetch('/api/settings').then(r => r.json()).then(dat => {
            setSealInfo({
                image: dat.footerSealImage || '',
                align: dat.footerSealAlign || 'right',
                size: dat.footerSealSize || '120'
            });
        }).catch(() => { });

        const saved = localStorage.getItem('erp_reports_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_reports_pageSize', val);
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [activeReport, dateFrom, dateTo]);

    const filterByDate = (items: any[], dateField = 'date') => {
        if (!dateFrom && !dateTo) return items;
        return items.filter(item => {
            const d = new Date(item[dateField] || item.createdAt);
            if (dateFrom && d < new Date(dateFrom)) return false;
            if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
            return true;
        });
    };

    const getPaginatedData = (data: any[]) => {
        const total = pageSize === 'ALL' ? 1 : Math.ceil(data.length / (pageSize as number)) || 1;
        const validPage = currentPage > total ? total : currentPage;
        const paginated = pageSize === 'ALL' ? data : data.slice((validPage - 1) * (pageSize as number), validPage * (pageSize as number));
        return { paginated, totalPages: total, validPage };
    };

    const PaginationControls = ({ totalPages, validPage }: { totalPages: number, validPage: number }) => {
        if (!totalPages) return null;
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap-reverse', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '20px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>عدد النتائج:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        style={{ padding: '0px', fontSize: '0.9rem', width: 'auto', border: 'none', background: 'transparent', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                        aria-label="Items per page"
                    >
                        <option style={{ color: '#000' }} value={5}>5</option>
                        <option style={{ color: '#000' }} value={10}>10</option>
                        <option style={{ color: '#000' }} value={20}>20</option>
                        <option style={{ color: '#000' }} value={50}>50</option>
                        <option style={{ color: '#000' }} value={100}>100</option>
                        <option style={{ color: '#000' }} value="ALL">الكل</option>
                    </select>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flex: '1 1 auto', maxWidth: '350px' }}>
                        <button disabled={validPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary" style={{ opacity: validPage === 1 ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>&rarr; السابق</button>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', background: 'rgba(227,94,53,0.1)', color: 'var(--primary-color)', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr', whiteSpace: 'nowrap', border: '1px solid rgba(227,94,53,0.2)' }}>
                            {validPage} / {totalPages}
                        </div>
                        <button disabled={validPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary" style={{ opacity: validPage === totalPages ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>التالي &larr;</button>
                    </div>
                )}
            </div>
        );
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

    const getAttendanceSummary = () => {
        const data = filterByDate(attendanceData, 'dateStr');
        return {
            present: data.filter(a => a.status === 'PRESENT').length,
            late: data.filter(a => a.status === 'LATE').length,
            absent: data.filter(a => a.status === 'ABSENT').length,
            sick: data.filter(a => a.status === 'SICK').length,
            count: data.length,
        };
    };

    const getSalariesSummary = () => {
        const data = filterByDate(salariesData, 'date');
        return {
            totalSpent: data.reduce((s, pr) => s + (pr.amount || 0), 0),
            count: data.length,
            advances: data.filter(pr => pr.type === 'ADVANCE').reduce((s, pr) => s + (pr.amount || 0), 0),
            bonuses: data.filter(pr => pr.type === 'BONUS').reduce((s, pr) => s + (pr.amount || 0), 0),
        };
    };

    const handlePrintFullReport = async () => {
        const info = REPORT_ITEMS.find(r => r.key === activeReport)!;
        const config = await fetchReportTemplate();

        let headers: string[] = [];
        let rowsHtml = '';
        let summaryHtml = '';

        if (activeReport === 'sales') {
            const data = filterByDate(salesData, 'createdAt');
            const summary = getSalesSummary();
            headers = ['#', 'رقم الفاتورة', 'العميل', 'التاريخ', 'الإجمالي', 'الحالة'];
            rowsHtml = data.map((inv: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${inv.invoiceNo}</td>
                    <td>${inv.client?.name || '-'}</td>
                    <td>${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td>${inv.total?.toLocaleString('en-US')} ${sym}</td>
                    <td>${inv.status === 'PAID' ? 'مدفوعة' : 'غير مدفوعة'}</td>
                </tr>
            `).join('');
            summaryHtml = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>الإجمالي: ${summary.total.toLocaleString('en-US')} ${sym}</strong> | فواتير: ${summary.count}
            </div>`;
        } else if (activeReport === 'inventory') {
            const data = inventoryData.filter(i => i.category !== 'MANUFACTURED_PRICING');
            const summary = getInventorySummary();
            headers = ['#', 'الصنف', 'النوع', 'الكمية', 'الوحدة', 'سعر الوحدة', 'القيمة'];
            rowsHtml = data.map((item: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.type === 'MATERIAL' ? 'خامة' : 'منتج'}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td>${item.lastPurchasedPrice?.toLocaleString('en-US')} ${sym}</td>
                    <td>${(item.stock * (item.lastPurchasedPrice || 0)).toLocaleString('en-US')} ${sym}</td>
                </tr>
            `).join('');
            summaryHtml = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>إجمالي القيمة: ${summary.value.toLocaleString('en-US')} ${sym}</strong> | أصناف: ${summary.count}
            </div>`;
        } else if (activeReport === 'jobs') {
            const data = filterByDate(jobsData, 'createdAt');
            const s = getJobsSummary();
            headers = ['#', 'اسم الشغلانة', 'الحالة', 'تكلفة الخامات', 'تكلفة التشغيل', 'صافي الربح'];
            rowsHtml = data.map((job: any) => `
                <tr>
                    <td>${job.serialNo}</td>
                    <td>${job.name}</td>
                    <td>${job.status === 'COMPLETED' ? 'مكتملة' : 'جارية'}</td>
                    <td>${job.totalMaterialCost?.toLocaleString('en-US')} ${sym}</td>
                    <td>${job.totalOperatingCost?.toLocaleString('en-US')} ${sym}</td>
                    <td>${(job.netProfit || 0).toLocaleString('en-US')} ${sym}</td>
                </tr>
            `).join('');
            summaryHtml = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>صافي الأرباح: ${s.totalProfit.toLocaleString('en-US')} ${sym}</strong> | التكاليف: ${s.totalCost.toLocaleString('en-US')} ${sym}
            </div>`;
        } else if (activeReport === 'clients') {
            headers = ['#', 'الاسم', 'المتجر', 'التليفون', 'العنوان'];
            rowsHtml = clientsData.map((c: any, i: number) => `
                <tr>
                    <td>${c.serial || i + 1}</td>
                    <td>${c.name}</td>
                    <td>${c.storeName || '-'}</td>
                    <td>${c.phone1 || '-'}</td>
                    <td>${c.address || '-'}</td>
                </tr>
            `).join('');
        } else if (activeReport === 'purchases') {
            const data = filterByDate(purchasesData, 'date');
            headers = ['#', 'رقم الفاتورة', 'المورد', 'التاريخ', 'الإجمالي'];
            rowsHtml = data.map((p: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.invoiceNo}</td>
                    <td>${p.supplier || '-'}</td>
                    <td>${new Date(p.date || p.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td>${p.totalAmount?.toLocaleString('en-US')} ${sym}</td>
                </tr>
            `).join('');
        } else if (activeReport === 'attendance') {
            const data = filterByDate(attendanceData, 'dateStr');
            headers = ['#', 'الموظف', 'التاريخ', 'الحالة', 'الحضور', 'الانصراف'];
            rowsHtml = data.map((a: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${a.employeeName}</td>
                    <td>${a.dateStr}</td>
                    <td>${a.status === 'PRESENT' ? 'حاضر' : a.status === 'ABSENT' ? 'غائب' : 'تأخير'}</td>
                    <td>${a.checkIn ? new Date(a.checkIn).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>${a.checkOut ? new Date(a.checkOut).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                </tr>
            `).join('');
        } else if (activeReport === 'salaries') {
            const data = filterByDate(salariesData, 'date');
            const s = getSalariesSummary();
            headers = ['#', 'الموظف', 'النوع', 'المبلغ', 'التاريخ', 'ملاحظات'];
            rowsHtml = data.map((pr: any, i: number) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${pr.employeeName}</td>
                    <td>${pr.type === 'SALARY' ? 'راتب' : pr.type === 'ADVANCE' ? 'سلفة' : 'مكافأة'}</td>
                    <td>${pr.amount.toLocaleString('en-US')} ${sym}</td>
                    <td>${new Date(pr.date).toLocaleDateString('ar-EG')}</td>
                    <td>${pr.note || '-'}</td>
                </tr>
            `).join('');
            summaryHtml = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>إجمالي المنصرف: ${s.totalSpent.toLocaleString('en-US')} ${sym}</strong>
            </div>`;
        }

        const bodyHtml = `
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            ${summaryHtml}
        `;

        const html = generatePrintHtml(bodyHtml, info.label, config);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentWindow?.document.open();
        iframe.contentWindow?.document.write(html);
        iframe.contentWindow?.document.close();
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 2000);
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
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/reports/designer" className="btn-modern btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎨 مصمم التقارير
                    </Link>
                    <button onClick={handlePrintFullReport} className="btn-modern btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                        🖨️ طباعة التقرير
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

            <div className="reports-grid" style={{ alignItems: 'start' }}>
                {/* Report Sidebar */}
                <div className="glass-panel report-sidebar-menu" style={{ position: 'sticky', top: '20px', maxHeight: 'calc(100dvh - 40px)', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#919398', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>اختر التقرير</h4>
                    <div className="report-sidebar-list" style={{ display: 'flex', gap: '4px' }}>
                        {REPORT_ITEMS.map(r => (
                            <button key={r.key} onClick={() => setActiveReport(r.key as ReportType)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${activeReport === r.key ? r.color + '44' : 'transparent'}`, background: activeReport === r.key ? `${r.color}15` : 'transparent', color: activeReport === r.key ? r.color : '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeReport === r.key ? 700 : 400, textAlign: 'right', width: '100%', transition: 'all 0.2s' }}>
                                <span style={{ fontSize: '0.95rem' }}>{r.icon}</span>
                                <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{r.label}</span>
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
                        {!loading && (
                            <button onClick={handlePrintFullReport} className="btn-modern btn-secondary" style={{ padding: '6px 15px', fontSize: '0.85rem' }}>🖨️ طباعة القسم</button>
                        )}
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
                                                <div key={i} style={{ padding: '10px 12px', background: `${c.color}11`, border: `1px solid ${c.color}22`, borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table-glass responsive-cards high-density">
                                                <thead><tr><th>#</th><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
                                                <tbody>
                                                    {(() => {
                                                        const { paginated, totalPages, validPage } = getPaginatedData(data);
                                                        return (
                                                            <>
                                                                {paginated.map((inv: any, i: number) => (
                                                                    <tr key={inv.id}>
                                                                        <td data-label="#" style={{ color: '#888', fontSize: '0.78rem' }}>{(validPage - 1) * (pageSize === 'ALL' ? 0 : pageSize as number) + i + 1}</td>
                                                                        <td data-label="رقم الفاتورة" style={{ fontWeight: 700 }}>{inv.invoiceNo}</td>
                                                                        <td data-label="العميل">{inv.client?.name || '-'}</td>
                                                                        <td data-label="التاريخ" style={{ color: '#888', fontSize: '0.82rem' }}>{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                                                                        <td data-label="الإجمالي" style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{inv.total?.toFixed(0)} {sym}</td>
                                                                        <td data-label="الحالة"><span style={{ padding: '1px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: inv.status === 'PAID' ? '#66bb6a22' : '#ffa72622', color: inv.status === 'PAID' ? '#66bb6a' : '#ffa726' }}>{inv.status === 'PAID' ? 'مدفوعة' : inv.status === 'PARTIAL' ? 'جزئي' : 'غير مدفوعة'}</span></td>
                                                                    </tr>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(() => {
                                            const { totalPages, validPage } = getPaginatedData(data);
                                            return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                        })()}
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
                                                <div key={i} style={{ padding: '10px 12px', background: `${c.color}11`, border: `1px solid ${c.color}22`, borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table-glass responsive-cards high-density">
                                                <thead><tr><th>#</th><th>الصنف</th><th>النوع</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>القيمة</th></tr></thead>
                                                <tbody>
                                                    {(() => {
                                                        const { paginated, totalPages, validPage } = getPaginatedData(data);
                                                        return (
                                                            <>
                                                                {paginated.map((item: any, i: number) => (
                                                                    <tr key={item.id} style={{ background: item.stock <= 5 ? 'rgba(227,94,53,0.04)' : 'transparent' }}>
                                                                        <td data-label="#" style={{ color: '#888', fontSize: '0.78rem' }}>{(validPage - 1) * (pageSize === 'ALL' ? 0 : pageSize as number) + i + 1}</td>
                                                                        <td data-label="الصنف" style={{ fontWeight: 700 }}>{item.name}</td>
                                                                        <td data-label="النوع"><span style={{ padding: '1px 6px', borderRadius: '6px', fontSize: '0.7rem', background: item.type === 'MATERIAL' ? '#29b6f622' : '#66bb6a22', color: item.type === 'MATERIAL' ? '#29b6f6' : '#66bb6a' }}>{item.type === 'MATERIAL' ? 'خامة' : 'منتج'}</span></td>
                                                                        <td data-label="الكمية" style={{ fontWeight: 700, color: item.stock <= 5 ? '#E35E35' : '#66bb6a' }}>{item.stock.toFixed(0)}{item.stock <= 5 && ' ⚠️'}</td>
                                                                        <td data-label="الوحدة" style={{ color: '#888' }}>{item.unit}</td>
                                                                        <td data-label="سعر الوحدة" style={{ color: 'var(--primary-color)' }}>{item.lastPurchasedPrice?.toFixed(0)} {sym}</td>
                                                                        <td data-label="القيمة" style={{ fontWeight: 700, color: '#29b6f6' }}>{(item.stock * (item.lastPurchasedPrice || 0)).toFixed(0)} {sym}</td>
                                                                    </tr>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(() => {
                                            const { totalPages, validPage } = getPaginatedData(data);
                                            return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                        })()}
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
                                                <div key={i} style={{ padding: '10px 12px', background: `${c.color}11`, border: `1px solid ${c.color}22`, borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table-glass responsive-cards high-density">
                                                <thead><tr><th>#</th><th>اسم الشغلانة</th><th>الحالة</th><th>تكلفة الخامات</th><th>تكلفة التشغيل</th><th>صافي الربح</th></tr></thead>
                                                <tbody>
                                                    {(() => {
                                                        const { paginated, totalPages, validPage } = getPaginatedData(data);
                                                        return (
                                                            <>
                                                                {paginated.map((job: any, i: number) => (
                                                                    <tr key={job.id}>
                                                                        <td data-label="#" style={{ color: '#888' }}>{job.serialNo}</td>
                                                                        <td data-label="اسم الشغلانة" style={{ fontWeight: 700 }}>{job.name}</td>
                                                                        <td data-label="الحالة"><span style={{ padding: '1px 8px', borderRadius: '6px', fontSize: '0.7rem', background: job.status === 'COMPLETED' ? '#66bb6a22' : '#ffa72622', color: job.status === 'COMPLETED' ? '#66bb6a' : '#ffa726' }}>{job.status === 'COMPLETED' ? 'مكتملة' : 'جارية'}</span></td>
                                                                        <td data-label="تكلفة الخامات" style={{ color: '#29b6f6' }}>{job.totalMaterialCost?.toFixed(0)} {sym}</td>
                                                                        <td data-label="تكلفة التشغيل" style={{ color: '#ffa726' }}>{job.totalOperatingCost?.toFixed(0)} {sym}</td>
                                                                        <td data-label="صافي الربح" style={{ color: '#66bb6a', fontWeight: 700 }}>{(job.netProfit || 0).toFixed(0)} {sym}</td>
                                                                    </tr>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(() => {
                                            const { totalPages, validPage } = getPaginatedData(data);
                                            return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                        })()}
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
                                    <div className="table-wrapper">
                                        <table className="table-glass responsive-cards high-density">
                                            <thead><tr><th>#</th><th>اسم العميل</th><th>اسم المتجر</th><th>التليفون</th><th>العنوان</th></tr></thead>
                                            <tbody>
                                                {(() => {
                                                    const { paginated, totalPages, validPage } = getPaginatedData(clientsData);
                                                    return (
                                                        <>
                                                            {paginated.map((c: any, i: number) => (
                                                                <tr key={c.id}>
                                                                    <td data-label="#" style={{ color: '#888' }}>{c.serial || (validPage - 1) * (pageSize === 'ALL' ? 0 : pageSize as number) + i + 1}</td>
                                                                    <td data-label="اسم العميل" style={{ fontWeight: 700 }}>{c.name}</td>
                                                                    <td data-label="اسم المتجر" style={{ color: '#888' }}>{c.storeName || '-'}</td>
                                                                    <td data-label="التليفون">{c.phone1 || '-'}</td>
                                                                    <td data-label="العنوان" style={{ color: '#888', fontSize: '0.82rem' }}>{c.address || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                    {(() => {
                                        const { totalPages, validPage } = getPaginatedData(clientsData);
                                        return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                    })()}
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
                                                <div key={i} style={{ padding: '10px 12px', background: `${c.color}11`, border: `1px solid ${c.color}22`, borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table-glass responsive-cards high-density">
                                                <thead><tr><th>#</th><th>رقم الفاتورة</th><th>المورد</th><th>التاريخ</th><th>الإجمالي</th></tr></thead>
                                                <tbody>
                                                    {(() => {
                                                        const { paginated, totalPages, validPage } = getPaginatedData(data);
                                                        return (
                                                            <>
                                                                {paginated.map((p: any, i: number) => (
                                                                    <tr key={p.id}>
                                                                        <td data-label="#" style={{ color: '#888' }}>{(validPage - 1) * (pageSize === 'ALL' ? 0 : pageSize as number) + i + 1}</td>
                                                                        <td data-label="رقم الفاتورة" style={{ fontWeight: 700 }}>{p.invoiceNo}</td>
                                                                        <td data-label="المورد">{p.supplier || '-'}</td>
                                                                        <td data-label="التاريخ" style={{ color: '#888' }}>{new Date(p.date || p.createdAt).toLocaleDateString('ar-EG')}</td>
                                                                        <td data-label="الإجمالي" style={{ color: '#29b6f6', fontWeight: 700 }}>{p.totalAmount?.toFixed(0)} {sym}</td>
                                                                    </tr>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(() => {
                                            const { totalPages, validPage } = getPaginatedData(data);
                                            return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                        })()}
                                    </div>
                                );
                            })()}

                            {activeReport === 'attendance' && (() => {
                                const s = getAttendanceSummary();
                                const data = filterByDate(attendanceData, 'dateStr');
                                return (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: 'حاضر', value: s.present, color: '#66bb6a' },
                                                { label: 'تأخير', value: s.late, color: '#ffa726' },
                                                { label: 'غائب', value: s.absent, color: '#e53935' },
                                                { label: 'إجمالي السجلات', value: s.count, color: '#29b6f6' },
                                            ].map((c, i) => (
                                                <div key={i} style={{ padding: '10px 12px', background: `${c.color}11`, border: `1px solid ${c.color}22`, borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table-glass responsive-cards high-density">
                                                <thead><tr><th>#</th><th>الموظف</th><th>التاريخ</th><th>الحالة</th><th>الحضور</th><th>الانصراف</th><th>ملاحظات</th></tr></thead>
                                                <tbody>
                                                    {(() => {
                                                        const { paginated, totalPages, validPage } = getPaginatedData(data);
                                                        return (
                                                            <>
                                                                {paginated.map((a: any, i: number) => (
                                                                    <tr key={a.id}>
                                                                        <td data-label="#" style={{ color: '#888' }}>{(validPage - 1) * (pageSize === 'ALL' ? 0 : pageSize as number) + i + 1}</td>
                                                                        <td data-label="الموظف" style={{ fontWeight: 700 }}>{a.employeeName}</td>
                                                                        <td data-label="التاريخ" style={{ color: '#888' }}>{a.dateStr}</td>
                                                                        <td data-label="الحالة">
                                                                            <span style={{
                                                                                padding: '1px 8px', borderRadius: '6px', fontSize: '0.7rem',
                                                                                background: a.status === 'PRESENT' ? '#66bb6a22' : a.status === 'ABSENT' ? '#e5393522' : '#ffa72622',
                                                                                color: a.status === 'PRESENT' ? '#66bb6a' : a.status === 'ABSENT' ? '#e53935' : '#ffa726'
                                                                            }}>
                                                                                {a.status === 'PRESENT' ? 'حاضر' : a.status === 'ABSENT' ? 'غائب' : a.status === 'LATE' ? 'تأخير' : a.status === 'SICK' ? 'مرضي' : a.status}
                                                                            </span>
                                                                        </td>
                                                                        <td data-label="الحضور">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                                        <td data-label="الانصراف">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                                        <td data-label="ملاحظات" style={{ fontSize: '0.75rem', color: '#888' }}>{a.note || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(() => {
                                            const { totalPages, validPage } = getPaginatedData(data);
                                            return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                        })()}
                                    </div>
                                );
                            })()}

                            {activeReport === 'salaries' && (() => {
                                const s = getSalariesSummary();
                                const data = filterByDate(salariesData, 'date');
                                return (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: 'إجمالي المبالغ', value: s.totalSpent.toFixed(0) + ' ' + sym, color: '#ec407a' },
                                                { label: 'السلف', value: s.advances.toFixed(0) + ' ' + sym, color: '#ab47bc' },
                                                { label: 'المكافآت', value: s.bonuses.toFixed(0) + ' ' + sym, color: '#66bb6a' },
                                                { label: 'إجمالي الحركات', value: s.count, color: '#29b6f6' },
                                            ].map((c, i) => (
                                                <div key={i} style={{ padding: '10px 12px', background: `${c.color}11`, border: `1px solid ${c.color}22`, borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table-glass responsive-cards high-density">
                                                <thead><tr><th>#</th><th>الموظف</th><th>النوع</th><th>المبلغ</th><th>التاريخ</th><th>الشهر/السنة</th><th>ملاحظات</th></tr></thead>
                                                <tbody>
                                                    {(() => {
                                                        const { paginated, totalPages, validPage } = getPaginatedData(data);
                                                        return (
                                                            <>
                                                                {paginated.map((pr: any, i: number) => (
                                                                    <tr key={pr.id}>
                                                                        <td data-label="#" style={{ color: '#888' }}>{(validPage - 1) * (pageSize === 'ALL' ? 0 : pageSize as number) + i + 1}</td>
                                                                        <td data-label="الموظف" style={{ fontWeight: 700 }}>{pr.employeeName}</td>
                                                                        <td data-label="النوع">
                                                                            <span style={{
                                                                                padding: '1px 8px', borderRadius: '6px', fontSize: '0.7rem',
                                                                                background: pr.type === 'SALARY' ? '#66bb6a22' : pr.type === 'ADVANCE' ? '#ffa72622' : '#29b6f622',
                                                                                color: pr.type === 'SALARY' ? '#66bb6a' : pr.type === 'ADVANCE' ? '#ffa726' : '#29b6f6'
                                                                            }}>
                                                                                {pr.type === 'SALARY' ? 'راتب' : pr.type === 'ADVANCE' ? 'سلفة' : pr.type === 'BONUS' ? 'مكافأة' : pr.type === 'PENALTY' ? 'خصم' : pr.type}
                                                                            </span>
                                                                        </td>
                                                                        <td data-label="المبلغ" style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{pr.amount?.toFixed(0)} {sym}</td>
                                                                        <td data-label="التاريخ" style={{ color: '#888', fontSize: '0.82rem' }}>{new Date(pr.date).toLocaleDateString('ar-EG')}</td>
                                                                        <td data-label="الشهر/السنة" style={{ color: '#888' }}>{pr.month}/{pr.year}</td>
                                                                        <td data-label="ملاحظات" style={{ fontSize: '0.75rem', color: '#888' }}>{pr.note || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(() => {
                                            const { totalPages, validPage } = getPaginatedData(data);
                                            return <PaginationControls totalPages={totalPages} validPage={validPage} />;
                                        })()}
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
