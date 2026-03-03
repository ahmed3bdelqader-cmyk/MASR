'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchReportTemplate, generatePrintHtml } from '@/lib/reportTemplate';

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
    const [mounted, setMounted] = useState(false);
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5);

    // ── Categories & Workshop Items config ───────────────────────────────────
    const DEFAULT_INVENTORY_CATS = [
        { key: 'FASTENERS', label: '🔩 مسامير ولحامات', color: '#a1887f' },
        { key: 'PAINT', label: '🎨 دهانات وتشطيب', color: '#ce93d8' },
        { key: 'LOCKS', label: '🔐 أقفال ومفصلات', color: '#80cbc4' },
        { key: 'GLASS', label: '🗻 زجاج ولوحات', color: '#81d4fa' },
        { key: 'CABLES', label: '📱 كابلات وأسلاك', color: '#ffcc80' },
        { key: 'ACCESSORIES', label: '✨ إكسيسوارات', color: '#f48fb1' },
        { key: 'OTHER', label: '📦 مستلزمات عامة', color: '#aaa' }
    ];
    const [showCatMgr, setShowCatMgr] = useState(false);
    const [inventoryCategories, setInventoryCategories] = useState(DEFAULT_INVENTORY_CATS);
    const [catForm, setCatForm] = useState({ label: '', color: '#ffcc80' });
    const [wsForm, setWsForm] = useState({ subcategory: 'FASTENERS', name: '', unit: 'قطعة', defaultPrice: '' });

    const handleAddCategory = () => {
        if (!catForm.label.trim()) return;
        const newCats = [...inventoryCategories, { key: 'CAT_' + Date.now(), label: catForm.label.trim(), color: catForm.color }];
        setInventoryCategories(newCats);
        localStorage.setItem('erp_inventory_categories', JSON.stringify(newCats));
        setCatForm({ label: '', color: '#ffcc80' });
    };
    const handleDeleteCategory = (key: string) => {
        if (!confirm('سيتم حذف القسم فقط من القائمة ولن تُحذف الأصناف المرتبطة به. هل أنت متأكد؟')) return;
        const newCats = inventoryCategories.filter(c => c.key !== key);
        setInventoryCategories(newCats);
        localStorage.setItem('erp_inventory_categories', JSON.stringify(newCats));
    };
    const handleEditCategoryName = (key: string) => {
        const newName = prompt('اكتب الاسم الجديد للقسم:');
        if (newName && newName.trim()) {
            const newCats = inventoryCategories.map(c => c.key === key ? { ...c, label: newName.trim() } : c);
            setInventoryCategories(newCats);
            localStorage.setItem('erp_inventory_categories', JSON.stringify(newCats));
        }
    };
    const wsAddItem = async () => {
        if (!wsForm.name.trim()) return;
        const subLabel = inventoryCategories.find(c => c.key === wsForm.subcategory)?.label || 'مستلزمات عامة';
        setSaving(true);
        const res = await fetch('/api/inventory', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'MATERIAL', category: subLabel, name: wsForm.name.trim(), stock: '0', unit: wsForm.unit })
        });
        if (res.ok) {
            setWsForm(f => ({ ...f, name: '', defaultPrice: '' }));
            fetchInventory();
        } else {
            alert('حدث خطأ أثناء إضافة الصنف');
        }
        setSaving(false);
    };

    // ── Audit filter state ─────────────────────────────────────────────────────
    const [auditSearch, setAuditSearch] = useState('');
    const [auditTypeFilter, setAuditTypeFilter] = useState('ALL'); // ALL | MATERIAL | FINAL_PRODUCT
    const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL'); // ALL or specific Category
    const [auditLowOnly, setAuditLowOnly] = useState(false);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch { setItems([]); }
        setLoading(false);
    };
    useEffect(() => {
        setMounted(true);
        fetchInventory();
        const saved = localStorage.getItem('erp_inventory_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
        try { const c = localStorage.getItem('erp_inventory_categories'); if (c) { const parsed = JSON.parse(c); if (parsed.length) setInventoryCategories(parsed); } } catch { }
    }, []);

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

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_inventory_pageSize', val);
        setCurrentPage(1);
    };

    const exportToCSV = () => {
        const headers = ['اسم الصنف', 'النوع', 'التصنيف', 'الكمية', 'الوحدة', 'آخر سعر شراء'];
        const rows = items.map(i => [
            i.name,
            i.type === 'FINAL_PRODUCT' ? 'منتج نهائي' : 'خامة/مستلزم',
            i.category || '',
            i.stock,
            i.unit,
            i.lastPurchasedPrice || 0
        ]);
        let csvContent = "\uFEFF"; // UTF-8 BOM
        csvContent += headers.join(",") + "\n";
        rows.forEach(row => {
            const escapedRow = row.map(val => {
                const s = String(val).replace(/"/g, '""');
                return `"${s}"`;
            });
            csvContent += escapedRow.join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `مخزون_ستاند_مصر_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/);
                if (lines.length < 2) return;
                const importItems = [];
                const parseCSVLine = (line: string) => {
                    const result = [];
                    let cur = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') inQuotes = !inQuotes;
                        else if (char === ',' && !inQuotes) {
                            result.push(cur.trim());
                            cur = '';
                        } else cur += char;
                    }
                    result.push(cur.trim());
                    return result;
                };
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const cells = parseCSVLine(line);
                    if (cells.length >= 5 && cells[0]) {
                        importItems.push({
                            name: cells[0],
                            type: cells[1] === 'منتج نهائي' ? 'FINAL_PRODUCT' : 'MATERIAL',
                            category: cells[2] || '',
                            stock: parseFloat(cells[3]) || 0,
                            unit: cells[4] || 'قطعة',
                            lastPurchasedPrice: parseFloat(cells[5]) || 0
                        });
                    }
                }
                if (importItems.length > 0) {
                    if (!confirm(`سيتم إضافة ${importItems.length} صنف جديد إلى المخزن. هل تود الاستمرار؟`)) return;
                    setLoading(true);
                    const res = await fetch('/api/inventory', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(importItems)
                    });
                    if (res.ok) {
                        alert(`✅ تم استيراد ${importItems.length} صنف بنجاح`);
                        fetchInventory();
                    } else {
                        const err = await res.json();
                        alert(`❌ فشل الاستيراد: ${err.error || 'خطأ غير معروف'}`);
                    }
                }
            } catch (err) {
                alert('❌ حدث خطأ في معالجة الملف، تأكد من أن الملف بصيغة CSV صحيحة');
            } finally {
                setLoading(false);
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file, "UTF-8");
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
        const fromItems = fullAuditList.map(i => i.category).filter(c => c && c.trim() !== '') as string[];
        const fromDefs = inventoryCategories.map(c => c.label);
        return Array.from(new Set([...fromItems, ...fromDefs]));
    }, [fullAuditList, inventoryCategories]);

    const handlePrintInventoryReport = async () => {
        if (auditList.length === 0) return;
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';

        let filterText = auditTypeFilter === 'MATERIAL' ? 'خامات ومستلزمات' : auditTypeFilter === 'FINAL_PRODUCT' ? 'منتجات نهائية' : 'الكل';
        if (auditCategoryFilter !== 'ALL') filterText += ` - ${auditCategoryFilter}`;
        if (auditSearch) filterText += ` | بحث: "${auditSearch}"`;
        if (auditLowOnly) filterText += ' | منخفضة فقط';

        const metaInfo = [
            ['تاريخ الجرد', new Date().toLocaleDateString('ar-EG')],
            ['إجمالي الأصناف', String(auditList.length)],
            ['الفلتر', filterText]
        ];

        const totalValue = auditList.reduce((s, i) => s + (i.stock * (i.lastPurchasedPrice || 0)), 0);

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                ${metaInfo.map(([label, value]) => `
                    <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">${label}</div>
                        <div style="font-size: 1rem; font-weight: 700; color: #1e293b;">${value}</div>
                    </div>
                `).join('')}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>رقم</th>
                        <th style="text-align: right;">اسم الصنف</th>
                        <th>النوع</th>
                        <th>التصنيف</th>
                        <th>الكمية</th>
                        <th>الوحدة</th>
                        <th>سعر الوحدة</th>
                        <th>القيمة</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditList.map((item, idx) => {
            const val = item.stock * (item.lastPurchasedPrice || 0);
            return `
                        <tr>
                            <td style="text-align: center;">${idx + 1}</td>
                            <td style="text-align: right;">${item.name}</td>
                            <td style="text-align: center;">${typeLabel(item.type)}</td>
                            <td style="text-align: center;">${item.category || '-'}</td>
                            <td style="text-align: center; ${item.stock <= 5 ? 'color: #ef4444; font-weight: bold;' : ''}">${item.stock.toFixed(0)}</td>
                            <td style="text-align: center;">${item.unit}</td>
                            <td style="text-align: center;">${item.lastPurchasedPrice ? item.lastPurchasedPrice.toFixed(0) : '-'}</td>
                            <td style="text-align: center;">${val > 0 ? val.toFixed(0) : '-'}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; text-align: center;">
                <div style="font-size: 0.9rem; color: #166534; font-weight: 700;">إجمالي قيمة الأصناف المعروضة</div>
                <div style="font-size: 1.4rem; font-weight: 900; color: #15803d; margin-top: 5px;">${totalValue.toLocaleString('ar-EG')} ${symVal}</div>
            </div>
        `;

        const html = generatePrintHtml(bodyHtml, 'تقرير الجرد التفصيلي', config);
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
        // Collect categories from actual items
        let relevant = items;
        if (filter === 'MATERIAL') relevant = items.filter(i => i.type === 'MATERIAL');
        if (filter === 'FINAL') relevant = items.filter(i => i.type === 'FINAL_PRODUCT' && i.category !== 'MANUFACTURED_PRICING');
        const fromItems = relevant.map(i => i.category).filter(c => c && c.trim() !== '' && c !== 'MANUFACTURED_PRICING') as string[];
        // Add predefined inventory category labels
        const fromDefs = inventoryCategories.map(c => c.label);
        return Array.from(new Set([...fromItems, ...fromDefs]));
    }, [items, filter, inventoryCategories]);

    // Reset pagination
    useEffect(() => { setCurrentPage(1); }, [filter, search, categoryFilter, auditSearch, auditTypeFilter, auditCategoryFilter, auditLowOnly]);

    const totalAuditPages = pageSize === 'ALL' ? 1 : Math.ceil(auditList.length / pageSize);
    const paginatedAuditList = useMemo(() => {
        if (pageSize === 'ALL') return auditList;
        const start = (currentPage - 1) * pageSize;
        return auditList.slice(start, start + pageSize);
    }, [auditList, currentPage, pageSize]);

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filtered.length / pageSize);
    const paginatedFiltered = useMemo(() => {
        if (pageSize === 'ALL') return filtered;
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const pricingItems = items.filter(i => i.category === 'MANUFACTURED_PRICING');
    const stockItems = items.filter(i => i.type === 'FINAL_PRODUCT' && i.category !== 'MANUFACTURED_PRICING');
    const materialItems = items.filter(i => i.type === 'MATERIAL');

    const lowStockItems = useMemo(() => items.filter(i => {
        if (i.category === 'MANUFACTURED_PRICING') return false;
        const threshold = alertThresholds[i.id] ?? 10;
        return i.stock <= threshold;
    }), [items, alertThresholds]);

    const visibleAlerts = lowStockItems.filter(i => !dismissedAlerts.has(i.id));

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">📦 المخزن الذكي</h1>
                    <p className="page-subtitle">متابعة آنية للأرصدة الفعلية مع إمكانية التعديل والحذف والجرد التفصيلي</p>
                </div>
                <div className="header-actions">
                    <button onClick={exportToCSV} className="btn-modern btn-secondary">📥 تصدير</button>
                    <label className="btn-modern btn-secondary cursor-pointer">
                        📤 استيراد
                        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden-input" />
                    </label>
                    <button onClick={() => setShowCatMgr(true)} className="btn-modern btn-primary btn-brown">🔧 إدارة أقسام الورشة</button>
                    <button onClick={() => setShowAdd(true)} className="btn-primary">+ إضافة صنف جديد</button>
                </div>
            </header>

            {/* Alerts Section */}
            {visibleAlerts.length > 0 && showAlerts && (
                <div className="alerts-container">
                    <div className="alerts-header">
                        <div className="alerts-title-group">
                            <span className="alert-icon">⚠️</span>
                            <div>
                                <h4 className="alert-count-title">تنبيه مخزن — {visibleAlerts.length} صنف في حاجة للطلب</h4>
                                <p className="alert-subtitle">هذه الأصناف وصلت للحد الأدنى من الرصيد</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAlerts(false)} className="alert-close-btn">✕</button>
                    </div>
                    <div className="alerts-grid">
                        {visibleAlerts.slice(0, 8).map(item => {
                            const threshold = alertThresholds[item.id] ?? 10;
                            const pct = Math.min(100, (item.stock / threshold) * 100);
                            return (
                                <div key={item.id} className="alert-card">
                                    <div className="alert-card-info">
                                        <div>
                                            <div className="alert-item-name">{item.name}</div>
                                            <div className="alert-item-category">{item.category || item.type}</div>
                                        </div>
                                        <span className={`alert-badge ${item.stock === 0 ? 'out-of-stock' : 'low-stock'}`}>
                                            {item.stock === 0 ? 'نفذ!' : `${item.stock.toFixed(0)} ${item.unit}`}
                                        </span>
                                    </div>
                                    <div className="alert-progress-bg">
                                        <div className={`alert-progress-fill ${item.stock === 0 ? 'empty' : 'warning'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="alert-actions-btns">
                                        <Link href={`/purchases?prefill=${encodeURIComponent(item.name)}`} className="order-now-btn">🛒 اطلب</Link>
                                        <button onClick={() => setDismissedAlerts(prev => new Set([...prev, item.id]))} className="dismiss-alert-btn">تجاهل</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!showAlerts && lowStockItems.length > 0 && (
                <button onClick={() => setShowAlerts(true)} className="reshow-alerts-btn">
                    ⚠️ عرض تنبيهات المخزن ({lowStockItems.length})
                </button>
            )}

            {/* Stats Cards */}
            <div className="stats-cards-grid">
                <div className="inventory-stat-card" style={{ border: '1px solid #29b6f622' }}>
                    <div className="stat-val" style={{ color: '#29b6f6' }}>{items.length}</div>
                    <div className="stat-label">إجمالي الأصناف</div>
                </div>
                <div className="inventory-stat-card" style={{ border: '1px solid #29b6f622' }}>
                    <div className="stat-val" style={{ color: '#29b6f6' }}>{materialItems.length}</div>
                    <div className="stat-label">خامات ومستلزمات</div>
                </div>
                <div className="inventory-stat-card" style={{ border: '1px solid #66bb6a22' }}>
                    <div className="stat-val" style={{ color: '#66bb6a' }}>{stockItems.length}</div>
                    <div className="stat-label">منتجات نهائية</div>
                </div>
                <div className="inventory-stat-card" style={{ border: '1px solid #ab47bc22' }}>
                    <div className="stat-val" style={{ color: '#ab47bc' }}>{pricingItems.length}</div>
                    <div className="stat-label">منتجات (تسعير)</div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="filter-tabs-bar">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        className={`btn-modern filter-tab-btn ${filter === t.key ? 'active' : ''}`}
                        style={{
                            borderColor: t.color,
                            background: filter === t.key ? t.color : 'transparent',
                            color: filter === t.key ? '#fff' : t.color
                        }}>
                        {t.label}
                    </button>
                ))}
                {filter !== 'AUDIT' && (
                    <>
                        {/* Category Pills Filter */}
                        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '6px', fontWeight: 700 }}>🗂 القسم:</span>
                            <button
                                onClick={() => setCategoryFilter('ALL')}
                                style={{
                                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                    border: `1px solid ${categoryFilter === 'ALL' ? 'var(--primary-color)' : 'rgba(255,255,255,0.12)'}`,
                                    background: categoryFilter === 'ALL' ? 'var(--primary-color)' : 'transparent',
                                    color: categoryFilter === 'ALL' ? '#fff' : 'rgba(255,255,255,0.7)'
                                }}
                            >الكل</button>
                            {uniqueMainCategories.map((c: string) => {
                                const def = inventoryCategories.find(ic => ic.label === c);
                                const color = def?.color || '#919398';
                                const isActive = categoryFilter === c;
                                return (
                                    <button key={c} onClick={() => setCategoryFilter(isActive ? 'ALL' : c)}
                                        style={{
                                            padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                            border: `1px solid ${isActive ? color : color + '55'}`,
                                            background: isActive ? color : color + '15',
                                            color: isActive ? '#fff' : color
                                        }}
                                    >{c}</button>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                            <input type="text" className="input-glass item-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم الصنف.." />
                            <span className="results-count">النتائج: {filtered.length}</span>
                        </div>
                    </>

                )}
            </div>

            {/* Main Content Area */}
            {filter === 'AUDIT' ? (
                <div className="glass-panel audit-panel">
                    <div className="audit-header-row">
                        <h3 className="text-orange">📊 الجرد التفصيلي للمخزن</h3>
                        <div className="audit-filters-bar">
                            <select className="input-glass audit-cat-select" value={auditCategoryFilter} onChange={e => setAuditCategoryFilter(e.target.value)}>
                                <option value="ALL">جميع التصنيفات</option>
                                {uniqueCategories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" className="input-glass audit-search-input" value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="بحث في الجرد.." />
                            <button onClick={handlePrintInventoryReport} className="btn-modern btn-primary">🖨️ طباعة التقرير</button>
                        </div>
                    </div>

                    <div className="smart-table-container table-wrapper">
                        <table className="smart-table table-glass high-density responsive-cards">
                            <thead>
                                <tr>
                                    <th className="hide-on-tablet w-10 text-center">#</th>
                                    <th>اسم الصنف</th>
                                    <th className="hide-on-tablet text-center">النوع</th>
                                    <th className="hide-on-tablet text-center">التصنيف</th>
                                    <th className="text-center">الكمية</th>
                                    <th className="text-center">الوحدة</th>
                                    <th className="text-center">سعر الوحدة</th>
                                    <th className="hide-on-tablet text-center">القيمة</th>
                                    <th className="text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAuditList.map((item, idx) => {
                                    const val = item.stock * (item.lastPurchasedPrice || 0);
                                    const low = item.stock <= 5;
                                    return (
                                        <tr key={item.id} className={low ? 'low-stock-row' : ''}>
                                            <td className="hide-on-tablet text-center text-muted" data-label="#">{idx + 1}</td>
                                            <td data-label="اسم الصنف">
                                                <div className="mobile-card-title">{item.name}</div>
                                                <div className="text-muted text-sm mt-1 hide-on-pc" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span>{item.category || '-'}</span>
                                                    <span className={`sh-badge ${item.type === 'FINAL_PRODUCT' ? 'paid' : 'partial'}`} style={{ whiteSpace: 'nowrap', padding: '3px 8px', fontSize: '0.75rem' }}>
                                                        {typeLabel(item.type)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hide-on-tablet text-center" data-label="النوع">
                                                <span className={`sh-badge ${item.type === 'FINAL_PRODUCT' ? 'paid' : 'partial'}`} style={{ whiteSpace: 'nowrap' }}>
                                                    {typeLabel(item.type)}
                                                </span>
                                            </td>
                                            <td className="hide-on-tablet text-center text-muted text-sm" data-label="التصنيف">{item.category || '-'}</td>
                                            <td className="text-center" data-label="الكمية">
                                                <div className={`mobile-card-balance ${low ? 'text-danger' : 'text-success'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    {item.stock.toFixed(0)}{low && ' ⚠️'}
                                                </div>
                                            </td>
                                            <td className="text-center text-muted" data-label="الوحدة">{item.unit}</td>
                                            <td className="text-center text-primary" data-label="سعر الوحدة">{item.lastPurchasedPrice ? `${item.lastPurchasedPrice.toFixed(0)} ${sym}` : '-'}</td>
                                            <td className="hide-on-tablet text-center font-bold" data-label="القيمة">{val > 0 ? `${val.toFixed(0)} ${sym}` : '-'}</td>
                                            <td className="text-center" data-label="إجراء">
                                                <button onClick={() => openEdit(item)} className="btn-modern btn-secondary btn-sm" title="تعديل">✏️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-panel main-inventory-panel">
                    {loading ? <p className="loading-txt">جاري تحميل المخزن...</p> : (
                        <div className="smart-table-container table-wrapper">
                            <table className="smart-table table-glass high-density responsive-cards">
                                <thead>
                                    <tr>
                                        <th>اسم الصنف</th>
                                        <th className="hide-on-tablet">التصنيف</th>
                                        <th className="text-center">الكمية</th>
                                        <th className="text-center">الوحدة</th>
                                        <th className="hide-on-tablet text-center">آخر سعر شراء</th>
                                        <th className="text-left">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedFiltered.map(item => {
                                        const isPricing = item.category === 'MANUFACTURED_PRICING';
                                        return (
                                            <tr key={item.id}>
                                                <td data-label="اسم الصنف">
                                                    <div className="mobile-card-title">{item.name}</div>
                                                    <div className="text-muted text-sm mt-1 hide-on-pc" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span>{isPricing ? 'تسعير مصنعة' : (item.category || '-')}</span>
                                                        <span className={`sh-badge ${item.type === 'FINAL_PRODUCT' ? 'paid' : 'partial'}`} style={{ whiteSpace: 'nowrap', padding: '3px 8px', fontSize: '0.75rem' }}>
                                                            {typeLabel(item.type)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="hide-on-tablet text-muted text-sm" data-label="التصنيف">
                                                    {isPricing ? 'تسعير مصنعة' : (item.category || '-')}
                                                </td>
                                                <td className="text-center" data-label="الكمية">
                                                    {isPricing ? (
                                                        <span className="text-primary font-bold text-sm">للتسعير</span>
                                                    ) : (
                                                        <div className={`mobile-card-balance ${item.stock <= 5 ? 'text-danger' : 'text-success'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                            {item.stock.toFixed(0)}{item.stock <= 5 && ' ⚠️'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-center text-muted" data-label="الوحدة">{item.unit}</td>
                                                <td className="hide-on-tablet text-center text-primary font-bold" data-label="آخر سعر شراء">
                                                    {item.lastPurchasedPrice ? `${item.lastPurchasedPrice.toFixed(0)} ${sym}` : '-'}
                                                </td>
                                                <td data-label="الإجراءات" className="text-left">
                                                    <div className="action-bar-cell mobile-card-actions">
                                                        <button onClick={() => openEdit(item)} className="btn-modern btn-secondary btn-sm" title="تعديل">تعديل</button>
                                                        <button onClick={() => handleDelete(item.id, item.name)} className="btn-modern btn-danger btn-sm" title="حذف">حذف</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center p-4 text-muted">
                                                {filter === 'PRICING' ? '📭 لا توجد منتجات مصنعة مسعّرة بعد — أضف من أوامر التصنيع' : 'لا توجد أصناف مطابقة'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            <div className="pagination-wrapper">
                <div className="page-size-selector">
                    <span className="ps-label">عدد النتائج:</span>
                    <select value={pageSize} onChange={(e) => handlePageSizeChange(e.target.value)} className="ps-dropdown">
                        <option value={5}>5</option>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value="ALL">الكل</option>
                    </select>
                </div>
                <div className="page-nav">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary">&rarr; السابق</button>
                    <div className="page-indicator">{currentPage} / {filter === 'AUDIT' ? totalAuditPages : totalPages}</div>
                    <button disabled={currentPage === (filter === 'AUDIT' ? totalAuditPages : totalPages)} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary">التالي &larr;</button>
                </div>
            </div>

            {/* Modals */}
            {editItem && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                        <h3 className="text-primary">✏️ تعديل: {editItem.name}</h3>
                        <div className="modal-form-grid">
                            <div className="form-group">
                                <label>اسم الصنف</label>
                                <input type="text" className="input-glass" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-row-grid">
                                <div className="form-group">
                                    <label>الرصيد</label>
                                    <input type="number" className="input-glass" value={editForm.stock} onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>الوحدة</label>
                                    <input type="text" className="input-glass" value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setEditItem(null)} className="btn-modern btn-outline">إلغاء</button>
                            <button onClick={handleSaveEdit} disabled={saving} className="btn-modern btn-primary">{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showAdd && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                        <h3 className="text-success">+ إضافة صنف</h3>
                        <form onSubmit={handleAdd} className="modal-form-grid">
                            <div className="form-group">
                                <label>الاسم</label>
                                <input type="text" className="input-glass" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-row-grid">
                                <div className="form-group">
                                    <label>الكمية</label>
                                    <input type="number" className="input-glass" value={addForm.stock} onChange={e => setAddForm(f => ({ ...f, stock: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>الوحدة</label>
                                    <input type="text" className="input-glass" value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-modern btn-outline">إلغاء</button>
                                <button type="submit" className="btn-modern btn-primary">إضافة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCatMgr && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: '760px' }}>
                        <div className="modal-header">
                            <h3 className="text-orange">🔧 إدارة الأقسام</h3>
                            <button onClick={() => setShowCatMgr(false)} className="close-btn">✕</button>
                        </div>
                        <div className="workshop-form-box">
                            <div className="ws-form-inline">
                                <input type="text" className="input-glass ws-flex" value={wsForm.name} onChange={e => setWsForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الصنف.." />
                                <button onClick={wsAddItem} className="btn-modern btn-primary btn-brown">إضافة</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .cursor-pointer { cursor: pointer; }
                .hidden-input { display: none; }
                .btn-brown { background: #8d6e63 !important; }
                .text-orange { color: #ffa726; }
                .text-success { color: #66bb6a; }
                .text-primary { color: #29b6f6; }
                .full-width { width: 100%; }
                
                .alerts-container { margin-bottom: 1.5rem; background: rgba(227,94,53,0.06); border: 1px solid rgba(227,94,53,0.25); border-radius: 14px; padding: 1.2rem; }
                .alerts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .alerts-title-group { display: flex; align-items: center; gap: 10px; }
                .alert-icon { font-size: 1.3rem; }
                .alert-count-title { margin: 0; color: #E35E35; font-size: 0.95rem; }
                .alert-subtitle { margin: 0; font-size: 0.78rem; color: #888; }
                .alert-close-btn { background: transparent; border: none; color: #888; font-size: 1.2rem; cursor: pointer; }
                .alerts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
                .alert-card { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 12px; border: 1px solid rgba(227,94,53,0.15); }
                .alert-card-info { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .alert-item-name { font-weight: bold; color: #fff; font-size: 0.88rem; }
                .alert-item-category { font-size: 0.75rem; color: #888; }
                .alert-badge { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: bold; }
                .alert-badge.low-stock { background: rgba(255,167,38,0.2); color: #ffa726; }
                .alert-badge.out-of-stock { background: rgba(227,94,53,0.2); color: #E35E35; }
                .alert-progress-bg { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 8px; }
                .alert-progress-fill { height: 100%; border-radius: 2px; background: #ffa726; }
                .alert-progress-fill.empty { background: #E35E35; }
                .alert-actions-btns { display: flex; gap: 6px; }
                .order-now-btn { flex: 1; text-align: center; padding: 4px; background: rgba(227,94,53,0.15); border: 1px solid rgba(227,94,53,0.3); color: #E35E35; border-radius: 6px; text-decoration: none; font-size: 0.75rem; }
                .dismiss-alert-btn { padding: 4px 8px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
                .reshow-alerts-btn { margin-bottom: 1rem; padding: 8px 16px; background: rgba(227,94,53,0.1); border: 1px solid rgba(227,94,53,0.3); color: #E35E35; border-radius: 8px; cursor: pointer; }

                .stats-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 1.5rem; }
                .inventory-stat-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px; text-align: center; }
                .stat-val { font-size: 1.8rem; font-weight: bold; }
                .stat-label { font-size: 0.8rem; color: #888; margin-top: 4px; }

                .filter-tabs-bar { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
                .filter-tab-btn { padding: 8px 16px; border-radius: 10px; font-weight: bold; font-size: 0.9rem; border: 1px solid transparent; }
                .cat-filter-select { padding: 8px; min-width: 150px; }
                .item-search-input { flex: 1; min-width: 200px; max-width: 300px; }
                .results-count { font-size: 0.85rem; color: #888; }

                .main-inventory-panel, .audit-panel { padding: 1.5rem; }
                .audit-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .audit-filters-bar { display: flex; gap: 10px; align-items: center; }
                .low-stock-row { background: rgba(227,94,53,0.05) !important; }

                .pagination-wrapper { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid var(--border-color); }
                .page-size-selector { display: flex; gap: 10px; align-items: center; }
                .ps-label { font-size: 0.85rem; color: #888; }
                .ps-dropdown { background: transparent; color: var(--primary-color); border: none; font-weight: bold; cursor: pointer; }
                .page-nav { display: flex; gap: 15px; align-items: center; }
                .page-indicator { padding: 6px 12px; background: rgba(227,94,53,0.1); border-radius: 8px; color: var(--primary-color); font-weight: bold; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .modal-content { width: 100%; border-radius: 16px; border: 1px solid var(--border-color); padding: 2rem; background: #1a1c22; }
                .modal-form-grid { display: flex; flex-direction: column; gap: 15px; margin-top: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 5px; }
                .form-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 2rem; }
                .btn-outline { background: transparent; border: 1px solid #444; color: #888; }
                .close-btn { background: none; border: none; color: #ff5252; font-size: 1.5rem; cursor: pointer; }
                .workshop-form-box { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid #333; }
                .ws-form-inline { display: flex; gap: 10px; }
                .ws-flex { flex: 1; }
                @media (max-width: 768px) {
                    .audit-header-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                    }
                    .audit-filters-bar {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                    }
                    .filter-tabs-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .filter-tabs-bar .btn-modern {
                        width: 100%;
                    }
                    .pagination-wrapper {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                    }
                    .page-size-selector, .page-nav {
                        justify-content: space-between;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
