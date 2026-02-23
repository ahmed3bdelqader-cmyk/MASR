'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

type InventoryItem = {
    id: string; type: string; category: string | null;
    name: string; stock: number; unit: string; lastPurchasedPrice?: number;
};

const typeLabel = (t: string) => t === 'FINAL_PRODUCT' ? 'منتج نهائي' : 'خامة/مستلزم';
const typeColor = (t: string) => t === 'FINAL_PRODUCT' ? '#66bb6a' : '#29b6f6';

const TABS = [
    { key: 'ALL', label: 'الكل', color: 'var(--primary-color)' },
    { key: 'MATERIAL', label: '🔩 خامات ومستلزمات', color: '#29b6f6' },
    { key: 'FINAL', label: '✅ منتجات نهائية (مخزن)', color: '#66bb6a' },
    { key: 'PRICING', label: '🏷 تسعير منتجات مصنعة', color: '#ab47bc' },
    { key: 'AUDIT', label: '📊 الجرد التفصيلي', color: '#ffa726' },
];

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [editForm, setEditForm] = useState({ name: '', stock: '', unit: '', category: '', type: 'MATERIAL' });
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', stock: '', unit: 'قطعة', category: '', type: 'MATERIAL' });

    // Alert thresholds (configurable per item)
    const [alertThresholds, setAlertThresholds] = useState<Record<string, number>>({});
    const [showAlerts, setShowAlerts] = useState(true);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    // Load alert thresholds from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('erp_stock_alerts');
            if (saved) setAlertThresholds(JSON.parse(saved));
        } catch { }
    }, []);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // ── Audit filter state ─────────────────────────────────────────────────────
    const [auditSearch, setAuditSearch] = useState('');
    const [auditTypeFilter, setAuditTypeFilter] = useState('ALL'); // ALL | MATERIAL | FINAL_PRODUCT
    const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL'); // ALL or specific Category
    const [auditLowOnly, setAuditLowOnly] = useState(false);

    const fetchInventory = async () => {
        const res = await fetch('/api/inventory');
        const data = await res.json();
        setItems(data);
        setLoading(false);
    };
    useEffect(() => { fetchInventory(); }, []);

    const openEdit = (item: InventoryItem) => {
        setEditItem(item);
        setEditForm({ name: item.name, stock: String(item.stock), unit: item.unit, category: item.category || '', type: item.type });
    };

    const handleSaveEdit = async () => {
        if (!editItem) return;
        setSaving(true);
        const res = await fetch('/api/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editItem.id, ...editForm })
        });
        if (res.ok) { setEditItem(null); fetchInventory(); }
        setSaving(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
        const res = await fetch('/api/inventory', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) fetchInventory();
        else alert('فشل الحذف - ربما الصنف مرتبط بعمليات أخرى');
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/inventory', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm)
        });
        if (res.ok) { setShowAdd(false); setAddForm({ name: '', stock: '', unit: 'قطعة', category: '', type: 'MATERIAL' }); fetchInventory(); }
    };

    const sym = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } })();

    // ── Filtered audit list ────────────────────────────────────────────────────
    const fullAuditList = useMemo(() =>
        items.filter(i => i.type === 'MATERIAL' || (i.type === 'FINAL_PRODUCT' && i.category !== 'MANUFACTURED_PRICING')),
        [items]);

    const auditList = useMemo(() => {
        let list = fullAuditList;
        if (auditTypeFilter !== 'ALL') list = list.filter(i => i.type === auditTypeFilter);
        if (auditCategoryFilter !== 'ALL') list = list.filter(i => i.category === auditCategoryFilter);
        if (auditSearch) list = list.filter(i => i.name.includes(auditSearch) || (i.category || '').includes(auditSearch));
        if (auditLowOnly) list = list.filter(i => i.stock <= 5);
        return list;
    }, [fullAuditList, auditTypeFilter, auditCategoryFilter, auditSearch, auditLowOnly]);

    const uniqueCategories = useMemo(() => {
        const cats = fullAuditList.map(i => i.category).filter(c => c && c.trim() !== '');
        return Array.from(new Set(cats));
    }, [fullAuditList]);

    // ── Print audit — filtered items only ─────────────────────────────────────
    const printInventoryAudit = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        let t: any = {};
        try {
            const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
            const saved = localStorage.getItem('erp_invoice_template');
            t = { companyName: s.appName || '', accentColor: s.primaryColor || '#E35E35', footerText: 'شكراً لتعاملكم معنا', ...(saved ? JSON.parse(saved) : {}) };
        } catch { }
        const accent = t.accentColor || '#E35E35';
        const totalValue = auditList.reduce((s, i) => s + (i.stock * (i.lastPurchasedPrice || 0)), 0);
        const filterLabel = (auditTypeFilter === 'MATERIAL' ? 'خامات ومستلزمات' : auditTypeFilter === 'FINAL_PRODUCT' ? 'منتجات نهائية' : 'الكل') + (auditCategoryFilter !== 'ALL' ? ` - ${auditCategoryFilter}` : '');
        const rows = auditList.map((item, idx) => {
            const val = item.stock * (item.lastPurchasedPrice || 0);
            const low = item.stock <= 5;
            return `<tr><td style="text-align:center;color:#888">${idx + 1}</td><td>${item.name}</td><td style="color:${typeColor(item.type)};text-align:center">${typeLabel(item.type)}</td><td style="text-align:center;color:#888">${item.category || '-'}</td><td style="text-align:center;font-weight:bold;color:${low ? '#c0392b' : '#1a7a3c'}">${item.stock.toFixed(0)}${low ? ' ⚠' : ''}</td><td style="text-align:center;color:#888">${item.unit}</td><td style="text-align:center">${item.lastPurchasedPrice ? item.lastPurchasedPrice.toFixed(0) : '-'}</td><td style="text-align:center;font-weight:bold;color:${val > 0 ? '#1565C0' : '#888'}">${val > 0 ? val.toFixed(0) : '-'}</td></tr>`;
        }).join('');
        win.document.write(`<html dir="rtl"><head><title>تقرير الجرد التفصيلي</title><style>@page{size:A4 landscape;margin:10mm 12mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#222;font-size:12px;margin:0}.hdr{border-bottom:3px solid ${accent};padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between}.filter-tag{display:inline-block;padding:2px 10px;border-radius:12px;background:${accent}22;color:${accent};font-size:0.78rem;margin-top:4px}h1{margin:0;color:${accent};font-size:1.2rem}table{width:100%;border-collapse:collapse}th{background:${accent};color:#fff;padding:6px 8px;text-align:right;font-size:0.8rem}td{padding:5px 8px;border-bottom:1px solid #eee;font-size:0.79rem}tr:nth-child(even) td{background:#f9f9f9}.footer-row{background:${accent}!important}.footer-row td{color:#fff!important;font-weight:bold!important;text-align:center!important}</style></head><body onload="window.print()"><div class="hdr"><div><h1>${t.companyName}</h1><p style="margin:3px 0;color:#666;font-size:0.78rem">تاريخ الجرد: ${new Date().toLocaleDateString('ar-EG')} — إجمالي الأصناف المعروضة: ${auditList.length}</p><span class="filter-tag">الفلتر: ${filterLabel}${auditSearch ? ` | بحث: "${auditSearch}"` : ''}${auditLowOnly ? ' | منخفضة فقط' : ''}</span></div><h2 style="color:${accent};margin:0">📊 تقرير الجرد التفصيلي</h2></div><table><thead><tr><th style="text-align:center">#</th><th>اسم الصنف</th><th style="text-align:center">النوع</th><th style="text-align:center">التصنيف</th><th style="text-align:center">الكمية</th><th style="text-align:center">الوحدة</th><th style="text-align:center">سعر الوحدة (${sym})</th><th style="text-align:center">القيمة (${sym})</th></tr></thead><tbody>${rows}<tr class="footer-row"><td colspan="7">إجمالي قيمة الأصناف المعروضة</td><td>${totalValue.toLocaleString('ar-EG', { minimumFractionDigits: 0 })} ${sym}</td></tr></tbody></table>${t.footerText ? `<div style="margin-top:16px;padding-top:10px;border-top:1px solid #eee;text-align:center;color:#777;font-size:0.8rem">${t.footerText}</div>` : ''}</body></html>`);
        win.document.close();
    };

    // Filter logic for main tabs
    const filtered = items.filter(item => {
        const searchMatch = !search || item.name.includes(search) || (item.category || '').includes(search);
        const catMatch = categoryFilter === 'ALL' || item.category === categoryFilter;
        if (!catMatch) return false;

        if (filter === 'ALL') return searchMatch;
        if (filter === 'MATERIAL') return item.type === 'MATERIAL' && searchMatch;
        if (filter === 'FINAL') return item.type === 'FINAL_PRODUCT' && item.category !== 'MANUFACTURED_PRICING' && searchMatch;
        if (filter === 'PRICING') return item.category === 'MANUFACTURED_PRICING' && searchMatch;
        return searchMatch;
    });

    const uniqueMainCategories = useMemo(() => {
        let relevant = items;
        if (filter === 'MATERIAL') relevant = items.filter(i => i.type === 'MATERIAL');
        if (filter === 'FINAL') relevant = items.filter(i => i.type === 'FINAL_PRODUCT' && i.category !== 'MANUFACTURED_PRICING');
        const cats = relevant.map(i => i.category).filter(c => c && c.trim() !== '' && c !== 'MANUFACTURED_PRICING');
        return Array.from(new Set(cats));
    }, [items, filter]);

    // Reset pagination when filters change
    useEffect(() => { setCurrentPage(1); }, [filter, search, categoryFilter, auditSearch, auditTypeFilter, auditCategoryFilter, auditLowOnly]);

    // Paginate Audit List
    const totalAuditPages = Math.ceil(auditList.length / pageSize);
    const paginatedAuditList = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return auditList.slice(start, start + pageSize);
    }, [auditList, currentPage]);

    // Paginate Main List
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedFiltered = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage]);

    const pricingItems = items.filter(i => i.category === 'MANUFACTURED_PRICING');
    const stockItems = items.filter(i => i.type === 'FINAL_PRODUCT' && i.category !== 'MANUFACTURED_PRICING');
    const materialItems = items.filter(i => i.type === 'MATERIAL');

    // Low stock items with alert threshold
    const lowStockItems = useMemo(() => {
        return items.filter(i => {
            if (i.category === 'MANUFACTURED_PRICING') return false;
            const threshold = alertThresholds[i.id] ?? 10;
            return i.stock <= threshold;
        });
    }, [items, alertThresholds]);

    const visibleAlerts = lowStockItems.filter(i => !dismissedAlerts.has(i.id));

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>المخزن الذكي</h1>
                    <p>متابعة آنية للأرصدة الفعلية مع إمكانية التعديل والحذف والجرد التفصيلي</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {filter === 'AUDIT' && (
                        <button onClick={printInventoryAudit} className="btn-secondary" style={{ backgroundColor: '#ffa7261a', color: '#ffa726', borderColor: '#ffa72644' }}>
                            🖨 طباعة الجرد المعروض PDF
                        </button>
                    )}
                    <button onClick={() => setShowAdd(true)} className="btn-primary">
                        + إضافة صنف جديد
                    </button>
                </div>
            </header>

            {/* ── Smart Low Stock Alerts ── */}
            {visibleAlerts.length > 0 && showAlerts && (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(227,94,53,0.06)', border: '1px solid rgba(227,94,53,0.25)', borderRadius: '14px', padding: '1.2rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                            <div>
                                <h4 style={{ margin: 0, color: '#E35E35', fontSize: '0.95rem' }}>تنبيه مخزن — {visibleAlerts.length} صنف في حاجة للطلب</h4>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#888' }}>هذه الأصناف وصلت للحد الأدنى من الرصيد في المخزن</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAlerts(false)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '10px' }}>
                        {visibleAlerts.slice(0, 8).map(item => {
                            const threshold = alertThresholds[item.id] ?? 10;
                            const pct = Math.min(100, (item.stock / threshold) * 100);
                            return (
                                <div key={item.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(227,94,53,0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.category || item.type}</div>
                                        </div>
                                        <span style={{ padding: '2px 8px', background: item.stock === 0 ? '#E35E3533' : '#ffa72622', color: item.stock === 0 ? '#E35E35' : '#ffa726', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                                            {item.stock === 0 ? 'نفذ!' : `${item.stock.toFixed(0)} ${item.unit}`}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: item.stock === 0 ? '#E35E35' : '#ffa726', borderRadius: '2px', transition: 'width 0.5s' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <Link href={`/purchases?prefill=${encodeURIComponent(item.name)}`} style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(227,94,53,0.15)', border: '1px solid rgba(227,94,53,0.3)', color: '#E35E35', borderRadius: '8px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>
                                            🛒 اطلب الآن
                                        </Link>
                                        <button onClick={() => setDismissedAlerts(prev => new Set([...prev, item.id]))} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>تجاهل</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {visibleAlerts.length > 8 && (
                        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.82rem', color: '#888' }}>و {visibleAlerts.length - 8} أصناف أخرى • <button onClick={() => setFilter('AUDIT')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>عرض الجرد الكامل</button></div>
                    )}
                </div>
            )}

            {/* Re-show alerts button */}
            {!showAlerts && lowStockItems.length > 0 && (
                <button onClick={() => setShowAlerts(true)} style={{ marginBottom: '1rem', padding: '8px 16px', background: 'rgba(227,94,53,0.1)', border: '1px solid rgba(227,94,53,0.3)', color: '#E35E35', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem' }}>
                    ⚠️ عرض تنبيهات المخزن ({lowStockItems.length})
                </button>
            )}

            {/* ── Stats Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                {[
                    { label: 'إجمالي الأصناف', value: items.length, color: 'var(--primary-color)' },
                    { label: 'خامات ومستلزمات', value: materialItems.length, color: '#29b6f6' },
                    { label: 'منتجات بالمخزن', value: stockItems.length, color: '#66bb6a' },
                    { label: 'منتجات مصنعة (تسعير)', value: pricingItems.length, color: '#ab47bc' },
                ].map(c => (
                    <div key={c.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.color}22`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: '0.78rem', color: '#919398', marginTop: '4px' }}>{c.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Filter Tabs ── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: `1px solid ${t.color}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.86rem',
                            background: filter === t.key ? t.color : 'transparent', color: filter === t.key ? '#fff' : t.color
                        }}>
                        {t.label}
                    </button>
                ))}
                {filter !== 'AUDIT' && (
                    <select id="cat_filter" title="فلترة حسب القسم" className="input-glass" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
                        <option value="ALL">جميع الأقسام</option>
                        {uniqueMainCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
                {filter !== 'AUDIT' && (
                    <input id="item_search" type="text" title="بحث باسم الصنف" className="input-glass" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم الصنف.." style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }} />
                )}
                {filter !== 'AUDIT' && <span style={{ color: '#919398', fontSize: '0.83rem' }}>النتائج: {filtered.length}</span>}
            </div>

            {/* ── Pricing Tab Notice ── */}
            {filter === 'PRICING' && (
                <div style={{ background: 'rgba(171,71,188,0.08)', border: '1px solid rgba(171,71,188,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.4rem' }}>🏷</span>
                    <div>
                        <strong style={{ color: '#ab47bc' }}>تسعير المنتجات المصنعة</strong>
                        <p style={{ color: '#919398', fontSize: '0.84rem', margin: '2px 0 0' }}>
                            هذه المنتجات سُجِّلت من أوامر التصنيع بدون كمية محددة — تحتوي على التكلفة الإجمالية للوحدة لأغراض التسعير فقط.
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ AUDIT TAB — with filters ═══ */}
            {filter === 'AUDIT' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    {/* Header + stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0, color: '#ffa726' }}>📊 الجرد التفصيلي للمخزن</h3>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'الأصناف المعروضة', value: auditList.length, color: '#ffa726' },
                                { label: 'القيمة الإجمالية المعروضة', value: auditList.reduce((s, i) => s + (i.stock * (i.lastPurchasedPrice || 0)), 0).toFixed(0) + ` ${sym}`, color: '#66bb6a' },
                                { label: 'أصناف منخفضة ≤ 5', value: fullAuditList.filter(i => i.stock <= 5).length, color: '#E35E35' },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '0.76rem', color: '#919398' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Audit Filters Bar ── */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', padding: '12px 16px', background: 'rgba(255,167,38,0.06)', borderRadius: '10px', border: '1px solid rgba(255,167,38,0.2)' }}>
                        <span style={{ color: '#ffa726', fontWeight: 600, fontSize: '0.85rem' }}>🔍 فلترة الجرد:</span>
                        {[
                            { key: 'ALL', label: 'الكل' },
                            { key: 'MATERIAL', label: '🔩 خامات' },
                            { key: 'FINAL_PRODUCT', label: '✅ منتجات نهائية' },
                        ].map(opt => (
                            <button key={opt.key} onClick={() => setAuditTypeFilter(opt.key)}
                                style={{ padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: auditTypeFilter === opt.key ? 700 : 400, background: auditTypeFilter === opt.key ? '#ffa726' : 'transparent', color: auditTypeFilter === opt.key ? '#111' : '#ffa726', border: '1px solid #ffa72666' }}>
                                {opt.label}
                            </button>
                        ))}
                        <select id="audit_cat_filter" title="تصنيف الجرد" className="input-glass" value={auditCategoryFilter} onChange={e => setAuditCategoryFilter(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
                            <option value="ALL">جميع التصنيفات</option>
                            {uniqueCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input id="audit_search" type="text" title="بحث في الجرد" className="input-glass" value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
                            placeholder="بحث في الجرد.." style={{ flex: 1, minWidth: '150px', maxWidth: '240px' }} />
                        <label htmlFor="audit_low_only" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.83rem', color: '#E35E35', userSelect: 'none' }}>
                            <input id="audit_low_only" type="checkbox" checked={auditLowOnly} onChange={e => setAuditLowOnly(e.target.checked)} title="تصفية الأصناف المنخفضة"
                                style={{ width: '15px', height: '15px', accentColor: '#E35E35' }} />
                            ⚠️ المنخفضة فقط
                        </label>
                        <span style={{ color: '#919398', fontSize: '0.8rem', marginRight: 'auto' }}>
                            يُعرض {auditList.length} صنف من {fullAuditList.length}
                        </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                                    <th>اسم الصنف</th>
                                    <th style={{ textAlign: 'center' }}>النوع</th>
                                    <th style={{ textAlign: 'center' }}>التصنيف</th>
                                    <th style={{ textAlign: 'center' }}>الكمية</th>
                                    <th style={{ textAlign: 'center' }}>الوحدة</th>
                                    <th style={{ textAlign: 'center' }}>سعر الوحدة ({sym})</th>
                                    <th style={{ textAlign: 'center' }}>القيمة الإجمالية ({sym})</th>
                                    <th style={{ textAlign: 'center' }}>تعديل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAuditList.map((item, idx) => {
                                    const val = item.stock * (item.lastPurchasedPrice || 0);
                                    const low = item.stock <= 5;
                                    return (
                                        <tr key={item.id} style={{ background: low ? 'rgba(227,94,53,0.04)' : 'transparent' }}>
                                            <td style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>{idx + 1}</td>
                                            <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem', background: `${typeColor(item.type)}18`, color: typeColor(item.type) }}>
                                                    {typeLabel(item.type)}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#919398', fontSize: '0.82rem' }}>{item.category || '-'}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: low ? '#E35E35' : '#66bb6a' }}>
                                                {item.stock.toFixed(0)}{low && ' ⚠️'}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#919398' }}>{item.unit}</td>
                                            <td style={{ textAlign: 'center', color: 'var(--primary-color)' }}>
                                                {item.lastPurchasedPrice ? `${item.lastPurchasedPrice.toFixed(0)} ${sym}` : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: val > 0 ? '#29b6f6' : '#555' }}>
                                                {val > 0 ? `${val.toFixed(0)} ${sym}` : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => openEdit(item)}
                                                    className="btn-secondary btn-sm"
                                                    style={{ color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)' }}>
                                                    ✏️ تعديل
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {auditList.length === 0 && (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>لا توجد أصناف تطابق معايير الفلترة</td></tr>
                                )}
                                <tr style={{ background: 'rgba(255,167,38,0.12)' }}>
                                    <td colSpan={8} style={{ textAlign: 'center', fontWeight: 'bold', color: '#ffa726', fontSize: '0.95rem' }}>
                                        💰 إجمالي قيمة الأصناف المعروضة
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#66bb6a', fontSize: '1.05rem' }}>
                                        {auditList.reduce((s, i) => s + (i.stock * (i.lastPurchasedPrice || 0)), 0).toFixed(0)} {sym}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {totalAuditPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>السابق</button>
                                <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>صفحة {currentPage} من {totalAuditPages}</span>
                                <button disabled={currentPage === totalAuditPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary" style={{ opacity: currentPage === totalAuditPages ? 0.3 : 1 }}>التالي</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Main Table (non-AUDIT tabs) ── */}
            {filter !== 'AUDIT' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    {loading ? <p>جاري تحميل المخزن...</p> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table-glass">
                                <thead>
                                    <tr>
                                        <th>النوع</th>
                                        <th>التصنيف</th>
                                        <th>اسم الصنف</th>
                                        <th>الرصيد</th>
                                        <th>الوحدة</th>
                                        <th>آخر تكلفة / وحدة</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedFiltered.map(item => {
                                        const isPricing = item.category === 'MANUFACTURED_PRICING';
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    {isPricing ? (
                                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(171,71,188,0.15)', color: '#ab47bc' }}>
                                                            🏷 تسعير مصنّع
                                                        </span>
                                                    ) : (
                                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: `${typeColor(item.type)}18`, color: typeColor(item.type) }}>
                                                            {typeLabel(item.type)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ color: '#919398', fontSize: '0.83rem' }}>{item.category === 'MANUFACTURED_PRICING' ? 'تسعير مصنعة' : item.category || '-'}</td>
                                                <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                                                <td>
                                                    {isPricing ? (
                                                        <span style={{ color: '#ab47bc', fontSize: '0.83rem' }}>للتسعير فقط</span>
                                                    ) : (
                                                        <span style={{
                                                            padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold',
                                                            background: item.stock <= 5 ? 'rgba(227,94,53,0.15)' : 'rgba(102,187,106,0.1)',
                                                            color: item.stock <= 5 ? '#E35E35' : '#66bb6a'
                                                        }}>
                                                            {item.stock.toFixed(0)}{item.stock <= 5 && ' ⚠️'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ color: '#919398' }}>{item.unit}</td>
                                                <td style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                                    {item.lastPurchasedPrice
                                                        ? <>{item.lastPurchasedPrice.toFixed(0)} <span style={{ fontSize: '0.78rem', color: '#919398' }}>{sym}</span></>
                                                        : <span style={{ color: '#555' }}>-</span>}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => openEdit(item)}
                                                            className="btn-secondary btn-sm"
                                                            style={{ color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)' }}>
                                                            ✏️ تعديل
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id, item.name)}
                                                            className="btn-danger btn-sm">
                                                            🗑 حذف
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#555' }}>
                                                {filter === 'PRICING'
                                                    ? '📭 لا توجد منتجات مصنعة مسعّرة بعد — أضف شغلانة بدون كمية محددة من أوامر التصنيع'
                                                    : 'لا توجد أصناف مطابقة'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>السابق</button>
                                    <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>صفحة {currentPage} من {totalPages}</span>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>التالي</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ EDIT MODAL ═══ */}
            {editItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#29b6f6' }}>✏️ تعديل تفصيلي: {editItem.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><label htmlFor="edit_name">اسم الصنف</label><input id="edit_name" type="text" className="input-glass" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} title="اسم الصنف" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label htmlFor="edit_stock">الرصيد الحالي</label>
                                    <input id="edit_stock" type="number" step="any" className="input-glass" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))} title="الرصيد الحالي" />
                                </div>
                                <div>
                                    <label htmlFor="edit_unit">وحدة القياس</label>
                                    <input id="edit_unit" type="text" className="input-glass" value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} title="وحدة القياس" />
                                </div>
                            </div>
                            <div><label htmlFor="edit_category">التصنيف</label><input id="edit_category" type="text" className="input-glass" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} title="التصنيف" /></div>
                            <div>
                                <label htmlFor="edit_type">النوع</label>
                                <select id="edit_type" className="input-glass" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} title="النوع">
                                    <option value="MATERIAL">خامة / مستلزم تصنيع</option>
                                    <option value="FINAL_PRODUCT">منتج نهائي</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditItem(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                                {saving ? 'جاري الحفظ...' : '💾 حفظ التعديل'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ ADD MODAL ═══ */}
            {showAdd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#66bb6a' }}>+ إضافة صنف جديد للمخزن</h3>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label htmlFor="add_type">النوع</label>
                                <select id="add_type" className="input-glass" value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))} title="النوع">
                                    <option value="MATERIAL">خامة / مستلزم تصنيع</option>
                                    <option value="FINAL_PRODUCT">منتج نهائي</option>
                                </select>
                            </div>
                            <div><label htmlFor="add_name">اسم الصنف</label><input id="add_name" type="text" className="input-glass" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required title="اسم الصنف" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><label htmlFor="add_stock">الكمية الابتدائية</label><input id="add_stock" type="number" step="any" min="0" className="input-glass" value={addForm.stock} onChange={e => setAddForm(f => ({ ...f, stock: e.target.value }))} required title="الكمية الابتدائية" /></div>
                                <div><label htmlFor="add_unit">وحدة القياس</label><input id="add_unit" type="text" className="input-glass" value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))} required title="وحدة القياس" /></div>
                            </div>
                            <div><label htmlFor="add_category">التصنيف (اختياري)</label><input id="add_category" type="text" className="input-glass" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} title="التصنيف" placeholder="حديد، ستانلس، أخشاب.." /></div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>✅ إضافة للمخزن</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
