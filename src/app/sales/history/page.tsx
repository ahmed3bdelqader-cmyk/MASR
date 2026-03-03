'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/core/reportTemplate';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const alignOptions = ['right', 'center', 'left'] as const;

function getSettings() {
    try { return JSON.parse(localStorage.getItem('erp_settings') || '{}'); } catch { return {}; }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SalesHistoryPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchBy, setSearchBy] = useState<'invoice' | 'client'>('client');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5); // Default 5

    const [showDropdown, setShowDropdown] = useState(false);

    // ── Edit/Delete modal state ────────────────────────────────────────────────
    const [editModal, setEditModal] = useState<any | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNote, setEditNote] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Currency / appName
    const sym = () => getSettings().currencySymbol || 'ج.م';
    const appName = () => getSettings().appName || 'Stand Masr ERP';

    const fetchInvoices = () => fetch('/api/sales').then(r => r.json()).then((d: any) => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => { setInvoices([]); setLoading(false); });

    // ── Delete invoice ────────────────────────────────────────────────────────
    const handleDelete = async (inv: any) => {
        if (!confirm(`هل تريد إلغاء وحذف الفاتورة ${inv.invoiceNo}؟\nسيتم استعادة المخزون تلقائياً.`)) return;
        setDeleting(true); setActionMsg('');
        try {
            const res = await fetch('/api/sales', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inv.id }) });
            if (res.ok) { setActionMsg('✅ تم حذف الفاتورة واستعادة المخزون'); fetchInvoices(); }
            else { const d = await res.json(); setActionMsg(`❌ ${d.error || 'فشل الحذف'}`); }
        } catch { setActionMsg('❌ خطأ في الاتصال'); } finally { setDeleting(false); }
    };

    // ── Edit invoice status ───────────────────────────────────────────────────
    const openEdit = (inv: any) => { setEditModal(inv); setEditStatus(inv.status); setEditNote(inv.note || ''); setActionMsg(''); };
    const handleSaveEdit = async () => {
        if (!editModal) return;
        setSaving(true);
        try {
            const res = await fetch('/api/sales', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editModal.id, status: editStatus, note: editNote }) });
            if (res.ok) { setActionMsg('✅ تم تحديث الفاتورة'); setEditModal(null); fetchInvoices(); }
            else { const d = await res.json(); setActionMsg(`❌ ${d.error || 'فشل التحديث'}`); }
        } catch { setActionMsg('❌ خطأ في الاتصال'); } finally { setSaving(false); }
    };

    // ── طباعة تقرير مجمع ──
    const handlePrintAggregated = (data: any[]) => {
        const title = "تقرير مجمع بمبيعات الفترة";
        const symVal = sym();
        const app = appName();

        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 25px; }
        .title { font-size: 24px; font-weight: bold; margin: 0; }
        .info { display: flex; justify-content: space-between; font-size: 14px; margin-top: 10px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 14px; }
        th { background: #f8f8f8; font-weight: bold; }
        .total-row { background: #333; color: #fff; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${title}</h1>
        <div class="info">
            <span>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</span>
            <span>بواسطة: ${app}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(inv => `
                <tr>
                    <td>${inv.invoiceNo}</td>
                    <td>${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td>${inv.client?.name || '-'}</td>
                    <td>${(inv.total || 0).toLocaleString('en-US')} ${symVal}</td>
                    <td>${inv.status === 'PAID' ? 'مدفوع' : inv.status === 'PARTIAL' ? 'جزئي' : 'آجل'}</td>
                </tr>
            `).join('')}
            <tr class="total-row">
                <td colspan="3">الإجمالي الكلي</td>
                <td>${data.reduce((a, b) => a + (b.total || 0), 0).toLocaleString('en-US')} ${symVal}</td>
                <td>-</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">Stand Masr ERP — نظام الإدارة المتكامل</div>
</body>
</html>`;

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

    // ── طباعة الفاتورة بالتفصيل (A4) ──
    const handlePrintDetailed = async (inv: any) => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';

        const bodyHtml = `
            <style>
                .bill-to { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; margin-top: 20px; }
                .section-title { font-size: 14px; text-transform: uppercase; color: #777; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
                .client-name { font-size: 18px; font-weight: bold; }
                .invoice-meta { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                .total-box { margin-top: 30px; width: 300px; margin-right: auto; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                .total-row.grand { border-bottom: none; font-weight: bold; font-size: 18px; color: #000; margin-top: 10px; border-top: 2px solid ${config.accentColor}; padding-top: 10px; }
            </style>

            <div class="bill-to">
                <div class="invoice-meta">
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">رقم الفاتورة: ${inv.invoiceNo}</div>
                    <div>التاريخ: ${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</div>
                    <div style="margin-top: 5px; color: ${inv.status === 'PAID' ? '#66bb6a' : '#ffa726'}; font-weight: bold;">
                        الحالة: ${inv.status === 'PAID' ? 'مسددة بالكامل' : inv.status === 'PARTIAL' ? 'مسددة جزئياً' : 'آجلة'}
                    </div>
                </div>
                <div>
                    <div class="section-title">إلى العميل:</div>
                    <div class="client-name">${inv.client?.name || 'عميل نقدي'}</div>
                    <div style="font-size: 14px; color: #666; margin-top: 4px;">كود العميل: #${inv.client?.serial || '---'}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: right; width: 40%;">اسم الصنف</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${inv.sales?.length ? inv.sales.map((s: any) => `
                        <tr>
                            <td style="text-align: right;">${s.product?.name || 'صنف'}</td>
                            <td>${s.quantity}</td>
                            <td>${s.unitPrice.toLocaleString('en-US')}</td>
                            <td>${s.totalPrice.toLocaleString('en-US')}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4">لا توجد بنود</td></tr>'}
                </tbody>
            </table>

            <div class="total-box">
                <div class="total-row">
                    <span>الإجمالي الفرعي:</span>
                    <span>${(inv.subtotal || 0).toLocaleString('en-US')} ${symVal}</span>
                </div>
                ${inv.discountPct > 0 ? `
                <div class="total-row">
                    <span>خصم (${inv.discountPct}%):</span>
                    <span style="color: #66bb6a;">-${((inv.subtotal * inv.discountPct) / 100).toLocaleString('en-US')} ${symVal}</span>
                </div>
                ` : ''}
                ${inv.taxPct > 0 ? `
                <div class="total-row">
                    <span>ضريبة المبيعات (${inv.taxPct}%):</span>
                    <span>+${(((inv.subtotal - (inv.subtotal * inv.discountPct / 100)) * inv.taxPct) / 100).toLocaleString('en-US')} ${symVal}</span>
                </div>
                ` : ''}
                <div class="total-row grand">
                    <span>الصافي النهائي:</span>
                    <span>${(inv.total || 0).toLocaleString('en-US')} ${symVal}</span>
                </div>
            </div>
        `;

        const html = generatePrintHtml(bodyHtml, `فاتورة مبيعات #${inv.invoiceNo}`, config);
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

    useEffect(() => {
        fetchInvoices();
        // Load saved page size
        const saved = localStorage.getItem('erp_salesHistory_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_salesHistory_pageSize', val);
        setCurrentPage(1);
    };

    // ── Suggestions dropdown ──
    const clientNames = useMemo(() => [...new Set(invoices.map((inv: any) => inv.client?.name).filter(Boolean))].sort() as string[], [invoices]);
    const invoiceNos = useMemo(() => invoices.map((inv: any) => inv.invoiceNo).filter(Boolean) as string[], [invoices]);
    const suggestions = useMemo(() => {
        if (!search.trim()) return [];
        const q = search.toLowerCase();
        return (searchBy === 'client' ? clientNames : invoiceNos).filter(n => n.toLowerCase().includes(q)).slice(0, 8);
    }, [search, searchBy, clientNames, invoiceNos]);

    // ── Filtered results ──
    const filtered = useMemo(() => invoices.filter(inv => {
        const q = search.trim().toLowerCase();
        const match = !q ? true : searchBy === 'invoice' ? (inv.invoiceNo || '').toLowerCase().includes(q) : (inv.client?.name || '').toLowerCase().includes(q);
        const d = new Date(inv.createdAt);
        return match && (!dateFrom || d >= new Date(dateFrom)) && (!dateTo || d <= new Date(dateTo + 'T23:59:59'));
    }), [invoices, search, searchBy, dateFrom, dateTo]);

    const totalFiltered = filtered.reduce((a, inv) => a + (inv.total || 0), 0);

    // Pagination
    useEffect(() => { setCurrentPage(1); }, [search, searchBy, dateFrom, dateTo]);
    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filtered.length / pageSize);
    const paginatedFiltered = useMemo(() => {
        if (pageSize === 'ALL') return filtered;
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);



    // ─── Excel export ─────────────────────────────────────────────────────────
    const downloadExcel = (all = false) => {
        const data = all ? invoices : filtered;
        const currency = sym();
        const rows = data.map((inv: any) => `<tr>
            <td>${inv.invoiceNo}</td><td>${inv.client?.name || '-'}</td>
            <td>${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
            <td>${(inv.subtotal || 0).toFixed(0)}</td><td>${inv.discountPct || 0}%</td>
            <td>${inv.taxPct || 0}%</td><td><b>${(inv.total || 0).toFixed(0)}</b></td>
            <td>${inv.status === 'PAID' ? 'مدفوع' : inv.status === 'PARTIAL' ? 'جزئي' : 'آجل'}</td>
        </tr>`).join('');
        const total = data.reduce((a: number, inv: any) => a + (inv.total || 0), 0);
        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"></head><body>
            <table dir="rtl" border="1"><thead><tr style="background:#1565C0;color:white">
                <th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>قبل الخصم</th><th>الخصم</th><th>الضريبة</th><th>الإجمالي (${currency})</th><th>الحالة</th>
            </tr></thead><tbody>${rows}<tr style="background:#eee"><td colspan="6"><b>الإجمالي</b></td><td><b>${total.toFixed(0)}</b></td><td></td></tr></tbody></table>
            </body></html>`;
        const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `فواتير_${new Date().toISOString().split('T')[0]}.xls` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    // ════════════════════════════════════════════════════════════════════
    return (
        <div className="unified-container animate-fade-in">
            {/* ── Header ── */}
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">سجل فواتير المبيعات</h1>
                    <p className="page-subtitle">بحث ذكي وطباعة PDF مخصصة وتصدير Excel</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handlePrintAggregated(filtered)} className="btn-modern btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>🖨️ طباعة السجل المجمع</button>
                    <div className="header-actions">
                        <button onClick={() => downloadExcel(false)} className="btn-modern btn-secondary" style={{ color: '#66bb6a', borderColor: 'rgba(102, 187, 106, 0.3)' }}>📥 تصدير الفلتر</button>
                    </div>
                </div>
            </header>

            {/* ── Search ── */}
            <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div className="sales-search-grid">
                    <div>
                        <label htmlFor="searchBy">البحث بـ</label>
                        <select id="searchBy" className="input-glass" value={searchBy} onChange={e => { setSearchBy(e.target.value as any); setSearch(''); }} style={{ width: '100%' }}>
                            <option value="client">اسم العميل</option>
                            <option value="invoice">رقم الفاتورة</option>
                        </select>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <label htmlFor="searchInput">{searchBy === 'client' ? 'اسم العميل' : 'رقم الفاتورة'}</label>
                        <input id="searchInput" type="text" className="input-glass" value={search}
                            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            placeholder={searchBy === 'client' ? 'ابدأ بكتابة اسم العميل..' : 'INV-0001..'} style={{ width: '100%' }}
                        />
                        {showDropdown && suggestions.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#1e2028', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', marginTop: '4px', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
                                {suggestions.map((s: string, i: number) => (
                                    <div key={i} onClick={() => { setSearch(s); setShowDropdown(false); }}
                                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        {searchBy === 'client' ? '👤 ' : '🧾 '}{s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div><label htmlFor="dateFrom">من تاريخ</label><input id="dateFrom" type="date" className="input-glass" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%' }} /></div>
                    <div><label htmlFor="dateTo">إلى تاريخ</label><input id="dateTo" type="date" className="input-glass" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%' }} /></div>
                    {(search || dateFrom || dateTo) && (
                        <div>
                            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }} className="btn-secondary" style={{ width: '100%', height: '42px', color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)' }}>✕ تفريغ</button>
                        </div>
                    )}
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#919398' }}>
                    النتائج: <strong style={{ color: '#fff' }}>{filtered.length}</strong> | إجمالي المبيعات بالفتره: <strong style={{ color: '#66bb6a' }}>{totalFiltered.toLocaleString('en-US')} {sym()}</strong>
                </div>
            </div>

            {/* ── Adaptive Data Table & Cards ── */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
                {loading ? <p>جاري التحميل...</p> : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="sales-mobile-cards">
                            {paginatedFiltered.map((inv: any) => (
                                <div key={inv.id} className="sales-card">
                                    <div className="sales-card-header">
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '1.05rem' }}>{inv.invoiceNo}</span>
                                            <div style={{ fontSize: '0.8rem', color: '#919398', marginTop: '2px' }}>{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</div>
                                        </div>
                                        <span className={`sh-badge ${inv.status === 'PAID' ? 'paid' : inv.status === 'PARTIAL' ? 'partial' : 'unpaid'}`}>
                                            {inv.status === 'PAID' ? 'مدفوع' : inv.status === 'PARTIAL' ? 'جزئي' : 'آجل'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.95rem' }}>👤 {inv.client?.name || '-'}</div>
                                    <div className="sales-card-grid">
                                        <div>الأساسي: <div className="sales-card-val">{(inv.subtotal || 0).toFixed(0)} {sym()}</div></div>
                                        {/* الصافي مخفي لتقليل الزحام البصري */}
                                    </div>
                                    <div className="sales-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                                        <button onClick={() => handlePrintDetailed(inv)} className="btn-modern btn-primary" style={{ flex: 1.5, padding: '10px' }} title="طباعة الفاتورة">🖨️ طباعة</button>
                                        <button onClick={() => window.location.href = `/sales?edit=${inv.id}`} className="btn-modern btn-secondary" style={{ flex: 1, color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)', padding: '10px' }} title="تعديل">✏️</button>
                                        <button onClick={() => handleDelete(inv)} disabled={deleting} className="btn-modern btn-danger" style={{ flex: 0.5, padding: '10px' }} title="حذف">🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="sales-desktop-table">
                            <table className="table-glass responsive-cards high-density">
                                <thead>
                                    <tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>قبل الخصم</th><th>الخصم/ض</th><th>الحالة</th><th style={{ textAlign: 'center' }}>الإجراءات</th></tr>
                                </thead>
                                <tbody>
                                    {paginatedFiltered.map((inv: any) => (
                                        <tr key={inv.id}>
                                            <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{inv.invoiceNo}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                                            <td>{inv.client?.name || '-'}</td>
                                            <td>{(inv.subtotal || 0).toFixed(0)} {sym()}</td>
                                            <td style={{ fontSize: '0.83rem', color: '#919398' }}>
                                                {inv.discountPct > 0 && <span style={{ color: '#66bb6a' }}>خ {inv.discountPct}% </span>}
                                                {inv.taxPct > 0 && <span style={{ color: '#ffa726' }}>ض {inv.taxPct}%</span>}
                                                {!inv.discountPct && !inv.taxPct && '-'}
                                            </td>
                                            <td>
                                                <span className={`sh-badge ${inv.status === 'PAID' ? 'paid' : inv.status === 'PARTIAL' ? 'partial' : 'unpaid'}`}>
                                                    {inv.status === 'PAID' ? 'مدفوع' : inv.status === 'PARTIAL' ? 'جزئي' : 'آجل'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button onClick={() => handlePrintDetailed(inv)} className="btn-modern btn-primary" style={{ width: '38px', height: '38px', padding: 0 }} title="طباعة">🖨️</button>
                                                    <button onClick={() => window.location.href = `/sales?edit=${inv.id}`} className="btn-modern btn-secondary" style={{ width: '38px', height: '38px', padding: 0, color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)' }} title="تعديل">✏️</button>
                                                    <button onClick={() => handleDelete(inv)} disabled={deleting} className="btn-modern btn-danger" style={{ width: '38px', height: '38px', padding: 0 }} title="حذف">🗑</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && !loading && (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>لا توجد نتائج</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
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
                                    <option style={{ color: '#000' }} value={15}>15</option>
                                    <option style={{ color: '#000' }} value={30}>30</option>
                                    <option style={{ color: '#000' }} value={50}>50</option>
                                    <option style={{ color: '#000' }} value="ALL">الكل</option>
                                </select>
                            </div>

                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flex: '1 1 auto', maxWidth: '350px' }}>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>&rarr; السابق</button>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', background: 'rgba(227,94,53,0.1)', color: 'var(--primary-color)', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr', whiteSpace: 'nowrap', border: '1px solid rgba(227,94,53,0.2)' }}>
                                        {currentPage} / {totalPages}
                                    </div>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>التالي &larr;</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── Action message (delete feedback) ── */}
            {actionMsg && !editModal && (
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: actionMsg.startsWith('✅') ? 'rgba(102,187,106,0.9)' : 'rgba(255,82,82,0.9)', color: '#fff', padding: '12px 28px', borderRadius: '30px', fontWeight: 'bold', zIndex: 9999 }}>
                    {actionMsg}
                </div>
            )}

            {/* ════ EDIT INVOICE MODAL ════ */}
            {editModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(41,182,246,0.3)', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#29b6f6' }}>✏️ تعديل الفاتورة</h3>
                            <button onClick={() => setEditModal(null)} style={{ background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: '1.4rem' }}>✕</button>
                        </div>
                        <p style={{ color: '#919398', marginBottom: '1.5rem', fontSize: '0.9rem' }}>فاتورة: <strong style={{ color: '#fff' }}>{editModal.invoiceNo}</strong> — {editModal.client?.name}</p>
                        {actionMsg && <div style={{ background: actionMsg.startsWith('✅') ? 'rgba(102,187,106,0.12)' : 'rgba(255,82,82,0.12)', color: actionMsg.startsWith('✅') ? '#66bb6a' : '#ff5252', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 'bold' }}>{actionMsg}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label>حالة الفاتورة</label>
                                <select className="input-glass" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                    <option value="UNPAID">⏳ آجل (غير مدفوع)</option>
                                    <option value="PARTIAL">🕐 جزئي (مدفوع جزء)</option>
                                    <option value="PAID">✅ مدفوع بالكامل</option>
                                </select>
                            </div>
                            <div>
                                <label>ملاحظة (اختياري)</label>
                                <input type="text" className="input-glass" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="أي ملاحظة تتعلق بالفاتورة.." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditModal(null)} className="btn-secondary">إلغاء</button>
                            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary">
                                {saving ? 'جاري الحفظ...' : '💾 حفظ التعديل'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}

