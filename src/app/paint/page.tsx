'use client';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/lib/reportTemplate';

type PaintEntry = {
    id: string;
    jobId: string;
    productName: string;
    quantity: number;
    color: string | null;
    colorCode: string | null;
    unitPrice: number;
    totalCost: number;
    status: 'PENDING_PAYMENT' | 'PAID';
    paidAt: string | null;
    createdAt: string;
    job: {
        id: string; serialNo: number; name: string; quantityProduced: number | null;
        invoice?: { id: string; client?: { name: string } } | null;
    };
    supplier?: { id: string; name: string; phone: string | null; } | null;
};

const getSym = () => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } };
const getAppName = () => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').companyName || 'Stand Masr ERP'; } catch { return 'Stand Masr ERP'; } };

export default function PaintDepartmentPage() {
    const sym = getSym();

    // ── data states ──
    const [entries, setEntries] = useState<PaintEntry[]>([]);
    const [statusFilter, setStatusFilter] = useState<'PENDING_PAYMENT' | 'PAID' | 'all'>('PENDING_PAYMENT');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [serialSearch, setSerialSearch] = useState('');
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5);
    const [treasuries, setTreasuries] = useState<any[]>([]);
    const [selectedTreasury, setSelectedTreasury] = useState('');

    // ── tab state ──
    const [activeTab, setActiveTab] = useState<'log' | 'pricing'>('log');

    // ── pricing states ──
    const [pricingItems, setPricingItems] = useState<any[]>([]);
    const [loadingPricing, setLoadingPricing] = useState(false);
    const [newPricingItem, setNewPricingItem] = useState({ description: '', price: '' });
    const [editingPricingItem, setEditingPricingItem] = useState<any>(null);
    const [pricingSearch, setPricingSearch] = useState('');
    const [pricingCurrentPage, setPricingCurrentPage] = useState(1);
    const [pricingPageSize, setPricingPageSize] = useState<'ALL' | number>(5);

    // ── action states ──
    const [payingId, setPayingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // ── edit modal ──
    const [editEntry, setEditEntry] = useState<PaintEntry | null>(null);
    const [editForm, setEditForm] = useState({ productName: '', quantity: '', color: '', colorCode: '', unitPrice: '' });
    const [saving, setSaving] = useState(false);

    // ── delete confirm modal ──
    const [deleteTarget, setDeleteTarget] = useState<PaintEntry | null>(null);

    // ── PDF ref ──
    const tableRef = useRef<HTMLDivElement>(null);

    // ─────────────────────────────────────────────────────────────────
    const fetchEntries = useCallback(async () => {
        setLoadingEntries(true);
        try {
            const res = await fetch(`/api/jobs/paint?status=${statusFilter}`);
            const data = await res.json();
            setEntries(Array.isArray(data) ? data : []);
        } catch { } finally { setLoadingEntries(false); }
    }, [statusFilter]);

    const fetchPricingItems = useCallback(async () => {
        setLoadingPricing(true);
        try {
            const res = await fetch('/api/paint/pricing');
            const data = await res.json();
            setPricingItems(Array.isArray(data) ? data : []);
        } catch { } finally { setLoadingPricing(false); }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);
    useEffect(() => { fetchPricingItems(); }, [fetchPricingItems]);

    useEffect(() => {
        fetch('/api/treasury').then(r => r.json()).then(d => {
            if (Array.isArray(d)) { setTreasuries(d); if (d.length > 0) setSelectedTreasury(d[0].id); }
        }).catch(() => { });

        const saved = localStorage.getItem('erp_paint_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const flash = (msg: string, isError = false) => {
        if (isError) { setActionError(msg); setActionSuccess(''); }
        else { setActionSuccess(msg); setActionError(''); }
        setTimeout(() => { setActionError(''); setActionSuccess(''); }, 4000);
    };

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_paint_pageSize', val);
        setCurrentPage(1);
    };

    // ── تأكيد الدفع ──
    const handleConfirmPayment = async (entry: PaintEntry) => {
        setPayingId(entry.id);
        try {
            const res = await fetch('/api/jobs/paint', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryId: entry.id, treasuryId: selectedTreasury || undefined })
            });
            const data = await res.json();
            if (!res.ok) flash(data.error || 'فشل الدفع', true);
            else { flash(`✅ تم خصم ${entry.totalCost.toFixed(0)} ${sym} من الخزينة`); await fetchEntries(); }
        } catch { flash('خطأ في الاتصال', true); }
        finally { setPayingId(null); }
    };

    // ── حذف ──
    const handleDelete = async (entry: PaintEntry) => {
        setDeletingId(entry.id);
        setDeleteTarget(null);
        try {
            const res = await fetch(`/api/jobs/paint?id=${entry.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) flash(data.error || 'فشل الحذف', true);
            else { flash('🗑️ تم حذف البند بنجاح'); await fetchEntries(); }
        } catch { flash('خطأ في الاتصال', true); }
        finally { setDeletingId(null); }
    };

    // ── فتح نافذة التعديل ──
    const openEdit = (entry: PaintEntry) => {
        setEditEntry(entry);
        setEditForm({
            productName: entry.productName,
            quantity: String(entry.quantity),
            color: entry.color || '',
            colorCode: entry.colorCode || '',
            unitPrice: String(entry.unitPrice),
        });
    };

    // ── حفظ التعديل ──
    const handleSaveEdit = async () => {
        if (!editEntry) return;
        setSaving(true);
        try {
            const res = await fetch('/api/jobs/paint', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryId: editEntry.id, ...editForm })
            });
            const data = await res.json();
            if (!res.ok) flash(data.error || 'فشل التعديل', true);
            else { flash('✏️ تم حفظ التعديل بنجاح'); setEditEntry(null); await fetchEntries(); }
        } catch { flash('خطأ في الاتصال', true); }
        finally { setSaving(false); }
    };

    // ── Pricing CRUD ──
    const handleAddPricing = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/paint/pricing', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPricingItem)
            });
            const data = await res.json();
            if (!res.ok) flash(data.error || 'فشل الإضافة', true);
            else {
                flash('✅ تم إضافة البند بنجاح');
                setNewPricingItem({ description: '', price: '' });
                await fetchPricingItems();
            }
        } catch { flash('خطأ في الاتصال', true); }
        finally { setSaving(false); }
    };

    const handleUpdatePricing = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPricingItem) return;
        setSaving(true);
        try {
            const res = await fetch('/api/paint/pricing', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPricingItem)
            });
            const data = await res.json();
            if (!res.ok) flash(data.error || 'فشل التعديل', true);
            else {
                flash('✏️ تم التعديل بنجاح');
                setEditingPricingItem(null);
                await fetchPricingItems();
            }
        } catch { flash('خطأ في الاتصال', true); }
        finally { setSaving(false); }
    };

    const handleDeletePricing = async (id: string) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        try {
            const res = await fetch(`/api/paint/pricing?id=${id}`, { method: 'DELETE' });
            if (!res.ok) flash('فشل الحذف', true);
            else { flash('🗑️ تم الحذف بنجاح'); await fetchPricingItems(); }
        } catch { flash('خطأ في الاتصال', true); }
    };
    // ── تصفية البيانات ──
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            if (dateFrom && new Date(e.createdAt) < new Date(dateFrom)) return false;
            if (dateTo && new Date(e.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
            if (clientSearch && !e.job?.invoice?.client?.name?.toLowerCase().includes(clientSearch.toLowerCase())) return false;
            if (serialSearch && !String(e.job?.serialNo).includes(serialSearch)) return false;
            return true;
        });
    }, [entries, dateFrom, dateTo, clientSearch, serialSearch]);

    const totalFiltered = filteredEntries.length;
    const totalPending = filteredEntries.filter(e => e.status === 'PENDING_PAYMENT').reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalPaid = filteredEntries.filter(e => e.status === 'PAID').reduce((acc, curr) => acc + curr.totalCost, 0);

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalFiltered / pageSize);
    const paginatedEntries = useMemo(() => {
        if (pageSize === 'ALL') return filteredEntries;
        return filteredEntries.slice((currentPage - 1) * (pageSize as number), currentPage * (pageSize as number));
    }, [filteredEntries, currentPage, pageSize]);

    // ── تصفية وتسعير البيانات الخاصة بالدهانات ──
    const handlePricingPageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPricingPageSize(newSize);
        setPricingCurrentPage(1);
    };

    const filteredPricingItems = useMemo(() => {
        return pricingItems.filter(item => {
            if (pricingSearch && !item.description.toLowerCase().includes(pricingSearch.toLowerCase())) return false;
            return true;
        });
    }, [pricingItems, pricingSearch]);

    const pricingTotalPages = pricingPageSize === 'ALL' ? 1 : Math.ceil(filteredPricingItems.length / (pricingPageSize as number));
    const paginatedPricingItems = useMemo(() => {
        if (pricingPageSize === 'ALL') return filteredPricingItems;
        return filteredPricingItems.slice((pricingCurrentPage - 1) * (pricingPageSize as number), pricingCurrentPage * (pricingPageSize as number));
    }, [filteredPricingItems, pricingCurrentPage, pricingPageSize]);

    // ── طباعة PDF عبر window.print ──
    const handlePrintPDF = async () => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';
        const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

        const allData = statusFilter === 'PENDING_PAYMENT' ? entries.filter(e => e.status === 'PENDING_PAYMENT')
            : statusFilter === 'PAID' ? entries.filter(e => e.status === 'PAID') : entries;
        const totalAmount = allData.reduce((s, e) => s + e.totalCost, 0);
        const filterLabel = statusFilter === 'PENDING_PAYMENT' ? 'المعلقة' : statusFilter === 'PAID' ? 'المدفوعة' : 'الكل';

        const rows = allData.map(e => `
            <tr>
                <td style="text-align:center">#${e.job.serialNo}</td>
                <td>${e.job.name}</td>
                <td>${e.productName}</td>
                <td style="text-align:center">${e.quantity}</td>
                <td style="text-align:center">${e.color || '—'}${e.colorCode ? ` <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${e.colorCode.startsWith('#') ? e.colorCode : '#888'};vertical-align:middle;margin-right:4px;"></span>` : ''}</td>
                <td style="text-align:center">${e.unitPrice.toFixed(0)} ${symVal}</td>
                <td style="text-align:center;font-weight:700;color:${e.status === 'PAID' ? '#166534' : '#991b1b'}">${e.totalCost.toFixed(0)} ${symVal}</td>
                <td style="text-align:center">${new Date(e.createdAt).toLocaleDateString('ar-EG')}</td>
                <td style="text-align:center">
                    <span style="padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;${e.status === 'PAID' ? 'background:#dcfce7;color:#166534;' : 'background:#fee2e2;color:#991b1b;'}">
                        ${e.status === 'PAID' ? `✅ مدفوع` : '⏳ معلق'}
                    </span>
                </td>
            </tr>
        `).join('');

        const bodyHtml = `
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">عدد العمليات (${filterLabel})</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: #1e293b;">${allData.length}</div>
                </div>
                <div style="flex: 1; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">إجمالي المبلغ</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: ${config.accentColor || '#E35E35'};">${totalAmount.toLocaleString('en-US')} ${symVal}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#الأمر</th><th>اسم الشغلانة</th><th>المنتج</th><th>الكمية</th>
                        <th>اللون</th><th>سعر/قطعة</th><th>الإجمالي</th><th>التاريخ</th><th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;

        const html = generatePrintHtml(bodyHtml, `تقرير عمليات قسم الدهانات — ${filterLabel}`, config);

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

    // ── إرسال واتساب للمورد ──
    const handleSendWhatsApp = (entry: PaintEntry) => {
        if (!entry.supplier || !entry.supplier.phone) {
            flash('لا يوجد رقم هاتف مسجل لهذا المورد', true);
            return;
        }

        const msg = `مرحباً ${entry.supplier.name}،
أمر دهان جديد (رقم: ${entry.job.serialNo})

*المنتج:* ${entry.productName}
*الكمية:* ${entry.quantity}
*اللون المطلوب:* ${entry.color || 'بدون لون محدد'}
*التكلفة المقدرة:* ${entry.totalCost} ${sym}

يرجى تأكيد الاستلام وموعد التسليم. شكراً.`;

        const encodedMsg = encodeURIComponent(msg);
        let phoneStr = entry.supplier.phone.replace(/[^0-9]/g, '');
        if (phoneStr.length === 11 && phoneStr.startsWith('01')) {
            phoneStr = '2' + phoneStr;
        }
        window.open(`https://wa.me/${phoneStr}?text=${encodedMsg}`, '_blank');
    };

    // ── طباعة وصل مفرد لشغلانة ──
    // ── طباعة وصل مفرد لشغلانة ──
    const handleSaveSinglePDF = async (entry: PaintEntry) => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';

        const bodyHtml = `
            <style>
                .receipt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
                .receipt-card { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
                .receipt-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
                .receipt-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
                .receipt-cost-box { background: ${entry.status === 'PAID' ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${entry.status === 'PAID' ? '#16a34a' : '#ef4444'}; padding: 20px; text-align: center; border-radius: 12px; margin-top: 10px; }
                .receipt-cost-label { font-size: 1rem; color: ${entry.status === 'PAID' ? '#166534' : '#991b1b'}; margin-bottom: 5px; font-weight: 700; }
                .receipt-cost-val { font-size: 2.2rem; font-weight: 900; color: ${entry.status === 'PAID' ? '#15803d' : '#b91c1c'}; }
                .receipt-status-badge { display: inline-block; margin-top: 10px; padding: 5px 15px; font-size: 0.9rem; font-weight: bold; border-radius: 20px; background: ${entry.status === 'PAID' ? '#16a34a' : '#ef4444'}; color: #fff; }
            </style>

            <div class="receipt-info-grid">
                <div class="receipt-card">
                    <div class="receipt-label">أمر تصنيع</div>
                    <div class="receipt-value">${entry.job.name}</div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">سيريال: #${entry.job.serialNo}</div>
                </div>
                <div class="receipt-card">
                    <div class="receipt-label">التاريخ</div>
                    <div class="receipt-value">${new Date(entry.createdAt).toLocaleDateString('ar-EG')}</div>
                </div>
                <div class="receipt-card">
                    <div class="receipt-label">المنتج / البيان</div>
                    <div class="receipt-value">${entry.productName}</div>
                </div>
                <div class="receipt-card">
                    <div class="receipt-label">اللون</div>
                    <div class="receipt-value">${entry.color || '—'}</div>
                </div>
                <div class="receipt-card">
                    <div class="receipt-label">الكمية</div>
                    <div class="receipt-value">${entry.quantity}</div>
                </div>
                <div class="receipt-card">
                    <div class="receipt-label">سعر الوحدة</div>
                    <div class="receipt-value">${entry.unitPrice.toFixed(0)} ${symVal}</div>
                </div>
            </div>

            <div class="receipt-cost-box">
                <div class="receipt-cost-label">الإجمالي المطلوب لمصنع الدهانات</div>
                <div class="receipt-cost-val">${entry.totalCost.toFixed(0)} ${symVal}</div>
                <div class="receipt-status-badge">${entry.status === 'PAID' ? '✅ تم السداد' : '⏳ معلق وقيد الاستحقاق'}</div>
            </div>
        `;

        const html = generatePrintHtml(bodyHtml, `إيصال دهانات - أمر التشغيل #${entry.job.serialNo}`, config);

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

    // ── حساب المعاينة في نافذة التعديل ──
    const editPreviewTotal = editEntry
        ? (parseFloat(editForm.quantity) || 0) * (parseFloat(editForm.unitPrice) || 0)
        : 0;

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header" style={{ marginBottom: '1.25rem', padding: '1.5rem', borderRadius: '20px', background: 'color-mix(in srgb, var(--primary-color), transparent 97%)' }}>
                <div style={{ flex: 1 }}>
                    <h1 className="page-title" style={{ fontSize: '1.6rem', letterSpacing: '-0.02em', marginBottom: '6px' }}>🎨 مدير قسم الدهانات</h1>
                    <p className="page-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>متابعة مديونيات الدهانات وتسعير قطع الدهان</p>
                </div>
                {activeTab === 'log' && (
                    <button onClick={handlePrintPDF} className="btn-modern btn-primary" style={{ padding: '0 25px', height: '44px', fontWeight: 800 }}>🖨️ تقرير مفصل</button>
                )}
            </header>

            {/* ══ TABS ══ */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '12px', width: 'fit-content' }}>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`btn-modern ${activeTab === 'log' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ background: activeTab === 'log' ? '#26c6da' : 'transparent', border: 'none', color: activeTab === 'log' ? '#fff' : '#888', padding: '8px 24px' }}>
                    سجل العمليات والمديونيات
                </button>
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`btn-modern ${activeTab === 'pricing' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ background: activeTab === 'pricing' ? '#ffa726' : 'transparent', border: 'none', color: activeTab === 'pricing' ? '#000' : '#888', padding: '8px 24px' }}>
                    تسعير قطع الدهانات الافتراضية
                </button>
            </div>

            {/* ══ Action Feedback ══ */}
            {actionError && (
                <div className="sh-badge unpaid animate-fade-in" style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '1.5rem', textAlign: 'center', borderRadius: '10px' }}>
                    ⚠️ {actionError}
                </div>
            )}
            {actionSuccess && (
                <div className="sh-badge paid animate-fade-in" style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '1.5rem', textAlign: 'center', borderRadius: '10px' }}>
                    {actionSuccess}
                </div>
            )}

            {activeTab === 'log' ? (
                <>
                    {/* ══ Compact KPI Bar ══ */}

                    {/* ══ Compact KPI Bar ══ */}
                    <div className="paint-kpi-bar glass-panel" style={{
                        padding: '1.2rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(255,255,255,0.015)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div className="paint-kpi-item" style={{ color: '#ff5252', background: 'rgba(255, 82, 82, 0.05)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(255, 82, 82, 0.1)', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.72rem', marginBottom: '8px', opacity: 0.8 }}>⌛ مديونية معلقة</div>
                            <div className="paint-kpi-val" style={{ fontSize: '1.3rem', fontWeight: 900 }}>{totalPending.toFixed(0)} <small style={{ fontSize: '0.7rem' }}>{sym}</small></div>
                        </div>
                        <div className="paint-kpi-item" style={{ color: '#66bb6a', background: 'rgba(102, 187, 106, 0.05)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(102, 187, 106, 0.1)', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.72rem', marginBottom: '8px', opacity: 0.8 }}>✅ تم تسديده</div>
                            <div className="paint-kpi-val" style={{ fontSize: '1.3rem', fontWeight: 900 }}>{totalPaid.toFixed(0)} <small style={{ fontSize: '0.7rem' }}>{sym}</small></div>
                        </div>
                        <div className="paint-kpi-item" style={{ color: '#26c6da', background: 'rgba(38, 198, 218, 0.05)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(38, 198, 218, 0.1)', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.72rem', marginBottom: '8px', opacity: 0.8 }}>📊 إجمالي الأعمال</div>
                            <div className="paint-kpi-val" style={{ fontSize: '1.3rem', fontWeight: 900 }}>{(totalPending + totalPaid).toFixed(0)} <small style={{ fontSize: '0.7rem' }}>{sym}</small></div>
                        </div>
                    </div>

                    {statusFilter === 'PENDING_PAYMENT' && totalPending === 0 && !loadingEntries && (
                        <div className="glass-panel animate-fade-in" style={{
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            marginBottom: '1.5rem',
                            background: 'rgba(102, 187, 106, 0.05)',
                            border: '1px dashed rgba(102, 187, 106, 0.3)',
                            borderRadius: '20px'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎉</div>
                            <h3 style={{ color: '#66bb6a', marginBottom: '10px', fontSize: '1.3rem' }}>لا توجد مديونيات معلقة حالياً</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>جميع مديونيات الدهانات تم تسديدها بالكامل. عمل رائع!</p>
                        </div>
                    )}



                    {/* ══ Filter & Treasury Bar ══ */}
                    <div className="glass-panel" style={{ padding: '15px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px' }}>
                                <button className={`paint-filter-btn ${statusFilter === 'PENDING_PAYMENT' ? 'active pending' : ''}`} onClick={() => setStatusFilter('PENDING_PAYMENT')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s', background: statusFilter === 'PENDING_PAYMENT' ? 'rgba(255,82,82,0.2)' : 'transparent', color: statusFilter === 'PENDING_PAYMENT' ? '#ff5252' : '#888' }}>⏳ معلقة</button>
                                <button className={`paint-filter-btn ${statusFilter === 'PAID' ? 'active paid' : ''}`} onClick={() => setStatusFilter('PAID')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s', background: statusFilter === 'PAID' ? 'rgba(102,187,106,0.2)' : 'transparent', color: statusFilter === 'PAID' ? '#66bb6a' : '#888' }}>✅ مدفوعة</button>
                                <button className={`paint-filter-btn ${statusFilter === 'all' ? 'active all' : ''}`} onClick={() => setStatusFilter('all')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.2s', background: statusFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', color: statusFilter === 'all' ? '#fff' : '#888' }}>📋 الكل</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label htmlFor="treasury-sel" style={{ fontSize: '0.85rem', color: '#919398', fontWeight: 600 }}>💰 خزينة الصرف:</label>
                                <select id="treasury-sel" className="input-glass" style={{ width: '180px', padding: '8px' }} value={selectedTreasury} onChange={e => setSelectedTreasury(e.target.value)}>
                                    {treasuries.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.type}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px', display: 'block' }}>من تاريخ</label>
                                <input type="date" className="input-glass" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px', display: 'block' }}>إلى تاريخ</label>
                                <input type="date" className="input-glass" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px', display: 'block' }}>بحث بالعميل</label>
                                <input type="text" className="input-glass" placeholder="اسم العميل.." value={clientSearch} onChange={e => setClientSearch(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px', display: 'block' }}>رقم الأوردر</label>
                                <input type="text" className="input-glass" placeholder="رقم الشغلانة.." value={serialSearch} onChange={e => setSerialSearch(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                        </div>
                    </div>

                    {/* ══ High-Density Data Grid ══ */}
                    <div className="table-responsive-wrapper">
                        <table className="table-glass high-density responsive-cards">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>أمر الشغل</th>
                                    <th>اسم الصنف</th>
                                    <th>اللون</th>
                                    <th style={{ textAlign: 'center' }}>الكمية</th>
                                    <th style={{ textAlign: 'center' }}>الإجمالي</th>
                                    <th style={{ textAlign: 'center' }}>الحالة</th>
                                    <th style={{ textAlign: 'center' }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingEntries ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>⏳ جاري التحميل...</td></tr>
                                ) : paginatedEntries.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                                        {statusFilter === 'PENDING_PAYMENT' ? '🎉 لا توجد مديونيات معلقة حالياً' : 'لا توجد بيانات للعرض'}
                                    </td></tr>
                                ) : (
                                    paginatedEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td data-label="أمر الشغل" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                #{entry.job?.serialNo || '??'}
                                            </td>
                                            <td data-label="اسم الصنف">
                                                <div style={{ fontWeight: 700, color: '#fff' }}>{entry.productName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.job?.name}</div>
                                            </td>
                                            <td data-label="اللون">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {entry.colorCode && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: entry.colorCode.startsWith('#') ? entry.colorCode : '#888', border: '1px solid rgba(255,255,255,0.1)' }} />}
                                                    <span style={{ fontSize: '0.85rem' }}>{entry.color || '—'}</span>
                                                </div>
                                            </td>
                                            <td data-label="الكمية" style={{ textAlign: 'center' }}>
                                                <span className="sh-badge partial" style={{ minWidth: '40px', textAlign: 'center' }}>{entry.quantity}</span>
                                            </td>
                                            <td data-label="الإجمالي" style={{ textAlign: 'center', fontWeight: 800, color: entry.status === 'PAID' ? '#66bb6a' : '#ff5252' }}>
                                                {entry.totalCost?.toLocaleString('en-US')} <small>{sym}</small>
                                            </td>
                                            <td data-label="الحالة" style={{ textAlign: 'center' }}>
                                                <span className={`sh-badge ${entry.status === 'PAID' ? 'paid' : 'unpaid'}`}>
                                                    {entry.status === 'PAID' ? 'مقبوض' : 'معلق'}
                                                </span>
                                            </td>
                                            <td data-label="الإجراءات" style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    {entry.status === 'PENDING_PAYMENT' && (
                                                        <button onClick={() => handleConfirmPayment(entry)} className="btn-modern btn-primary btn-sm" disabled={!!payingId} title="تسديد المديونية">
                                                            {payingId === entry.id ? '...' : '💰'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => openEdit(entry)} className="btn-modern btn-secondary btn-sm" style={{ padding: 0, width: '32px', height: '32px' }} title="تعديل">✏️</button>
                                                    <button onClick={() => setDeleteTarget(entry)} className="btn-modern btn-danger btn-sm" style={{ padding: 0, width: '32px', height: '32px' }} disabled={!!deletingId} title="حذف">🗑️</button>
                                                    <button onClick={() => handleSaveSinglePDF(entry)} className="btn-modern btn-secondary btn-sm" style={{ padding: 0, width: '32px', height: '32px', color: '#26c6da', borderColor: 'rgba(38,198,218,0.2)' }} title="حفظ PDF">📄</button>
                                                    <button onClick={() => handleSendWhatsApp(entry)} className="btn-modern btn-secondary btn-sm" style={{ padding: 0, width: '32px', height: '32px', color: '#25d366', borderColor: 'rgba(37,211,102,0.2)' }} title="واتساب">💬</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ══ Pagination ══ */}
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

                    {/* ══ Summary Bar ══ */}
                    {!loadingEntries && filteredEntries.length > 0 && (
                        <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(38,198,218,0.2)', background: 'rgba(38,198,218,0.03)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍 عرض <span style={{ color: '#fff', fontWeight: 700 }}>{filteredEntries.length}</span> نتيجة منتظرة</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ fontSize: '1rem', color: '#fff' }}>إجمالي الفلتر:</span>
                                <strong style={{ fontSize: '1.3rem', color: '#26c6da' }}>{filteredEntries.reduce((s: number, e: PaintEntry) => s + e.totalCost, 0).toLocaleString('en-US')} {sym}</strong>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* ══ PRICING TAB ══ */
                <div className="animate-fade-in">
                    <div className="glass-panel" style={{ padding: '20px', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#ffa726' }}>إضافة بند تسعير جديد</h3>
                        <form onSubmit={handleAddPricing} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 2, minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>البيان (مثال: استاند مقاس 50*240)</label>
                                <input type="text" className="input-glass" required value={newPricingItem.description} onChange={e => setNewPricingItem({ ...newPricingItem, description: e.target.value })} style={{ width: '100%' }} placeholder="أدخل اسم البيان.." />
                            </div>
                            <div style={{ flex: 1, minWidth: '120px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>السعر ({sym})</label>
                                <input type="number" step="any" min="0" className="input-glass" required value={newPricingItem.price} onChange={e => setNewPricingItem({ ...newPricingItem, price: e.target.value })} style={{ width: '100%' }} placeholder="السعر" />
                            </div>
                            <button type="submit" className="btn-modern btn-primary" disabled={saving} style={{ padding: '10px 20px', background: '#ffa726', color: '#000', border: 'none' }}>
                                + إضافة التسعير
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel" style={{ padding: '15px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="input-group" style={{ flex: 1, maxWidth: '400px', margin: 0 }}>
                            <input type="text" className="input-glass" placeholder="🔍 ابحث في بنود التسعير..." value={pricingSearch} onChange={e => setPricingSearch(e.target.value)} style={{ width: '100%', padding: '10px' }} />
                        </div>
                    </div>

                    <div className="table-responsive-wrapper">
                        <table className="table-glass responsive-cards">
                            <thead>
                                <tr>
                                    <th>البيان</th>
                                    <th style={{ textAlign: 'center' }}>السعر ({sym})</th>
                                    <th style={{ textAlign: 'center' }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingPricing ? (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</td></tr>
                                ) : paginatedPricingItems.length === 0 ? (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>لا توجد بنود تسعير للعرض</td></tr>
                                ) : (
                                    paginatedPricingItems.map((item) => (
                                        <tr key={item.id}>
                                            <td data-label="البيان" style={{ fontWeight: 700 }}>{item.description}</td>
                                            <td data-label="السعر" style={{ textAlign: 'center', color: '#ffa726', fontWeight: 800 }}>{item.price.toLocaleString('en-US')} {sym}</td>
                                            <td data-label="الإجراءات" style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => setEditingPricingItem(item)} className="btn-modern btn-secondary btn-sm" title="تعديل">✏️</button>
                                                    <button onClick={() => handleDeletePricing(item.id)} className="btn-modern btn-danger btn-sm" title="حذف">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ══ Pricing Pagination ══ */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap-reverse', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '20px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>عدد النتائج:</span>
                            <select
                                value={pricingPageSize}
                                onChange={(e) => handlePricingPageSizeChange(e.target.value)}
                                style={{ padding: '0px', fontSize: '0.9rem', width: 'auto', border: 'none', background: 'transparent', color: '#ffa726', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                                aria-label="Items per page"
                            >
                                <option style={{ color: '#000' }} value={5}>5</option>
                                <option style={{ color: '#000' }} value={15}>15</option>
                                <option style={{ color: '#000' }} value={30}>30</option>
                                <option style={{ color: '#000' }} value={50}>50</option>
                                <option style={{ color: '#000' }} value="ALL">الكل</option>
                            </select>
                        </div>

                        {pricingTotalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flex: '1 1 auto', maxWidth: '350px' }}>
                                <button disabled={pricingCurrentPage === 1} onClick={() => setPricingCurrentPage(p => p - 1)} className="btn-modern btn-secondary" style={{ opacity: pricingCurrentPage === 1 ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>&rarr; السابق</button>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', background: 'rgba(255,167,38,0.1)', color: '#ffa726', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr', whiteSpace: 'nowrap', border: '1px solid rgba(255,167,38,0.2)' }}>
                                    {pricingCurrentPage} / {pricingTotalPages}
                                </div>
                                <button disabled={pricingCurrentPage === pricingTotalPages} onClick={() => setPricingCurrentPage(p => p + 1)} className="btn-modern btn-secondary" style={{ opacity: pricingCurrentPage === pricingTotalPages ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>التالي &larr;</button>
                            </div>
                        )}
                    </div>

                    {/* Edit Pricing Modal */}
                    {editingPricingItem && (
                        <div className="confirm-overlay animate-fade-in" onClick={() => setEditingPricingItem(null)}>
                            <div className="glass-panel confirm-modal" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                                <h3 style={{ color: '#ffa726', marginBottom: '1.5rem', marginTop: 0 }}>تعديل التسعير</h3>
                                <form onSubmit={handleUpdatePricing}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>البيان</label>
                                        <input type="text" className="input-glass" required value={editingPricingItem.description} onChange={e => setEditingPricingItem({ ...editingPricingItem, description: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>السعر</label>
                                        <input type="number" step="any" min="0" className="input-glass" required value={editingPricingItem.price} onChange={e => setEditingPricingItem({ ...editingPricingItem, price: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn-modern btn-primary" disabled={saving} style={{ flex: 1 }}>حفظ التعديل</button>
                                        <button type="button" className="btn-modern btn-secondary" onClick={() => setEditingPricingItem(null)} style={{ flex: 1 }}>إلغاء</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══ EDIT MODAL ══ */}
            {editEntry && (
                <div className="confirm-overlay animate-fade-in" onClick={() => setEditEntry(null)}>
                    <div className="glass-panel confirm-modal" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: '#ffa726', margin: 0 }}>✏️ تعديل بند الدهان</h3>
                            <button onClick={() => setEditEntry(null)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '1.5rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.85rem' }}>
                            أمر تصنيع <strong style={{ color: 'var(--primary-color)' }}>#{editEntry.job.serialNo}</strong> — {editEntry.job.name}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>اسم الصنف</label>
                                <input type="text" className="input-glass" style={{ width: '100%' }} value={editForm.productName} onChange={e => setEditForm(f => ({ ...f, productName: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>الكمية</label>
                                    <input type="number" className="input-glass" style={{ width: '100%' }} value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>سعر الوحدة</label>
                                    <input type="number" className="input-glass" style={{ width: '100%' }} value={editForm.unitPrice} onChange={e => setEditForm(f => ({ ...f, unitPrice: e.target.value }))} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>اللون</label>
                                    <input type="text" className="input-glass" style={{ width: '100%' }} value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>كود اللون (HEX)</label>
                                    <input type="text" className="input-glass" style={{ width: '100%' }} value={editForm.colorCode} onChange={e => setEditForm(f => ({ ...f, colorCode: e.target.value }))} placeholder="#FFFFFF" />
                                </div>
                            </div>

                            <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,167,38,0.1)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem' }}>الإجمالي المحدث:</span>
                                <strong style={{ fontSize: '1.2rem', color: '#ffa726' }}>{editPreviewTotal.toLocaleString('en-US')} {sym}</strong>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="btn-modern btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSaveEdit}>{saving ? '...' : '💾 حفظ التعديلات'}</button>
                                <button className="btn-modern btn-secondary" style={{ flex: 1 }} onClick={() => setEditEntry(null)}>إلغاء</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ DELETE CONFIRM MODAL ══ */}
            {deleteTarget && (
                <div className="confirm-overlay animate-fade-in" onClick={() => setDeleteTarget(null)}>
                    <div className="glass-panel confirm-modal" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                        <h3 style={{ color: '#ff5252', marginTop: 0 }}>تأكيد الحذف</h3>
                        <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            هل أنت متأكد من حذف بند دهان <strong style={{ color: '#fff' }}>{deleteTarget.productName}</strong>؟<br />
                            سيتم حذف العملية نهائياً من سجلات أمر التصنيع.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                            <button className="btn-modern btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteTarget)}>نعم، احذف</button>
                            <button className="btn-modern btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .paint-kpi-bar {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .mobile-hide {
                    display: block;
                }
                @media (max-width: 768px) {
                    .paint-kpi-bar {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                    }
                    .mobile-hide {
                        display: none !important;
                    }
                    .paint-kpi-item {
                        background: rgba(0,0,0,0.2);
                        padding: 10px;
                        border-radius: 10px;
                    }
                }
            `}</style>
        </div>
    );
}
