'use client';
import React, { useState, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────────────────────
type AnyItem = {
    _id: string; // unique key for form
    mainCategoryId: string;
    formType: 'METAL_FORM' | 'STANDARD_FORM' | 'PAINT_FORM' | ''; // determines shape

    // Shared / other
    name: string;
    quantity: number;
    unitPrice: number;
    quantityType: 'KG' | 'PIECE' | 'LITER' | 'METER';
    piecesPerKg: number;

    // Metal specific
    subtype?: 'STAINLESS' | 'IRON';
    shape?: string;
    sectionSize?: string;
    thickness?: string;
    lengthPerPiece?: number;

    // Workshop specific
    subcategory?: string;
};

// ─── Workshop Subcategories ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_WS_SUBCATS: { key: string; label: string; suggestions: string[]; color: string }[] = [
    { key: 'FASTENERS', label: '🔩 مسامير ولحامات', color: '#a1887f', suggestions: ['مسمار خشب', 'مسمار معدني', 'براغي', 'صامولة', 'غراء لحام', 'فحم لحام', 'سلك لحام', 'كيماوي لحام'] },
    { key: 'PAINT', label: '🎨 دهانات وتشطيب', color: '#ce93d8', suggestions: ['دهان بودرة', 'دهان أكريليك', 'برايمر', 'منظف معدن', 'ثينر دهان', 'لاقي بودرة', 'أستاتيك كهربائي', 'حبوب بودرة'] },
    { key: 'LOCKS', label: '🔐 أقفال ومفصلات', color: '#80cbc4', suggestions: ['قفل ؤبواب', 'قفل شباك', 'سحابة درج', 'مفصلة خزانة', 'مفصلة سرير', 'بوابة سحب', 'مقبض باب', 'عجلة كاستر'] },
    { key: 'GLASS', label: '🗻 زجاج ولوحات', color: '#81d4fa', suggestions: ['زجاج عادي 4مم', 'زجاج عادي 6مم', 'زجاج مرآة', 'زجاج معجون', 'زجاج frosted', 'لوح أكريليك'] },
    { key: 'CABLES', label: '📱 كابلات وأسلاك', color: '#ffcc80', suggestions: ['سلك جسر ستانلس', 'سلك شبكة جديدة', 'سثة بلاستيك', 'سلك تجميع مطلي', 'شريط حديد', 'سلك توثيق'] },
    { key: 'ACCESSORIES', label: '✨ إكسيسوارات', color: '#f48fb1', suggestions: ['مسامير زينية', 'عروة درج', 'رجل باب', 'ذراع فتح', 'غطاء فتحة', 'مشبك ذهبي', 'زخرفة واجهة'] },
    { key: 'OTHER_WS', label: '📦 صنف آخر', color: '#aaa', suggestions: [] },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const METAL_SHAPES = ['علب مربعة', 'مواسير بوصة', 'مواسير مستطيلة', 'قطاع زاوية', 'قطاع U', 'قطاع T', 'صاج مقطوع', 'صاج لفة'];
const METAL_SECTIONS = [
    '1×1 سم', '1.5×1.5 سم', '2×2 سم', '2.5×2.5 سم', '3×3 سم', '4×4 سم', '5×5 سم', '6×6 سم',
    '2×4 سم', '3×6 سم', '4×8 سم', '5×10 سم',
    '0.5 بوصة', '0.75 بوصة', '1 بوصة', '1.25 بوصة', '1.5 بوصة', '2 بوصة', '2.5 بوصة', '3 بوصة'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getItemTotal(item: AnyItem): number {
    return item.quantity * item.unitPrice;
}

// سعر القطعة الواحدة = سعر الكيلو ÷ عدد القطع بالكيلو
function getPricePerPiece(unitPrice: number, piecesPerKg: number): number | null {
    if (piecesPerKg > 0) return unitPrice / piecesPerKg;
    return null;
}

function defaultItem(mc?: any): AnyItem {
    const baseId = Math.random().toString(36).substring(7);
    if (!mc) return { _id: baseId, mainCategoryId: '', formType: '', name: '', quantity: 1, unitPrice: 0, quantityType: 'PIECE', piecesPerKg: 0 };

    if (mc.formType === 'METAL_FORM') {
        return { _id: baseId, mainCategoryId: mc.id, formType: 'METAL_FORM', subtype: 'IRON', shape: '', sectionSize: '', thickness: '', quantityType: 'PIECE', quantity: 1, unitPrice: 0, piecesPerKg: 0, lengthPerPiece: 6, name: '' };
    }
    if (mc.formType === 'STANDARD_FORM' || mc.formType === 'PAINT_FORM') {
        return { _id: baseId, mainCategoryId: mc.id, formType: mc.formType, subcategory: 'FASTENERS', name: '', quantityType: 'PIECE', quantity: 1, unitPrice: 0, piecesPerKg: 0 };
    }
    return { _id: baseId, mainCategoryId: mc.id, formType: '', name: '', quantity: 1, unitPrice: 0, quantityType: 'PIECE', piecesPerKg: 0 };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PurchasesPage() {
    const [invoiceNo, setInvoiceNo] = useState('');
    const [supplier, setSupplier] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<AnyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    // ─ Supplier Autocomplete ─
    const [savedSuppliers, setSavedSuppliers] = useState<string[]>([]);
    const [supplierSugOpen, setSupplierSugOpen] = useState(false);
    const supplierRef = useRef<HTMLDivElement>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const WS_CAT_KEY = 'erp_inventory_categories';
    const [wsCategories, setWsCategories] = useState(DEFAULT_WS_SUBCATS);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [mainCategories, setMainCategories] = useState<any[]>([]);

    const loadWsData = async () => {
        setLoading(true);
        try { const c = localStorage.getItem(WS_CAT_KEY); if (c) { const parsed = JSON.parse(c); if (parsed.length) setWsCategories(parsed); } } catch { }
        try {
            const res = await fetch('/api/inventory');
            if (res.ok) {
                const data = await res.json();
                setInventoryItems(Array.isArray(data) ? data : []);
            }
        } catch { console.error('Failed to load inventory'); }
        try {
            const r2 = await fetch('/api/categories/main');
            if (r2.ok) {
                const cats = await r2.json();
                setMainCategories(Array.isArray(cats) ? cats : []);
            } else {
                console.error('API Error:', r2.status);
                setMainCategories([]);
            }
        } catch (err) {
            console.error('Fetch categories error:', err);
            setMainCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWsData();
        const fetchNextInv = async () => {
            try {
                const res = await fetch('/api/settings/counters?type=purchase');
                if (res.ok) {
                    const data = await res.json();
                    setInvoiceNo(data.invoiceNo);
                } else {
                    const s = (() => { try { const r = localStorage.getItem('erp_settings'); return r ? JSON.parse(r) : {}; } catch { return {}; } })();
                    setInvoiceNo(`${s?.purchasePrefix || 'PUR'}-####`);
                }
            } catch { }
        };
        fetchNextInv();
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);
        } catch { }

        const fetchSuppliers = async () => {
            let locals: string[] = [];
            try { locals = JSON.parse(localStorage.getItem('erp_suppliers') || '[]'); } catch { }
            try {
                const res = await fetch('/api/suppliers');
                if (res.ok) {
                    const data = await res.json();
                    const globalNames = data.map((d: any) => d.name).filter(Boolean);
                    setSavedSuppliers(Array.from(new Set([...globalNames, ...locals])).slice(0, 50));
                } else {
                    setSavedSuppliers(locals);
                }
            } catch {
                setSavedSuppliers(locals);
            }
        };
        fetchSuppliers();

        const handler = (e: MouseEvent) => { if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) setSupplierSugOpen(false); };
        document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
    }, []);

    const saveSupplierName = (name: string) => {
        if (!name.trim()) return;
        const updated = [name.trim(), ...savedSuppliers.filter(s => s !== name.trim())].slice(0, 30);
        setSavedSuppliers(updated);
        localStorage.setItem('erp_suppliers', JSON.stringify(updated));
    };

    const addItem = () => {
        setItems(prev => [...prev, defaultItem(mainCategories.length > 0 ? mainCategories[0] : null)]);
    };
    const removeItem = (idx: number) => { const n = [...items]; n.splice(idx, 1); setItems(n); };
    const updateItem = (idx: number, patch: Partial<AnyItem>) => {
        const n = [...items];
        n[idx] = { ...n[idx], ...patch } as AnyItem;
        setItems(n);
    };

    // flatten to API format — يُرسل unitPricePerPiece للـ API كـ lastPurchasedPrice
    const flattenForAPI = (item: AnyItem) => {
        const base = {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: getItemTotal(item),
            mainCategoryId: item.mainCategoryId || null,
        };
        const mcName = mainCategories.find(c => c.id === item.mainCategoryId)?.name || '';

        if (item.formType === 'METAL_FORM') {
            const isKg = item.quantityType === 'KG';
            const pricePerPiece = isKg ? (item.piecesPerKg > 0 ? item.unitPrice / item.piecesPerKg : item.unitPrice) : item.unitPrice;
            const extraName = !isKg ? ` (طول ${item.lengthPerPiece}م)` : '';
            return {
                ...base,
                type: 'RAW_MATERIAL',
                inventoryCategory: mcName,
                name: `${item.subtype === 'IRON' ? 'حديد' : 'ستانلس'} / ${item.shape} ${item.sectionSize} - سماكة ${item.thickness}${extraName}`,
                thickness: parseFloat(item.thickness || '0') || null,
                dimensions: item.sectionSize,
                pricePerPiece,                          // سعر القطعة للمخزن
                customUnit: isKg ? 'كجم' : 'قطعة',
            };
        }

        if (item.formType === 'STANDARD_FORM' || item.formType === 'PAINT_FORM') {
            const pricePerPiece = (item.quantityType === 'KG' && item.piecesPerKg > 0)
                ? item.unitPrice / item.piecesPerKg
                : item.unitPrice;
            return {
                ...base,
                type: 'COMPONENT',
                inventoryCategory: mcName,
                name: item.name,
                thickness: null,
                dimensions: item.quantityType,
                pricePerPiece,
            };
        }

        return { ...base, type: 'COMPONENT', name: item.name, inventoryCategory: mcName, thickness: null, dimensions: null, pricePerPiece: item.unitPrice };
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return alert('يجب إضافة صنف واحد على الأقل');
        setLoading(true); setSuccessMsg('');
        saveSupplierName(supplier); // ← save to autocomplete on submit
        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceNo, supplier, date: invoiceDate, items: items.map(flattenForAPI) })
            });
            if (res.ok) {
                setSuccessMsg('✅ تم حفظ فاتورة المشتريات وترحيل الخامات للمخزن بنجاح! سعر القطعة مُحدَّث تلقائياً.');
                setItems([]); setSupplier('');
                fetch('/api/settings/counters?type=purchase')
                    .then(r => r.json())
                    .then(d => setInvoiceNo(d.invoiceNo))
                    .catch(() => {
                        const s = (() => { try { const r = localStorage.getItem('erp_settings'); return r ? JSON.parse(r) : {}; } catch { return {}; } })();
                        setInvoiceNo(`${s?.purchasePrefix || 'PUR'}-####`);
                    });
            } else alert('حدث خطأ أثناء إرسال الفاتورة');
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const currencySymbol = (() => { try { const s = JSON.parse(localStorage.getItem('erp_settings') || '{}'); return s.currencySymbol || 'ج.م'; } catch { return 'ج.م'; } })();
    const total = items.reduce((acc, it) => acc + getItemTotal(it), 0);

    // ── Shared input style ────────────────────────────────────────────────────
    const piecesBox = {
        background: 'rgba(41,182,246,0.06)',
        border: '1px solid rgba(41,182,246,0.25)',
        borderRadius: '8px',
        padding: '10px 12px',
    };

    return (
        <div className="unified-container animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>المشتريات وإمدادات المصنع</h1>
                    <p>تسجيل فواتير الموردين بتصنيفات ذكية - سعر القطعة يُحسب تلقائياً من وزن الكيلو</p>
                </div>
            </header>

            {successMsg && <div style={{ background: 'rgba(102,187,106,0.2)', color: '#66bb6a', padding: '14px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>{successMsg}</div>}

            <form onSubmit={handleSave} className="glass-panel">
                {/* Invoice meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <label htmlFor="invNo">رقم الفاتورة (آلي أو مخصص)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input id="invNo" type="text" className="input-glass" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={{ flex: 1 }} required title="رقم الفاتورة" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="supplier">اسم المورد / الشركة</label>
                        <div ref={supplierRef} style={{ position: 'relative' }}>
                            <input id="supplier" type="text" className="input-glass" value={supplier}
                                onChange={e => { setSupplier(e.target.value); setSupplierSugOpen(true); }}
                                onFocus={() => setSupplierSugOpen(true)}
                                required placeholder="شركة حديد عز / مورد دهانات.." title="اسم المورد" />
                            {supplierSugOpen && savedSuppliers.filter(s => !supplier || s.includes(supplier)).length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#1e2028', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                    {savedSuppliers.filter(s => !supplier || s.toLowerCase().includes(supplier.toLowerCase())).map(s => (
                                        <div key={s} onClick={() => { setSupplier(s); setSupplierSugOpen(false); }}
                                            style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '0.9rem', color: '#ddd', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            🏷️ {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="invDate">تاريخ الفاتورة</label>
                        <input id="invDate" type="date" className="input-glass" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required title="تاريخ الفاتورة" />
                    </div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                        <h3>أصناف الفاتورة ({items.length})</h3>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => addItem()} className="btn-modern btn-primary" style={{ padding: '7px 14px', fontSize: '0.9rem', fontWeight: 'bold' }}>➕ إضافة صنف مشتريات جديد</button>
                        </div>
                    </div>

                    {items.length === 0 && <p style={{ textAlign: 'center', margin: '2.5rem', color: '#666' }}>اضغط زر الإضافة لبدء تسجيل الفاتورة</p>}

                    {items.map((item, idx) => (
                        <div key={item._id} style={{ background: 'rgba(0,0,0,0.12)', border: `1px solid rgba(120,144,156,0.3)`, borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <label style={{ fontSize: '0.85rem', color: '#aaa', margin: 0 }}>الفئة (Dropdown)</label>
                                    <select className="input-glass" style={{ minWidth: '200px', fontWeight: 'bold', border: '1px solid var(--primary-color)' }} value={item.mainCategoryId} onChange={e => {
                                        const mc = mainCategories.find(c => c.id === e.target.value);
                                        if (mc) {
                                            const nItem = defaultItem(mc);
                                            updateItem(idx, { mainCategoryId: mc.id, formType: mc.formType, subtype: nItem.subtype, shape: nItem.shape, sectionSize: nItem.sectionSize, thickness: nItem.thickness, quantityType: nItem.quantityType });
                                        }
                                    }}>
                                        {mainCategories.length === 0 && <option value="">جاري التحميل...</option>}
                                        {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={() => removeItem(idx)} style={{ background: 'transparent', color: '#ff5252', border: '1px solid #ff525244', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>✕ حذف</button>
                            </div>

                            {/* ═══ METAL ITEM ═══ */}
                            {item.formType === 'METAL_FORM' && (() => {
                                const m = item;
                                const isKg = m.quantityType === 'KG';
                                const pricePerPiece = isKg ? getPricePerPiece(m.unitPrice, m.piecesPerKg) : m.unitPrice;
                                const pricePerMeter = (!isKg && m.lengthPerPiece && m.lengthPerPiece > 0) ? m.unitPrice / m.lengthPerPiece : null;

                                return (
                                    <>
                                        <div className="flex-group">
                                            <div style={{ width: '130px' }}>
                                                <label htmlFor={`pur_qtyt-${idx}`}>طريقة الشراء</label>
                                                <select id={`pur_qtyt-${idx}`} className="input-glass w-full" value={m.quantityType} onChange={e => updateItem(idx, { quantityType: e.target.value as any })} title="طريقة الشراء">
                                                    <option value="PIECE">بالعدد (قطعة/ماسورة)</option>
                                                    <option value="KG">بالوزن (كيلو)</option>
                                                </select>
                                            </div>
                                            <div style={{ width: '100px' }}>
                                                <label htmlFor={`pur_subt-${idx}`}>نوع المعدن</label>
                                                <select id={`pur_subt-${idx}`} className="input-glass w-full" value={m.subtype} onChange={e => updateItem(idx, { subtype: e.target.value as any })} title="نوع المعدن">
                                                    <option value="IRON">حديد</option>
                                                    <option value="STAINLESS">ستانلس</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1, minWidth: '140px' }}>
                                                <label htmlFor={`pur_shape-${idx}`}>الشكل / النوع</label>
                                                <select id={`pur_shape-${idx}`} className="input-glass w-full" value={m.shape} onChange={e => updateItem(idx, { shape: e.target.value })} title="الشكل أو النوع">
                                                    <option value="">-- اختر --</option>
                                                    {METAL_SHAPES.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ width: '120px' }}>
                                                <label htmlFor={`pur_sec-${idx}`}>القطاع / الحجم</label>
                                                <input id={`pur_sec-${idx}`} type="text" list="metal-sections" className="input-glass w-full" value={m.sectionSize} onChange={e => updateItem(idx, { sectionSize: e.target.value })} placeholder="اختر الحجم أو اكتب" title="القطاع أو الحجم" />
                                                <datalist id="metal-sections">
                                                    {METAL_SECTIONS.map(sec => <option key={sec} value={sec} />)}
                                                </datalist>
                                            </div>
                                            <div style={{ width: '90px' }}>
                                                <label htmlFor={`pur_thk-${idx}`}>السماكة</label>
                                                <input id={`pur_thk-${idx}`} type="text" className="input-glass w-full" value={m.thickness} onChange={e => updateItem(idx, { thickness: e.target.value })} placeholder="1.5mm" title="السماكة" />
                                            </div>

                                            <div style={{ width: '90px' }}>
                                                <label htmlFor={`pur_qty-${idx}`}>الكمية ({isKg ? 'كيلو' : 'عدد'})</label>
                                                <input id={`pur_qty-${idx}`} type="number" className="input-glass w-full" value={m.quantity} onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) })} min="0.001" step="any" required title="الكمية" />
                                            </div>
                                            <div style={{ width: '110px' }}>
                                                <label htmlFor={`pur_uprice-${idx}`}>سعر {isKg ? 'الكيلو' : 'القطعة'} ({currencySymbol})</label>
                                                <input id={`pur_uprice-${idx}`} type="number" className="input-glass w-full" value={m.unitPrice} onChange={e => updateItem(idx, { unitPrice: parseFloat(e.target.value) })} min="0" step="any" required title="سعر الوحدة" />
                                            </div>
                                            <div style={{ width: '100px' }}>
                                                <label>الإجمالي</label>
                                                <div className="text-primary font-bold p-1">{getItemTotal(m).toFixed(0)}</div>
                                            </div>
                                        </div>

                                        {/* ── حساب التفاصيل إضافية للقطعة والمتر ── */}
                                        <div className="flex-group mt-2" style={{ background: 'rgba(41,182,246,0.06)', border: '1px solid rgba(41,182,246,0.25)', borderRadius: '8px', padding: '10px 12px' }}>

                                            {isKg ? (
                                                <>
                                                    <span className="text-primary font-bold text-sm">⚖️ تحويل الكيلو → قطعة:</span>
                                                    <div className="flex-center gap-2">
                                                        <label htmlFor={`pur_pkg-${idx}`} className="text-muted text-sm my-0">عدد القطع في الكيلو:</label>
                                                        <input id={`pur_pkg-${idx}`} type="number" className="input-glass" value={m.piecesPerKg || ''} onChange={e => updateItem(idx, { piecesPerKg: parseFloat(e.target.value) || 0 })}
                                                            min="0" step="any" placeholder="0 = لا ينطبق" style={{ width: '110px' }} title="عدد القطع في الكيلو" />
                                                    </div>
                                                    {pricePerPiece !== null ? (
                                                        <div className="flex-center gap-1">
                                                            <span className="text-muted text-sm">سعر القطعة:</span>
                                                            <strong className="text-success text-base">{pricePerPiece.toFixed(0)} {currencySymbol}</strong>
                                                            <span className="text-muted text-xs">(يُستخدم في التصنيع)</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted text-sm">أدخل العدد לחساب السعر</span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex-group w-full mt-2">
                                                    <div className="flex-center gap-2">
                                                        <span className="text-primary font-bold text-sm">📏 تفاصيل العود/القطعة:</span>
                                                        <label htmlFor={`pur_len-${idx}`} className="text-muted text-sm my-0">طول الوحدة (بالمتر):</label>
                                                        <input id={`pur_len-${idx}`} type="number" className="input-glass" value={m.lengthPerPiece || ''} onChange={e => updateItem(idx, { lengthPerPiece: parseFloat(e.target.value) || 0 })}
                                                            min="0.1" step="any" placeholder="6" style={{ width: '90px' }} title="طول الوحدة بالمتر" />
                                                    </div>
                                                    <div className="flex-center gap-3 bg-black/20 px-4 py-1 rounded-md">
                                                        <span className="text-fuchsia-600 text-sm font-bold">
                                                            إجمالي الأمتار الموردة: {((m.quantity || 0) * (m.lengthPerPiece || 0)).toFixed(0)} متر
                                                        </span>
                                                        <span className="text-muted">|</span>
                                                        {pricePerMeter !== null && (
                                                            <span className="text-orange-400 text-sm font-bold">
                                                                سعر المتر التقريبي: {pricePerMeter.toFixed(4)} {currencySymbol}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}

                            {/* ═══ WORKSHOP ITEM ═══ */}
                            {(item.formType === 'STANDARD_FORM' || item.formType === 'PAINT_FORM') && (() => {
                                const w = item;
                                const subcat = wsCategories.find(x => x.key === w.subcategory) || wsCategories[0] || DEFAULT_WS_SUBCATS[0];
                                const isKg = w.quantityType === 'KG';
                                const pricePerPiece = isKg ? getPricePerPiece(w.unitPrice, w.piecesPerKg) : null;
                                const filteredSuggestions = subcat.suggestions ? subcat.suggestions.filter(s => !w.name || s.includes(w.name)) : [];
                                return (
                                    <>
                                        {/* ─ subcategory selector ─ */}
                                        <div className="flex-group mb-2">
                                            {wsCategories.map(sc => (
                                                <button key={sc.key} type="button"
                                                    onClick={() => updateItem(idx, { subcategory: sc.key, name: '', quantityType: 'PIECE' } as any)}
                                                    className={`px-3 py-1 rounded-full cursor-pointer font-inherit text-sm ${w.subcategory === sc.key ? 'font-bold bg-opacity-20 border' : 'font-normal border-transparent hover:bg-white/5'}`}
                                                    style={{ background: w.subcategory === sc.key ? sc.color + '33' : 'transparent', borderColor: w.subcategory === sc.key ? sc.color : 'rgba(255,255,255,0.15)', color: w.subcategory === sc.key ? sc.color : '#888' }}>
                                                    {sc.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex-group">
                                            <div className="flex-1 min-w-[200px] relative">
                                                <label htmlFor={`ws_name-${idx}`}>اسم / نوع المستلزم</label>
                                                <input id={`ws_name-${idx}`} type="text" className="input-glass w-full" list={`ws-sug-${idx}`} value={w.name}
                                                    onChange={e => {
                                                        const newVal = e.target.value;
                                                        // Auto-fill price if we match an inventory item exactly
                                                        const matchedItem = inventoryItems.find(i => i.name === newVal && i.category === subcat.label);
                                                        if (matchedItem) {
                                                            let qType: AnyItem['quantityType'] = 'PIECE';
                                                            if (matchedItem.unit.includes('كجم') || matchedItem.unit.includes('كيلو')) qType = 'KG';
                                                            if (matchedItem.unit.includes('لتر')) qType = 'LITER';
                                                            if (matchedItem.unit.includes('متر')) qType = 'METER';
                                                            updateItem(idx, { name: newVal, unitPrice: matchedItem.lastPurchasedPrice || 0, quantityType: qType });
                                                        } else {
                                                            updateItem(idx, { name: newVal });
                                                        }
                                                    }}
                                                    placeholder="اكتب اسم الصنف.."
                                                    required title="اسم الصنف" />
                                                <datalist id={`ws-sug-${idx}`}>
                                                    {inventoryItems.filter(i => i.type === 'MATERIAL' && i.category === subcat.label).map(i => <option key={i.id} value={i.name} />)}
                                                </datalist>
                                                {/* Quick suggestion chips */}
                                                {w.name === '' && (
                                                    <div className="flex-group mt-1 gap-1">
                                                        {inventoryItems.filter(i => i.type === 'MATERIAL' && i.category === subcat.label).slice(0, 5).map(i => (
                                                            <button key={i.id} type="button" onClick={() => {
                                                                let qType: AnyItem['quantityType'] = 'PIECE';
                                                                if (i.unit.includes('كجم') || i.unit.includes('كيلو')) qType = 'KG';
                                                                if (i.unit.includes('لتر')) qType = 'LITER';
                                                                if (i.unit.includes('متر')) qType = 'METER';
                                                                updateItem(idx, { name: i.name, unitPrice: i.lastPurchasedPrice || 0, quantityType: qType });
                                                            }}
                                                                className="px-2 py-0.5 rounded-full cursor-pointer text-xs font-inherit border"
                                                                style={{ background: `${subcat.color}18`, borderColor: `${subcat.color}40`, color: subcat.color }} title={`اختر ${i.name}`}>
                                                                {i.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: '130px' }}>
                                                <label htmlFor={`ws_qtyt-${idx}`}>وحدة الكمية</label>
                                                <select id={`ws_qtyt-${idx}`} className="input-glass w-full" value={w.quantityType} onChange={e => updateItem(idx, { quantityType: e.target.value as any, piecesPerKg: 0 })} title="وحدة الكمية">
                                                    <option value="PIECE">عدد (قطعة)</option>
                                                    <option value="KG">وزن (كيلو)</option>
                                                    <option value="LITER">حجم (لتر)</option>
                                                    <option value="METER">طول (متر)</option>
                                                </select>
                                            </div>
                                            <div style={{ width: '100px' }}>
                                                <label htmlFor={`ws_qty-${idx}`}>الكمية ({isKg ? 'كيلو' : w.quantityType === 'LITER' ? 'لتر' : w.quantityType === 'METER' ? 'متر' : 'قطعة'})</label>
                                                <input id={`ws_qty-${idx}`} type="number" className="input-glass" value={w.quantity} onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) })} min="0.001" step="any" required title="الكمية" />
                                            </div>
                                            <div style={{ width: '140px' }}>
                                                <label htmlFor={`ws_uprice-${idx}`}>سعر الوحدة ({currencySymbol})</label>
                                                <input id={`ws_uprice-${idx}`} type="number" className="input-glass" value={w.unitPrice} onChange={e => updateItem(idx, { unitPrice: parseFloat(e.target.value) })} min="0" step="any" required title="سعر الوحدة" />
                                            </div>
                                            <div style={{ width: '110px' }}>
                                                <label>الإجمالي</label>
                                                <div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--primary-color)' }}>{getItemTotal(w).toFixed(0)}</div>
                                            </div>
                                        </div>

                                        {/* ── باكج الكيلو → قطعة (يظهر فقط لو KG) ── */}
                                        {isKg && (
                                            <div className="flex-group mt-3 bg-black/10 border border-blue-400/20 rounded-md py-2 px-3">
                                                <span className="text-primary font-bold text-sm">⚖️ تحويل الكيلو → قطعة:</span>
                                                <div className="flex-center gap-2">
                                                    <label htmlFor={`ws_pkg-${idx}`} className="text-muted text-sm my-0">كام قطعة في الكيلو:</label>
                                                    <input id={`ws_pkg-${idx}`} type="number" className="input-glass" value={w.piecesPerKg || ''} onChange={e => updateItem(idx, { piecesPerKg: parseFloat(e.target.value) || 0 })}
                                                        min="0" step="any" placeholder="0 = لا ينطبق" style={{ width: '130px' }} title="عدد القطع في الكيلو" />
                                                </div>
                                                {pricePerPiece !== null ? (
                                                    <div className="flex-center gap-1">
                                                        <span className="text-muted text-sm">سعر القطعة:</span>
                                                        <strong className="text-success text-base">{pricePerPiece.toFixed(0)} {currencySymbol}</strong>
                                                        <span className="text-muted text-xs">(يُستخدم في التصنيع تلقائياً)</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted text-sm">أدخل عدد القطع في الكيلو لحساب السعر تلقائياً</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* ═══ OTHER ITEM ═══ */}
                            {item.formType === '' && (() => {
                                const o = item;
                                return (
                                    <div className="flex-group">
                                        <div className="flex-1 min-w-[200px]">
                                            <label htmlFor={`oth_name-${idx}`}>البيان / الوصف</label>
                                            <input id={`oth_name-${idx}`} type="text" className="input-glass w-full" value={o.name} onChange={e => updateItem(idx, { name: e.target.value })} placeholder="وصف الصنف.." required title="وصف الصنف" />
                                        </div>
                                        <div style={{ width: '100px' }}>
                                            <label htmlFor={`oth_qty-${idx}`}>الكمية</label>
                                            <input id={`oth_qty-${idx}`} type="number" className="input-glass w-full" value={o.quantity} onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) })} min="0.001" step="any" required title="الكمية" />
                                        </div>
                                        <div style={{ width: '130px' }}>
                                            <label htmlFor={`oth_uprice-${idx}`}>سعر الوحدة ({currencySymbol})</label>
                                            <input id={`oth_uprice-${idx}`} type="number" className="input-glass w-full" value={o.unitPrice} onChange={e => updateItem(idx, { unitPrice: parseFloat(e.target.value) })} min="0" step="any" required title="سعر الوحدة" />
                                        </div>
                                        <div style={{ width: '110px' }}>
                                            <label>الإجمالي</label>
                                            <div className="text-primary font-bold p-1">{getItemTotal(o).toFixed(0)}</div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex-between mt-4 pt-6 border-t border-white/10">
                    <div>
                        <h2 className="text-white m-0 pb-1 text-xl">إجمالي الفاتورة: <span className="text-primary">{total.toLocaleString('en-US')} {currencySymbol}</span></h2>
                        <p className="text-muted text-sm m-0">💡 سعر القطعة (من حقل الكيلو ÷ عدد القطع) يُحفظ في المخزن ويُستخدم تلقائياً في تكلفة التصنيع</p>
                    </div>
                    {isAdmin ? (
                        <button type="submit" className="btn-modern btn-primary text-lg px-8 py-3" disabled={loading}>
                            {loading ? '⏳ جاري الحفظ والترحيل...' : '📦 تأكيد وإدخال للمخزن ✔'}
                        </button>
                    ) : (
                        <div className="sh-badge partial relative px-6 py-4">
                            ⚠️ تسجيل المشتريات مسموح به للمديرين فقط
                        </div>
                    )}
                </div>
            </form>

        </div>
    );
}
