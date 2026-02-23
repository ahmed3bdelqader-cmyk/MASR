'use client';
import React, { useState, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────────────────────
type MetalItem = {
    category: 'METAL';
    subtype: 'STAINLESS' | 'IRON';
    shape: string; sectionSize: string; thickness: string;
    quantityType: 'KG' | 'PIECE';
    unitPrice: number; quantity: number;
    piecesPerKg: number;   // كام قطعة في الكيلو (لو الشراء بالكيلو)
    lengthPerPiece: number; // طول القطعة/الماسورة بالمتر (لو الشراء بالقطعة)
};
type WorkshopItem = {
    category: 'WORKSHOP';
    subcategory: string;
    name: string; quantityType: 'KG' | 'PIECE' | 'LITER' | 'METER';
    quantity: number; unitPrice: number;
    piecesPerKg: number;
};
type OtherItem = {
    category: 'OTHER';
    name: string; quantity: number; unitPrice: number;
};
type AnyItem = MetalItem | WorkshopItem | OtherItem;

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

function defaultItem(cat: string, defaultSub?: string): AnyItem {
    if (cat === 'METAL') return { category: 'METAL', subtype: 'IRON', shape: '', sectionSize: '', thickness: '', quantityType: 'PIECE', quantity: 1, unitPrice: 0, piecesPerKg: 0, lengthPerPiece: 6 };
    if (cat === 'WORKSHOP') return { category: 'WORKSHOP', subcategory: defaultSub || 'FASTENERS', name: '', quantityType: 'PIECE', quantity: 1, unitPrice: 0, piecesPerKg: 0 };
    return { category: 'OTHER', name: '', quantity: 1, unitPrice: 0 };
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

    // ─ Workshop Items & Categories Manager (persistent localStorage) ─
    type WsItem = { id: string; subcategory: string; name: string; unit: string; defaultPrice: number };
    const WS_KEY = 'erp_ws_items';
    const WS_CAT_KEY = 'erp_ws_categories';
    const [wsItems, setWsItems] = useState<WsItem[]>([]);
    const [wsCategories, setWsCategories] = useState(DEFAULT_WS_SUBCATS);
    const [showWsMgr, setShowWsMgr] = useState(false);
    const [wsForm, setWsForm] = useState({ subcategory: 'FASTENERS', name: '', unit: 'قطعة', defaultPrice: '' });

    // Category management state
    const [catForm, setCatForm] = useState({ label: '', color: '#ffcc80' });

    const loadWsData = () => {
        try { const r = localStorage.getItem(WS_KEY); setWsItems(r ? JSON.parse(r) : []); } catch { setWsItems([]); }
        try { const c = localStorage.getItem(WS_CAT_KEY); if (c) { const parsed = JSON.parse(c); if (parsed.length) setWsCategories(parsed); } } catch { }
    };
    const saveWsItems = (list: WsItem[]) => { localStorage.setItem(WS_KEY, JSON.stringify(list)); setWsItems(list); };
    const saveWsCategories = (list: typeof wsCategories) => { localStorage.setItem(WS_CAT_KEY, JSON.stringify(list)); setWsCategories(list); };

    // category actions
    const handleAddCategory = () => {
        if (!catForm.label.trim()) return;
        const newKey = 'CAT_' + Date.now();
        saveWsCategories([...wsCategories, { key: newKey, label: catForm.label.trim(), suggestions: [], color: catForm.color }]);
        setCatForm({ label: '', color: '#ffcc80' });
    };
    const handleDeleteCategory = (key: string) => {
        if (!confirm('القسم سيحذف فقط من القائمة ولن يتم حذف البنود المتعلقة به من فواتير المشتريات.. هل أنت متأكد من الحذف؟')) return;
        saveWsCategories(wsCategories.filter(c => c.key !== key));
    };
    const handleEditCategoryName = (key: string) => {
        const newName = prompt('اكتب الاسم الجديد للقسم:');
        if (newName && newName.trim()) {
            saveWsCategories(wsCategories.map(c => c.key === key ? { ...c, label: newName.trim() } : c));
        }
    };

    const wsAddItem = () => {
        if (!wsForm.name.trim()) return;
        const newItem: WsItem = { id: Date.now().toString(), subcategory: wsForm.subcategory || wsCategories[0]?.key || 'OTHER_WS', name: wsForm.name.trim(), unit: wsForm.unit || 'قطعة', defaultPrice: parseFloat(wsForm.defaultPrice) || 0 };
        saveWsItems([...wsItems, newItem]);
        setWsForm(f => ({ ...f, name: '', defaultPrice: '' }));
    };
    const wsDeleteItem = (id: string) => saveWsItems(wsItems.filter(x => x.id !== id));
    const wsUseItem = (ws: WsItem) => {
        const unitMap: Record<string, WorkshopItem['quantityType']> = { 'كيلو': 'KG', 'لتر': 'LITER', 'متر': 'METER' };
        const qt: WorkshopItem['quantityType'] = unitMap[ws.unit] || 'PIECE';
        const newItem: WorkshopItem = { category: 'WORKSHOP', subcategory: ws.subcategory, name: ws.name, quantityType: qt, quantity: 1, unitPrice: ws.defaultPrice, piecesPerKg: 0 };
        setItems(prev => [...prev, newItem]);
        setShowWsMgr(false);
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
            setIsAdmin(u.role === 'ADMIN' || !u.role);
        } catch { }

        const handler = (e: MouseEvent) => { if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) setSupplierSugOpen(false); };
        document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler);
    }, []);

    const saveSupplierName = (name: string) => {
        if (!name.trim()) return;
        const updated = [name.trim(), ...savedSuppliers.filter(s => s !== name.trim())].slice(0, 30);
        setSavedSuppliers(updated);
        localStorage.setItem('erp_suppliers', JSON.stringify(updated));
    };

    const addItem = (cat: string) => {
        setItems(prev => [...prev, defaultItem(cat, wsCategories.length > 0 ? wsCategories[0].key : undefined)]);
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
        };
        if (item.category === 'METAL') {
            const m = item as MetalItem;
            const isKg = m.quantityType === 'KG';
            const pricePerPiece = isKg ? (m.piecesPerKg > 0 ? m.unitPrice / m.piecesPerKg : m.unitPrice) : m.unitPrice;
            const extraName = !isKg ? ` (طول ${m.lengthPerPiece}م)` : '';
            return {
                ...base,
                type: 'RAW_MATERIAL',
                name: `${m.subtype === 'IRON' ? 'حديد' : 'ستانلس'} / ${m.shape} ${m.sectionSize} - سماكة ${m.thickness}${extraName}`,
                thickness: parseFloat(m.thickness) || null,
                dimensions: m.sectionSize,
                pricePerPiece,                          // سعر القطعة للمخزن
                customUnit: isKg ? 'كجم' : 'قطعة',
            };
        }
        if (item.category === 'WORKSHOP') {
            const w = item as WorkshopItem;
            const pricePerPiece = (w.quantityType === 'KG' && w.piecesPerKg > 0)
                ? w.unitPrice / w.piecesPerKg
                : w.unitPrice;
            const subcatLabel = wsCategories.find(x => x.key === w.subcategory)?.label || w.subcategory;
            return {
                ...base,
                type: 'COMPONENT',
                inventoryCategory: subcatLabel,
                name: w.name,
                thickness: null,
                dimensions: w.quantityType,
                pricePerPiece,
            };
        }
        const o = item as OtherItem;
        return { ...base, type: 'COMPONENT', name: o.name, thickness: null, dimensions: null, pricePerPiece: o.unitPrice };
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
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>المشتريات وإمدادات المصنع</h1>
                    <p>تسجيل فواتير الموردين بتصنيفات ذكية - سعر القطعة يُحسب تلقائياً من وزن الكيلو</p>
                </div>
                {isAdmin && (
                    <button type="button" onClick={() => setShowWsMgr(true)} className="btn-primary"
                        style={{ padding: '10px 18px', background: '#8d6e63', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        🔧 إدارة بنود مستلزمات الورشة <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '12px', padding: '1px 8px', fontSize: '0.82rem' }}>{wsItems.length}</span>
                    </button>
                )}
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
                            <button type="button" onClick={() => addItem('METAL')} className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.85rem', background: '#78909c' }}>⚙️ + معدن (حديد/ستانلس)</button>
                            <button type="button" onClick={() => addItem('WORKSHOP')} className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.85rem', background: '#8d6e63' }}>🔩 + مستلزمات ورشة</button>
                            <button type="button" onClick={() => addItem('OTHER')} className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.85rem', background: '#546e7a' }}>📦 + صنف آخر</button>
                        </div>
                    </div>

                    {items.length === 0 && <p style={{ textAlign: 'center', margin: '2.5rem', color: '#666' }}>اضغط أحد أزرار الإضافة لبدء تسجيل الفاتورة</p>}

                    {items.map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.12)', border: `1px solid ${item.category === 'METAL' ? 'rgba(120,144,156,0.3)' : item.category === 'WORKSHOP' ? 'rgba(141,110,99,0.3)' : 'rgba(84,110,122,0.3)'}`, borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: item.category === 'METAL' ? '#78909c22' : '#8d6e6322', color: item.category === 'METAL' ? '#78909c' : item.category === 'WORKSHOP' ? '#a1887f' : '#aaa' }}>
                                    {item.category === 'METAL' ? '⚙️ معدن' : item.category === 'WORKSHOP' ? '🔩 مستلزمات ورشة' : '📦 صنف آخر'}
                                </span>
                                <button type="button" onClick={() => removeItem(idx)} style={{ background: 'transparent', color: '#ff5252', border: '1px solid #ff525244', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>✕ حذف</button>
                            </div>

                            {/* ═══ METAL ITEM ═══ */}
                            {item.category === 'METAL' && (() => {
                                const m = item as MetalItem;
                                const isKg = m.quantityType === 'KG';
                                const pricePerPiece = isKg ? getPricePerPiece(m.unitPrice, m.piecesPerKg) : m.unitPrice;
                                const pricePerMeter = (!isKg && m.lengthPerPiece > 0) ? m.unitPrice / m.lengthPerPiece : null;

                                return (
                                    <>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                                            <div style={{ width: '130px' }}>
                                                <label htmlFor={`pur_qtyt-${idx}`}>طريقة الشراء</label>
                                                <select id={`pur_qtyt-${idx}`} className="input-glass" value={m.quantityType} onChange={e => updateItem(idx, { quantityType: e.target.value as any })} title="طريقة الشراء">
                                                    <option value="PIECE">بالعدد (قطعة/ماسورة)</option>
                                                    <option value="KG">بالوزن (كيلو)</option>
                                                </select>
                                            </div>
                                            <div style={{ width: '100px' }}>
                                                <label htmlFor={`pur_subt-${idx}`}>نوع المعدن</label>
                                                <select id={`pur_subt-${idx}`} className="input-glass" value={m.subtype} onChange={e => updateItem(idx, { subtype: e.target.value as any })} title="نوع المعدن">
                                                    <option value="IRON">حديد</option>
                                                    <option value="STAINLESS">ستانلس</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1, minWidth: '140px' }}>
                                                <label htmlFor={`pur_shape-${idx}`}>الشكل / النوع</label>
                                                <select id={`pur_shape-${idx}`} className="input-glass" value={m.shape} onChange={e => updateItem(idx, { shape: e.target.value })} title="الشكل أو النوع">
                                                    <option value="">-- اختر --</option>
                                                    {METAL_SHAPES.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ width: '120px' }}>
                                                <label htmlFor={`pur_sec-${idx}`}>القطاع / الحجم</label>
                                                <input id={`pur_sec-${idx}`} type="text" list="metal-sections" className="input-glass" value={m.sectionSize} onChange={e => updateItem(idx, { sectionSize: e.target.value })} placeholder="اختر الحجم أو اكتب" title="القطاع أو الحجم" />
                                                <datalist id="metal-sections">
                                                    {METAL_SECTIONS.map(sec => <option key={sec} value={sec} />)}
                                                </datalist>
                                            </div>
                                            <div style={{ width: '90px' }}>
                                                <label htmlFor={`pur_thk-${idx}`}>السماكة</label>
                                                <input id={`pur_thk-${idx}`} type="text" className="input-glass" value={m.thickness} onChange={e => updateItem(idx, { thickness: e.target.value })} placeholder="1.5mm" title="السماكة" />
                                            </div>

                                            <div style={{ width: '90px' }}>
                                                <label htmlFor={`pur_qty-${idx}`}>الكمية ({isKg ? 'كيلو' : 'عدد'})</label>
                                                <input id={`pur_qty-${idx}`} type="number" className="input-glass" value={m.quantity} onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) })} min="0.001" step="any" required title="الكمية" />
                                            </div>
                                            <div style={{ width: '110px' }}>
                                                <label htmlFor={`pur_uprice-${idx}`}>سعر {isKg ? 'الكيلو' : 'القطعة'} ({currencySymbol})</label>
                                                <input id={`pur_uprice-${idx}`} type="number" className="input-glass" value={m.unitPrice} onChange={e => updateItem(idx, { unitPrice: parseFloat(e.target.value) })} min="0" step="any" required title="سعر الوحدة" />
                                            </div>
                                            <div style={{ width: '100px' }}>
                                                <label>الإجمالي</label>
                                                <div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--primary-color)' }}>{getItemTotal(m).toFixed(0)}</div>
                                            </div>
                                        </div>

                                        {/* ── حساب التفاصيل إضافية للقطعة والمتر ── */}
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', ...piecesBox }}>

                                            {isKg ? (
                                                <>
                                                    <span style={{ color: '#29b6f6', fontWeight: 600, fontSize: '0.85rem' }}>⚖️ تحويل الكيلو → قطعة:</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <label htmlFor={`pur_pkg-${idx}`} style={{ color: '#aaa', fontSize: '0.83rem', margin: 0 }}>عدد القطع في الكيلو:</label>
                                                        <input id={`pur_pkg-${idx}`} type="number" className="input-glass" value={m.piecesPerKg || ''} onChange={e => updateItem(idx, { piecesPerKg: parseFloat(e.target.value) || 0 })}
                                                            min="0" step="any" placeholder="0 = لا ينطبق" style={{ width: '110px' }} title="عدد القطع في الكيلو" />
                                                    </div>
                                                    {pricePerPiece !== null ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ color: '#919398', fontSize: '0.83rem' }}>سعر القطعة:</span>
                                                            <strong style={{ color: '#66bb6a', fontSize: '1rem' }}>{pricePerPiece.toFixed(0)} {currencySymbol}</strong>
                                                            <span style={{ color: '#555', fontSize: '0.75rem' }}>(يُستخدم في التصنيع)</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#555', fontSize: '0.82rem' }}>أدخل العدد לחساب السعر</span>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ color: '#29b6f6', fontWeight: 600, fontSize: '0.85rem' }}>📏 تفاصيل العود/القطعة:</span>
                                                        <label htmlFor={`pur_len-${idx}`} style={{ color: '#aaa', fontSize: '0.83rem', margin: 0 }}>طول الوحدة (بالمتر):</label>
                                                        <input id={`pur_len-${idx}`} type="number" className="input-glass" value={m.lengthPerPiece || ''} onChange={e => updateItem(idx, { lengthPerPiece: parseFloat(e.target.value) || 0 })}
                                                            min="0.1" step="any" placeholder="6" style={{ width: '90px' }} title="طول الوحدة بالمتر" />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '6px' }}>
                                                        <span style={{ color: '#9c27b0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                            إجمالي الأمتار الموردة: {((m.quantity || 0) * (m.lengthPerPiece || 0)).toFixed(0)} متر
                                                        </span>
                                                        <span style={{ color: '#555' }}>|</span>
                                                        {pricePerMeter !== null && (
                                                            <span style={{ color: '#ffa726', fontSize: '0.9rem', fontWeight: 'bold' }}>
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
                            {item.category === 'WORKSHOP' && (() => {
                                const w = item as WorkshopItem;
                                const subcat = wsCategories.find(x => x.key === w.subcategory) || wsCategories[0] || DEFAULT_WS_SUBCATS[0];
                                const isKg = w.quantityType === 'KG';
                                const pricePerPiece = isKg ? getPricePerPiece(w.unitPrice, w.piecesPerKg) : null;
                                const filteredSuggestions = subcat.suggestions ? subcat.suggestions.filter(s => !w.name || s.includes(w.name)) : [];
                                return (
                                    <>
                                        {/* ─ subcategory selector ─ */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                            {wsCategories.map(sc => (
                                                <button key={sc.key} type="button"
                                                    onClick={() => updateItem(idx, { subcategory: sc.key, name: '', quantityType: 'PIECE' } as any)}
                                                    style={{ padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: w.subcategory === sc.key ? 700 : 400, background: w.subcategory === sc.key ? sc.color + '33' : 'transparent', border: `1px solid ${w.subcategory === sc.key ? sc.color : 'rgba(255,255,255,0.15)'}`, color: w.subcategory === sc.key ? sc.color : '#888' }}>
                                                    {sc.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                                                <label htmlFor={`ws_name-${idx}`}>اسم / نوع المستلزم</label>
                                                <input id={`ws_name-${idx}`} type="text" className="input-glass" list={`ws-sug-${idx}`} value={w.name}
                                                    onChange={e => updateItem(idx, { name: e.target.value })}
                                                    placeholder={subcat.suggestions?.[0] || 'اكتب اسم الصنف..'}
                                                    required title="اسم الصنف" />
                                                {filteredSuggestions.length > 0 && w.name === '' && (
                                                    <datalist id={`ws-sug-${idx}`}>
                                                        {subcat.suggestions.map(s => <option key={s} value={s} />)}
                                                    </datalist>
                                                )}
                                                {/* Quick suggestion chips */}
                                                {w.name === '' && subcat.suggestions?.length > 0 && (
                                                    <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        {subcat.suggestions.slice(0, 5).map(s => (
                                                            <button key={s} type="button" onClick={() => updateItem(idx, { name: s })}
                                                                style={{ padding: '2px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.75rem', background: `${subcat.color}18`, border: `1px solid ${subcat.color}40`, color: subcat.color, fontFamily: 'inherit' }} title={`اختر ${s}`}>
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: '130px' }}>
                                                <label htmlFor={`ws_qtyt-${idx}`}>وحدة الكمية</label>
                                                <select id={`ws_qtyt-${idx}`} className="input-glass" value={w.quantityType} onChange={e => updateItem(idx, { quantityType: e.target.value as any, piecesPerKg: 0 })} title="وحدة الكمية">
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
                                            <div style={{ marginTop: '12px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', ...piecesBox }}>
                                                <span style={{ color: '#29b6f6', fontWeight: 600, fontSize: '0.85rem' }}>⚖️ تحويل الكيلو → قطعة:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <label htmlFor={`ws_pkg-${idx}`} style={{ color: '#aaa', fontSize: '0.83rem', margin: 0 }}>كام قطعة في الكيلو:</label>
                                                    <input id={`ws_pkg-${idx}`} type="number" className="input-glass" value={w.piecesPerKg || ''} onChange={e => updateItem(idx, { piecesPerKg: parseFloat(e.target.value) || 0 })}
                                                        min="0" step="any" placeholder="0 = لا ينطبق" style={{ width: '130px' }} title="عدد القطع في الكيلو" />
                                                </div>
                                                {pricePerPiece !== null ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ color: '#919398', fontSize: '0.83rem' }}>سعر القطعة:</span>
                                                        <strong style={{ color: '#66bb6a', fontSize: '1rem' }}>{pricePerPiece.toFixed(0)} {currencySymbol}</strong>
                                                        <span style={{ color: '#555', fontSize: '0.75rem' }}>(يُستخدم في التصنيع تلقائياً)</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#555', fontSize: '0.82rem' }}>أدخل عدد القطع في الكيلو لحساب السعر تلقائياً</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* ═══ OTHER ITEM ═══ */}
                            {item.category === 'OTHER' && (() => {
                                const o = item as OtherItem;
                                return (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label htmlFor={`oth_name-${idx}`}>البيان / الوصف</label>
                                            <input id={`oth_name-${idx}`} type="text" className="input-glass" value={o.name} onChange={e => updateItem(idx, { name: e.target.value })} placeholder="وصف الصنف.." required title="وصف الصنف" />
                                        </div>
                                        <div style={{ width: '100px' }}>
                                            <label htmlFor={`oth_qty-${idx}`}>الكمية</label>
                                            <input id={`oth_qty-${idx}`} type="number" className="input-glass" value={o.quantity} onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) })} min="0.001" step="any" required title="الكمية" />
                                        </div>
                                        <div style={{ width: '130px' }}>
                                            <label htmlFor={`oth_uprice-${idx}`}>سعر الوحدة ({currencySymbol})</label>
                                            <input id={`oth_uprice-${idx}`} type="number" className="input-glass" value={o.unitPrice} onChange={e => updateItem(idx, { unitPrice: parseFloat(e.target.value) })} min="0" step="any" required title="سعر الوحدة" />
                                        </div>
                                        <div style={{ width: '110px' }}>
                                            <label>الإجمالي</label>
                                            <div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--primary-color)' }}>{getItemTotal(o).toFixed(0)}</div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ color: '#fff', margin: '0 0 4px' }}>إجمالي الفاتورة: <span style={{ color: 'var(--primary-color)' }}>{total.toFixed(0)} {currencySymbol}</span></h2>
                        <p style={{ color: '#919398', fontSize: '0.82rem', margin: 0 }}>💡 سعر القطعة (من حقل الكيلو ÷ عدد القطع) يُحفظ في المخزن ويُستخدم تلقائياً في تكلفة التصنيع</p>
                    </div>
                    {isAdmin ? (
                        <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1, padding: '1rem 3rem', fontSize: '1.1rem' }}>
                            {loading ? 'جاري الحفظ والترحيل...' : 'تأكيد وإدخال للمخزن ✔'}
                        </button>
                    ) : (
                        <div style={{ color: '#E35E35', background: 'rgba(227,94,53,0.1)', padding: '1rem', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                            ⚠️ تسجيل المشتريات مسموح به للمديرين فقط
                        </div>
                    )}
                </div>
            </form>

            {/* ════ Workshop Items Manager Modal ════ */}
            {showWsMgr && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, padding: '20px', overflowY: 'auto' }}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(141,110,99,0.4)', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '760px', marginTop: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#ffcc80' }}>🔧 إدارة بنود مستلزمات الورشة الثابتة</h3>
                            <button onClick={() => setShowWsMgr(false)} style={{ background: 'transparent', border: 'none', color: '#ff5252', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <p style={{ color: '#919398', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            أضف بنود دائمة يمكن استخدامها في أي فاتورة مشتريات بضغطة زر واحد. يتم حفظها محلياً.
                        </p>

                        {/* ── Add form ── */}
                        <div style={{ background: 'rgba(141,110,99,0.08)', border: '1px solid rgba(141,110,99,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 12px', color: '#ffcc80', fontSize: '0.95rem' }}>➕ إضافة بند جديد</h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ minWidth: '160px' }}>
                                    <label htmlFor="mgr_sub" style={{ fontSize: '0.82rem' }}>القسم</label>
                                    <select id="mgr_sub" className="input-glass" value={wsForm.subcategory} onChange={e => setWsForm(f => ({ ...f, subcategory: e.target.value as any }))} title="اختر القسم">
                                        {wsCategories.map(sc => <option key={sc.key} value={sc.key}>{sc.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '160px' }}>
                                    <label htmlFor="mgr_name" style={{ fontSize: '0.82rem' }}>اسم البند</label>
                                    <input id="mgr_name" type="text" className="input-glass" value={wsForm.name} onChange={e => setWsForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الصنف.." title="اسم البند" />
                                </div>
                                <div style={{ width: '90px' }}>
                                    <label htmlFor="mgr_unit" style={{ fontSize: '0.82rem' }}>الوحدة</label>
                                    <select id="mgr_unit" className="input-glass" value={wsForm.unit} onChange={e => setWsForm(f => ({ ...f, unit: e.target.value }))} title="اختر الوحدة">
                                        <option value="قطعة">قطعة</option>
                                        <option value="كيلو">كيلو</option>
                                        <option value="لتر">لتر</option>
                                        <option value="متر">متر</option>
                                        <option value="زوج">زوج</option>
                                        <option value="بكت">بكت</option>
                                    </select>
                                </div>
                                <div style={{ width: '120px' }}>
                                    <label htmlFor="mgr_price" style={{ fontSize: '0.82rem' }}>سعر افتراضي</label>
                                    <input id="mgr_price" type="number" className="input-glass" value={wsForm.defaultPrice} onChange={e => setWsForm(f => ({ ...f, defaultPrice: e.target.value }))} min="0" step="any" placeholder="0" title="السعر الافتراضي" />
                                </div>
                                <button type="button" onClick={wsAddItem} className="btn-primary" style={{ padding: '10px 18px', background: '#8d6e63', whiteSpace: 'nowrap' }}>➕ إضافة</button>
                            </div>
                        </div>

                        {/* ── Categories Editor ── */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 12px', color: '#ffcc80', fontSize: '0.95rem' }}>🏷️ إدارة أقسام المستلزمات</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                                <input type="text" className="input-glass" value={catForm.label} onChange={e => setCatForm(f => ({ ...f, label: e.target.value }))} placeholder="اسم القسم الجديد (مثل: كابلات كهرباء)" style={{ flex: 1, minWidth: '180px' }} />
                                <input type="color" className="input-glass" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} style={{ width: '40px', padding: '2px' }} title="لون القسم" />
                                <button type="button" onClick={handleAddCategory} className="btn-primary" style={{ padding: '8px 14px', background: '#3f51b5' }}>+ إضافة قسم</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {wsCategories.map(sc => (
                                    <div key={sc.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${sc.color}55`, borderRadius: '8px', padding: '4px 8px', color: sc.color, fontSize: '0.85rem' }}>
                                        <span>{sc.label}</span>
                                        <button type="button" onClick={() => handleEditCategoryName(sc.key)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0 4px' }} title="تعديل الاسم">✏️</button>
                                        <button type="button" onClick={() => handleDeleteCategory(sc.key)} style={{ background: 'none', border: 'none', color: '#E35E35', cursor: 'pointer', padding: '0 4px' }} title="حذف القسم">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Items list grouped by subcategory ── */}
                        {wsCategories.map(sc => {
                            const scItems = wsItems.filter(x => x.subcategory === sc.key);
                            if (scItems.length === 0) return null;
                            return (
                                <div key={sc.key} style={{ marginBottom: '16px' }}>
                                    <div style={{ color: sc.color, fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {sc.label} <span style={{ color: '#666', fontWeight: 400 }}>({scItems.length} بند)</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {scItems.map(wi => (
                                            <div key={wi.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 12px' }}>
                                                <span style={{ flex: 1, fontWeight: 600 }}>{wi.name}</span>
                                                <span style={{ color: '#919398', fontSize: '0.8rem' }}>{wi.unit}</span>
                                                {wi.defaultPrice > 0 && <span style={{ color: 'var(--primary-color)', fontSize: '0.82rem' }}>{wi.defaultPrice.toFixed(0)} ج.م</span>}
                                                <button type="button" onClick={() => wsUseItem(wi)}
                                                    style={{ padding: '4px 10px', background: 'rgba(141,110,99,0.2)', border: '1px solid #8d6e63', color: '#ffcc80', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                                                    → إدراج
                                                </button>
                                                <button type="button" onClick={() => wsDeleteItem(wi.id)}
                                                    style={{ padding: '4px 8px', background: 'rgba(227,94,53,0.1)', border: '1px solid #E35E35', color: '#E35E35', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>
                                                    🗑
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {wsItems.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>لم تقم بإضافة بنود دائمة بعد.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
