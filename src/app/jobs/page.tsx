'use client';
import React, { useEffect, useState } from 'react';

type ExtraItem = { description: string; quantity: number; unitPrice: number };
type PaintItem = {
    source: 'manual' | 'invoice';
    productName: string;
    quantity: number;
    color: string;
    colorCode: string;
    unitPrice: number;
};

const SYM = () => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } };

const STAGES = [
    { key: 'RAW_MATERIAL', label: 'استلام الخامات', icon: '📦', color: '#29b6f6' },
    { key: 'CUTTING_WELDING', label: 'القطع والتجميع واللحام والتجليخ', icon: '⚙️', color: '#ffa726' },
    { key: 'PAINTING', label: 'الطلاء / الدهان', icon: '🎨', color: '#26c6da' },
    { key: 'QUALITY', label: 'مراقبة الجودة', icon: '🔍', color: '#ab47bc' },
    { key: 'COMPLETED', label: 'مكتمل', icon: '✅', color: '#66bb6a' },
];

type Job = {
    id: string;
    serialNo: number;
    name: string;
    status: string;
    stage?: string;
    totalMaterialCost: number;
    totalOperatingCost: number;
    netProfit?: number;
    quantityProduced?: number;
    operatingMarginPct?: number;
    paintCost?: number;
    transportCost?: number;
    createdAt: string;
    completedAt?: string;
    materials: any[];
    expenses: any[];
};

export default function ManufacturingJobsPage() {
    const [inventories, setInventories] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [showStageModal, setShowStageModal] = useState(false);

    const [clients, setClients] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', destinationType: 'INVENTORY', clientId: '', newClientName: '', outputProductId: '', outputProductCode: '', outputProductName: '', outputQuantity: '', operatingMarginPct: '0' });
    const [materials, setMaterials] = useState([{ itemId: '', quantity: 0, unitCost: 0, isMeterCalc: false, metersUsed: '', pieceLength: 6 }]);
    const [showWsModal, setShowWsModal] = useState(false);
    const [expenses, setExpenses] = useState([{ description: '', amount: 0 }]);
    const [extras, setExtras] = useState<ExtraItem[]>([]);
    const [paintItems, setPaintItems] = useState<PaintItem[]>([]);
    const [paintInvoiceId, setPaintInvoiceId] = useState('');
    const [paintCost, setPaintCost] = useState(0);
    const [transportCost, setTransportCost] = useState(0);

    useEffect(() => {
        fetch('/api/inventory').then(r => r.json()).then(d => setInventories(Array.isArray(d) ? d.filter((i: any) => i.type === 'MATERIAL') : []));
        fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
        fetch('/api/sales').then(r => r.json()).then(d => setInvoices(Array.isArray(d) ? d : []));
        fetch('/api/products').then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []));
        fetch('/api/jobs').then(r => r.json()).then(d => setJobs(Array.isArray(d) ? d : []));
    }, []);

    const refreshJobs = () => fetch('/api/jobs').then(r => r.json()).then(d => setJobs(Array.isArray(d) ? d : []));

    const handleMaterialChange = (idx: number, id: string) => {
        const inv: any = inventories.find((i: any) => i.id === id);
        const m = [...materials];
        m[idx].itemId = id;
        m[idx].unitCost = inv?.lastPurchasedPrice || 0;
        if (inv && inv.unit === 'قطعة' && inv.name.includes('طول')) {
            m[idx].isMeterCalc = true;
            const match = inv.name.match(/طول\s*([\d.]+)\s*م/);
            m[idx].pieceLength = match ? parseFloat(match[1]) : 6;
        } else if (inv && (inv.category === 'WORKSHOP' || ['علبة', 'متر', 'كيلو'].includes(inv.unit))) {
            m[idx].isMeterCalc = true;
            m[idx].pieceLength = 1;
        } else {
            m[idx].isMeterCalc = false;
            m[idx].pieceLength = 1;
        }
        setMaterials(m);
    };

    const removeMaterial = (idx: number) => { const m = [...materials]; m.splice(idx, 1); setMaterials(m); };
    const removeExpense = (idx: number) => { const e = [...expenses]; e.splice(idx, 1); setExpenses(e); };
    const addExtra = () => setExtras([...extras, { description: '', quantity: 1, unitPrice: 0 }]);
    const removeExtra = (idx: number) => { const e = [...extras]; e.splice(idx, 1); setExtras(e); };
    const updateExtra = (idx: number, field: keyof ExtraItem, val: string | number) => {
        const e = [...extras]; e[idx] = { ...e[idx], [field]: val }; setExtras(e);
    };
    const addPaintManual = () => setPaintItems([...paintItems, { source: 'manual', productName: '', quantity: 1, color: '', colorCode: '', unitPrice: 0 }]);
    const importFromInvoice = () => {
        const inv = invoices.find((i: any) => i.id === paintInvoiceId) as any;
        if (!inv?.sales?.length) return alert('لا توجد بنود في هذه الفاتورة');
        const newItems: PaintItem[] = inv.sales.map((s: any) => ({
            source: 'invoice', productName: s.product?.name || 'منتج', quantity: s.quantity, color: '', colorCode: '', unitPrice: 0,
        }));
        setPaintItems(prev => [...prev, ...newItems]);
    };
    const updatePaint = (idx: number, field: keyof PaintItem, val: any) => {
        const p = [...paintItems]; p[idx] = { ...p[idx], [field]: val }; setPaintItems(p);
    };
    const removePaint = (idx: number) => { const p = [...paintItems]; p.splice(idx, 1); setPaintItems(p); };

    const totalMaterials = materials.reduce((a, m) => a + m.quantity * m.unitCost, 0);
    const totalOp = expenses.reduce((a, e) => a + Number(e.amount), 0);
    const totalExtras = extras.reduce((a, ex) => a + ex.quantity * ex.unitPrice, 0);
    const totalPaint = paintItems.reduce((a, p) => a + p.quantity * p.unitPrice, 0);
    const baseCost = totalMaterials + totalOp + totalExtras + totalPaint + paintCost + transportCost;
    const marginPct = parseFloat(form.operatingMarginPct) || 0;
    const marginAmount = baseCost * (marginPct / 100);
    const totalCost = baseCost + marginAmount;
    const unitCost = Number(form.outputQuantity) > 0 ? (totalCost / Number(form.outputQuantity)) : totalCost;
    const estimatedProfit = marginAmount;

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (materials.some(m => !m.itemId || m.quantity <= 0)) return alert('يرجى تحديد الخامات والكميات');
        setLoading(true); setSuccess('');

        const paintExpenses = paintItems.filter(p => p.unitPrice > 0).map(p => ({
            description: `دهان: ${p.productName}${p.color ? ` (${p.color})` : ''} × ${p.quantity} قطعة`,
            amount: p.quantity * p.unitPrice,
        }));

        const allExpenses = [
            ...expenses,
            ...extras.map(ex => ({ description: `${ex.description} (${ex.quantity} × ${ex.unitPrice})`, amount: ex.quantity * ex.unitPrice })),
            ...paintExpenses,
            ...(paintCost > 0 ? [{ description: 'مصاريف دهانات', amount: paintCost }] : []),
            ...(transportCost > 0 ? [{ description: 'مصاريف نقل', amount: transportCost }] : []),
        ];

        try {
            const payload = { ...form, materials, expenses: allExpenses, invoiceTotal: null };
            const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (res.ok) {
                setSuccess('✅ تم تسجيل أمر التصنيع بنجاح.');
                setForm({ name: '', destinationType: 'INVENTORY', clientId: '', newClientName: '', outputProductId: '', outputProductCode: '', outputProductName: '', outputQuantity: '', operatingMarginPct: '0' });
                setMaterials([{ itemId: '', quantity: 0, unitCost: 0, isMeterCalc: false, metersUsed: '', pieceLength: 6 }]);
                setExpenses([{ description: '', amount: 0 }]);
                setExtras([]); setPaintItems([]); setPaintInvoiceId('');
                setPaintCost(0); setTransportCost(0);
                refreshJobs();
                setActiveTab('list');
            } else { alert(data.error); }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleUpdateStage = async (jobId: string, newStage: string) => {
        try {
            await fetch('/api/jobs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: jobId, stage: newStage, status: newStage === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS' })
            });
            refreshJobs();
            setShowStageModal(false);
            setSelectedJob(null);
        } catch { }
    };

    const sym = SYM();

    const getStageIndex = (stage?: string) => {
        if (!stage) return 0;
        const idx = STAGES.findIndex(s => s.key === stage);
        return idx >= 0 ? idx : 0;
    };

    const formatDuration = (start: string, end?: string) => {
        if (!end) return 'قيد التنفيذ...';
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffMs = d2.getTime() - d1.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffHrs / 24);
        const remainingHrs = diffHrs % 24;

        let result = '';
        if (days > 0) result += `${days} يوم `;
        if (remainingHrs > 0 || days === 0) result += `و ${remainingHrs} ساعة`;
        return result.trim();
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '1.5rem' }}>
                <h1>القلب النابض — أوامر التصنيع</h1>
                <p>إدارة خطوط الإنتاج وحساب صافي الربح الحقيقي لكل مشروع</p>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                {[{ key: 'new', label: '➕ أمر تصنيع جديد' }, { key: 'list', label: `📋 أوامر التصنيع (${jobs.length})` }].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                        style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${activeTab === t.key ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`, background: activeTab === t.key ? 'color-mix(in srgb, var(--primary-color), transparent 85%)' : 'transparent', color: activeTab === t.key ? 'var(--primary-color)' : '#919398', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {success && <div style={{ background: 'rgba(102,187,106,0.2)', color: '#66bb6a', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>{success}</div>}

            {/* ═══ LIST TAB ═══ */}
            {activeTab === 'list' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>📋 سجل أوامر التصنيع</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {jobs.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>لا توجد أوامر تصنيع بعد</p>}
                        {jobs.map(job => {
                            const stageIdx = getStageIndex(job.stage || (job.status === 'COMPLETED' ? 'COMPLETED' : 'RAW_MATERIAL'));
                            const currentStage = STAGES[stageIdx];
                            return (
                                <div key={job.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ background: 'color-mix(in srgb, var(--primary-color), transparent 85%)', color: 'var(--primary-color)', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>#{job.serialNo}</span>
                                                <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{job.name}</h4>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '4px' }}>{new Date(job.createdAt).toLocaleDateString('ar-EG')}</div>
                                        </div>
                                        <button onClick={() => { setSelectedJob(job); setShowStageModal(true); }}
                                            style={{ padding: '8px 16px', background: `${currentStage.color}22`, border: `1px solid ${currentStage.color}`, color: currentStage.color, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem' }}>
                                            {currentStage.icon} تقدم المرحلة
                                        </button>
                                    </div>

                                    {/* Stage Progress Bar */}
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', alignItems: 'center' }}>
                                        {STAGES.map((stage, i) => (
                                            <React.Fragment key={stage.key}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
                                                        background: i <= stageIdx ? `${stage.color}33` : 'rgba(255,255,255,0.04)',
                                                        border: `2px solid ${i <= stageIdx ? stage.color : 'rgba(255,255,255,0.1)'}`,
                                                        boxShadow: i === stageIdx ? `0 0 12px ${stage.color}66` : 'none',
                                                        transition: 'all 0.3s'
                                                    }}>
                                                        {i < stageIdx ? '✓' : stage.icon}
                                                    </div>
                                                    <span style={{ fontSize: '0.6rem', color: i <= stageIdx ? stage.color : '#555', textAlign: 'center', lineHeight: 1.2 }}>{stage.label}</span>
                                                </div>
                                                {i < STAGES.length - 1 && (
                                                    <div style={{ height: '2px', flex: 1, background: i < stageIdx ? '#66bb6a' : 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '20px', transition: 'background 0.3s' }} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* الحالة والتكاليف */}
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: currentStage.color + '22', color: currentStage.color }}>
                                            {currentStage.icon} {currentStage.label} — {job.status === 'COMPLETED' ? 'مكتمل' : 'نشط'}
                                        </span>
                                        {job.status === 'COMPLETED' && job.completedAt && (
                                            <span style={{ color: '#66bb6a', fontSize: '0.82rem', fontWeight: 700, background: 'rgba(102,187,106,0.1)', padding: '3px 10px', borderRadius: '20px' }}>
                                                ⏱ استغرق: {formatDuration(job.createdAt, job.completedAt)}
                                            </span>
                                        )}
                                        <span style={{ color: '#919398', fontSize: '0.82rem' }}>🔩 خامات: <strong style={{ color: '#29b6f6' }}>{job.totalMaterialCost?.toFixed(0)} {sym}</strong></span>
                                        <span style={{ color: '#919398', fontSize: '0.82rem' }}>⚙️ تشغيل: <strong style={{ color: '#ffa726' }}>{job.totalOperatingCost?.toFixed(0)} {sym}</strong></span>
                                        <span style={{ color: '#919398', fontSize: '0.82rem' }}>📊 ربح: <strong style={{ color: '#66bb6a' }}>{job.netProfit?.toFixed(0) || 0} {sym}</strong></span>
                                    </div>

                                    {/* ملخص التكاليف أسفل البطاقة */}
                                    <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '8px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>مصاريف تشغيل</div>
                                            <div style={{ fontWeight: 700, color: '#ffa726' }}>{job.totalOperatingCost?.toFixed(0)} {sym}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>إجمالي التكلفة</div>
                                            <div style={{ fontWeight: 700, color: '#29b6f6' }}>{(job.totalMaterialCost + job.totalOperatingCost)?.toFixed(0)} {sym}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '8px' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>التكلفة الكلية مع الخامات</div>
                                            <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1rem' }}>{(job.totalMaterialCost + job.totalOperatingCost + (job.netProfit || 0))?.toFixed(0)} {sym}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ NEW JOB FORM TAB ═══ */}
            {activeTab === 'new' && (
                <form onSubmit={handleCreateJob} className="glass-panel">

                    {/* ═══ 1. بيانات أمر التصنيع ═══ */}
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>1. بيانات أمر التصنيع</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px,1fr) minmax(250px,1fr) 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <label htmlFor="job_name">اسم وصف الشغلانة</label>
                            <input id="job_name" type="text" className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="ستاند عرض حديد لكارفور.." title="اسم أمر التصنيع" />
                        </div>
                        <div>
                            <label htmlFor="destinationType">توجيه الطلب</label>
                            <select id="destinationType" className="input-glass" value={form.destinationType} onChange={e => setForm({ ...form, destinationType: e.target.value, clientId: '', newClientName: '' })} title="وجهة الطلب">
                                <option value="INVENTORY">طرح في المخزن الذكي</option>
                                <option value="SAVED_CLIENT">تسليم لعميل محفوظ</option>
                                <option value="NEW_CLIENT">تسليم لعميل جديد</option>
                            </select>
                            {form.destinationType === 'SAVED_CLIENT' && (
                                <>
                                    <label htmlFor="client_sel" className="sr-only">اختر العميل</label>
                                    <select id="client_sel" title="اختر العميل" className="input-glass" style={{ marginTop: '5px' }} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                                        <option value="">- اختر العميل -</option>
                                        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </>
                            )}
                            {form.destinationType === 'NEW_CLIENT' && (
                                <>
                                    <label htmlFor="new_client_name" className="sr-only">اسم العميل الجديد</label>
                                    <input id="new_client_name" type="text" className="input-glass" style={{ marginTop: '5px' }} value={form.newClientName} onChange={e => setForm({ ...form, newClientName: e.target.value })} required placeholder="اسم العميل الجديد" />
                                </>
                            )}
                        </div>
                        <div>
                            <label htmlFor="outputProductId">المنتج المصنع</label>
                            <select id="outputProductId" className="input-glass" value={form.outputProductId} onChange={e => setForm({ ...form, outputProductId: e.target.value, outputProductName: '', outputProductCode: '' })} title="المنتج النهائي">
                                <option value="">+ منتج جديد (أدخل بالأسفل)</option>
                                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                            </select>
                            {!form.outputProductId && (
                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                    <label htmlFor="prod_code" className="sr-only">كود المنتج</label>
                                    <input id="prod_code" type="text" title="كود المنتج" className="input-glass" style={{ width: '80px' }} value={form.outputProductCode} onChange={e => setForm({ ...form, outputProductCode: e.target.value })} placeholder="كود" />
                                    <label htmlFor="prod_name" className="sr-only">اسم المنتج</label>
                                    <input id="prod_name" type="text" title="اسم المنتج" className="input-glass" style={{ flex: 1 }} value={form.outputProductName} onChange={e => setForm({ ...form, outputProductName: e.target.value })} placeholder="اسم المنتج" required />
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="outputQuantity">الكمية المنتجة</label>
                            <input id="outputQuantity" type="number" min="0.01" step="any" className="input-glass" value={form.outputQuantity} onChange={e => setForm({ ...form, outputQuantity: e.target.value })} required title="الكمية الإجمالية" />
                        </div>
                    </div>

                    {/* ═══ 2. الخامات ═══ */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ color: '#29b6f6', margin: 0 }}>2. خامات ومستلزمات</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowWsModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: '#8d6e63' }}>+ ورشة سريعة</button>
                                <button type="button" onClick={() => setMaterials([...materials, { itemId: '', quantity: 0, unitCost: 0, isMeterCalc: false, metersUsed: '', pieceLength: 6 }])} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>+ إضافة خامة</button>
                            </div>
                        </div>
                        {materials.map((m, idx) => {
                            const inv: any = inventories.find((i: any) => i.id === m.itemId);
                            return (
                                <div key={idx} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(41,182,246,0.1)' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label htmlFor={`mat-${idx}`}>الخامة</label>
                                            <select id={`mat-${idx}`} className="input-glass" value={m.itemId} onChange={e => handleMaterialChange(idx, e.target.value)} required title="اختر الخامة">
                                                <option value="">- اختر الخامة -</option>
                                                {inventories.map((i: any) => <option key={i.id} value={i.id}>{i.name} (متوفر: {Math.round(i.stock)} {i.unit})</option>)}
                                            </select>
                                            {m.itemId && (
                                                <label htmlFor={`mat-det-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '8px', fontSize: '0.8rem', color: '#919398' }}>
                                                    <input id={`mat-det-${idx}`} type="checkbox" title="تفعيل الإدخال التفصيلي" checked={m.isMeterCalc} onChange={e => { const n = [...materials]; n[idx].isMeterCalc = e.target.checked; setMaterials(n); }} style={{ accentColor: '#29b6f6' }} />
                                                    إدخال تفصيلي (متر/علبة..)
                                                </label>
                                            )}
                                        </div>
                                        {m.isMeterCalc ? (
                                            <>
                                                <div style={{ width: '120px' }}>
                                                    <label htmlFor={`content-${idx}`}>محتوى العبوة</label>
                                                    <input id={`content-${idx}`} type="number" step="any" className="input-glass" value={m.pieceLength || ''} onChange={e => { const n = [...materials]; n[idx].pieceLength = parseFloat(e.target.value) || 1; if (n[idx].metersUsed) n[idx].quantity = Number(n[idx].metersUsed) / n[idx].pieceLength; setMaterials(n); }} required title="طول القطعة أو سعة العبوة" />
                                                </div>
                                                <div style={{ width: '120px' }}>
                                                    <label htmlFor={`usage-${idx}`}>الاستهلاك الفعلي</label>
                                                    <input id={`usage-${idx}`} type="number" step="any" className="input-glass" value={m.metersUsed} onChange={e => { const n = [...materials]; n[idx].metersUsed = e.target.value; n[idx].quantity = (parseFloat(e.target.value) || 0) / n[idx].pieceLength; setMaterials(n); }} title="الاستهلاك بالأطوال أو الأوزان" />
                                                </div>
                                                <div style={{ width: '90px' }}>
                                                    <span style={{ display: 'block', fontSize: '0.82rem', color: '#919398', marginBottom: '8px' }}>المسحوب</span>
                                                    <div style={{ padding: '0.75rem 0', color: '#999', fontSize: '0.9rem' }}>{parseFloat(Number(m.quantity || 0).toFixed(4))}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ width: '110px' }}>
                                                <label htmlFor={`qty-${idx}`}>الكمية ({inv ? inv.unit : '...'})</label>
                                                <input id={`qty-${idx}`} type="number" step="any" className="input-glass" value={m.quantity === 0 ? '' : m.quantity} onChange={e => { const n = [...materials]; n[idx].quantity = parseFloat(e.target.value) || 0; setMaterials(n); }} required title="الكمية المطلوبة" />
                                            </div>
                                        )}
                                        <div style={{ width: '110px' }}>
                                            <label htmlFor={`ucost-${idx}`}>سعر الوحدة</label>
                                            <input id={`ucost-${idx}`} type="number" step="any" className="input-glass" value={isNaN(m.unitCost) ? 0 : m.unitCost} onChange={e => { const n = [...materials]; n[idx].unitCost = parseFloat(e.target.value) || 0; setMaterials(n); }} required title="تكلفة الوحدة" />
                                        </div>
                                        <div style={{ width: '90px' }}>
                                            <span style={{ display: 'block', fontSize: '0.82rem', color: '#919398', marginBottom: '8px' }}>الإجمالي</span>
                                            <div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#29b6f6' }}>{Math.round(m.unitCost * m.quantity)}</div>
                                        </div>
                                        {materials.length > 1 && (
                                            <button type="button" onClick={() => removeMaterial(idx)} style={{ padding: '10px', background: '#E35E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="حذف الخامة">حذف</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ═══ 3. بنود إضافية ═══ */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#ab47bc', margin: 0 }}>3. بنود إضافية</h3>
                            <button type="button" onClick={addExtra} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: '#ab47bc' }}>+ إضافة بند</button>
                        </div>
                        {extras.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>لا توجد بنود — اضغط لإضافة (اكسسوارات، نقل..)</p>}
                        {extras.map((ex, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '10px', background: 'rgba(171,71,188,0.05)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ flex: 1 }}><label htmlFor={`ex-desc-${idx}`}>البيان</label><input id={`ex-desc-${idx}`} type="text" className="input-glass" value={ex.description} onChange={e => updateExtra(idx, 'description', e.target.value)} required title="وصف البند" /></div>
                                <div style={{ width: '100px' }}><label htmlFor={`ex-qty-${idx}`}>الكمية</label><input id={`ex-qty-${idx}`} type="number" step="any" min="0.001" className="input-glass" value={ex.quantity} onChange={e => updateExtra(idx, 'quantity', parseFloat(e.target.value))} required title="الكمية" /></div>
                                <div style={{ width: '120px' }}><label htmlFor={`ex-price-${idx}`}>سعر الوحدة</label><input id={`ex-price-${idx}`} type="number" step="any" className="input-glass" value={ex.unitPrice} onChange={e => updateExtra(idx, 'unitPrice', parseFloat(e.target.value))} required title="سعر الوحدة" /></div>
                                <div style={{ width: '100px' }}><span style={{ display: 'block', fontSize: '0.82rem', color: '#919398', marginBottom: '8px' }}>الإجمالي</span><div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#ab47bc' }}>{(ex.quantity * ex.unitPrice).toFixed(0)}</div></div>
                                <button type="button" onClick={() => removeExtra(idx)} style={{ padding: '10px', background: '#E35E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>حذف</button>
                            </div>
                        ))}
                    </div>

                    {/* ═══ 4. قسم الدهان ═══ */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#26c6da', margin: 0 }}>4. 🎨 قسم الدهان</h3>
                            <button type="button" onClick={addPaintManual} style={{ padding: '6px 14px', background: 'rgba(38,198,218,0.12)', border: '1px solid #26c6da', color: '#26c6da', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+ إضافة منتج</button>
                        </div>
                        <div style={{ background: 'rgba(38,198,218,0.05)', border: '1px solid rgba(38,198,218,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                            <p style={{ color: '#26c6da', fontWeight: 600, margin: '0 0 10px', fontSize: '0.88rem' }}>📋 استيراد من فاتورة مبيعات:</p>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="paintInvoiceSelect">اختر الفاتورة</label>
                                    <select id="paintInvoiceSelect" className="input-glass" value={paintInvoiceId} onChange={e => setPaintInvoiceId(e.target.value)} title="استيراد بنود من فاتورة">
                                        <option value="">- اختر فاتورة -</option>
                                        {invoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNo} - {inv.client?.name || 'بدون عميل'}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={importFromInvoice} disabled={!paintInvoiceId} style={{ padding: '0.75rem 20px', background: paintInvoiceId ? '#26c6da' : '#555', color: '#fff', border: 'none', borderRadius: '8px', cursor: paintInvoiceId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 700 }}>⬇ جلب المنتجات</button>
                            </div>
                        </div>
                        {paintItems.length > 0 && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 120px 140px 100px 110px 48px', gap: '8px', padding: '8px 10px', background: 'rgba(38,198,218,0.1)', borderRadius: '8px', marginBottom: '6px', fontSize: '0.8rem', color: '#26c6da', fontWeight: 600 }}>
                                    <span>اسم المنتج</span><span>الكمية</span><span>اللون</span><span>كود اللون</span><span>سعر الدهان/قطعة</span><span>الإجمالي</span><span></span>
                                </div>
                                {paintItems.map((p, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 120px 140px 100px 110px 48px', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px 10px', background: 'rgba(38,198,218,0.03)', borderRadius: '8px', border: '1px solid rgba(38,198,218,0.08)' }}>
                                        <input type="text" title="اسم المنتج" id={`p-name-${idx}`} className="input-glass" value={p.productName} onChange={e => updatePaint(idx, 'productName', e.target.value)} readOnly={p.source === 'invoice'} />
                                        <input type="number" title="الكمية" id={`p-qty-${idx}`} step="any" className="input-glass" value={p.quantity} onChange={e => updatePaint(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                                        <input type="text" title="اللون" id={`p-clr-${idx}`} className="input-glass" value={p.color} onChange={e => updatePaint(idx, 'color', e.target.value)} placeholder="أبيض.." />
                                        <input type="text" title="كود اللون" id={`p-code-${idx}`} className="input-glass" value={p.colorCode} onChange={e => updatePaint(idx, 'colorCode', e.target.value)} placeholder="#FFFFFF" />
                                        <input type="number" title="سعر وحدة الدهان" id={`p-uprice-${idx}`} step="any" className="input-glass" value={p.unitPrice} onChange={e => updatePaint(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                        <div style={{ fontWeight: 'bold', color: '#26c6da', textAlign: 'center' }}>{(p.quantity * p.unitPrice).toFixed(0)}</div>
                                        <button type="button" onClick={() => removePaint(idx)} title="حذف البند" style={{ padding: '8px', background: 'rgba(227,94,53,0.1)', color: '#E35E35', border: '1px solid rgba(227,94,53,0.3)', borderRadius: '6px', cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ═══ 5. تكاليف التشغيل ═══ */}
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#ffa726', margin: 0 }}>5. تكاليف التشغيل المباشرة</h3>
                            <button type="button" onClick={() => setExpenses([...expenses, { description: '', amount: 0 }])} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>+ تشغيلة</button>
                        </div>
                        <datalist id="expensePresets">
                            <option value="قطع ليزر" /><option value="درفلة ومونتاج" /><option value="نقل وتحميل" /><option value="دهان الكتروستاتيك" />
                        </datalist>
                        {expenses.map((ex, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}><label htmlFor={`exp-desc-${idx}`}>نوع التكلفة</label><input id={`exp-desc-${idx}`} type="text" list="expensePresets" className="input-glass" value={ex.description} onChange={e => { const n = [...expenses]; n[idx].description = e.target.value; setExpenses(n); }} required placeholder="قطع ليزر ورشة محمد" title="وصف التكلفة" /></div>
                                <div><label htmlFor={`exp-amt-${idx}`}>التكلفة ({sym})</label><input id={`exp-amt-${idx}`} type="number" step="any" className="input-glass" value={ex.amount} onChange={e => { const n = [...expenses]; n[idx].amount = parseFloat(e.target.value); setExpenses(n); }} required title="قيمة التكلفة" /></div>
                                {expenses.length > 1 && <button type="button" onClick={() => removeExpense(idx)} style={{ padding: '10px', background: '#E35E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>حذف</button>}
                            </div>
                        ))}

                        {/* مصاريف الدهانات والنقل */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div>
                                <label htmlFor="paintCost">🎨 مصاريف دهانات ({sym})</label>
                                <input id="paintCost" type="number" step="any" min="0" className="input-glass" value={paintCost || ''} onChange={e => setPaintCost(parseFloat(e.target.value) || 0)} placeholder="0" title="إجمالي مصاريف الدهان" />
                            </div>
                            <div>
                                <label htmlFor="transportCost">🚛 مصاريف نقل ({sym})</label>
                                <input id="transportCost" type="number" step="any" min="0" className="input-glass" value={transportCost || ''} onChange={e => setTransportCost(parseFloat(e.target.value) || 0)} placeholder="0" title="إجمالي مصاريف النقل" />
                            </div>
                        </div>
                    </div>

                    {/* ═══ 6. ملخص التكاليف ═══ */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                <span style={{ color: '#919398', fontSize: '0.9rem' }}>🔩 خامات: <strong style={{ color: '#29b6f6' }}>{totalMaterials.toFixed(0)} {sym}</strong></span>
                                <span style={{ color: '#919398', fontSize: '0.9rem' }}>🎨 دهان: <strong style={{ color: '#26c6da' }}>{totalPaint.toFixed(0)} {sym}</strong></span>
                                <span style={{ color: '#919398', fontSize: '0.9rem' }}>⚙️ تشغيل: <strong style={{ color: '#ffa726' }}>{totalOp.toFixed(0)} {sym}</strong></span>
                                <span style={{ color: '#919398', fontSize: '0.9rem' }}>🎨 دهانات إضافية: <strong style={{ color: '#26c6da' }}>{paintCost.toFixed(0)} {sym}</strong></span>
                                <span style={{ color: '#919398', fontSize: '0.9rem' }}>🚛 نقل: <strong style={{ color: '#ab47bc' }}>{transportCost.toFixed(0)} {sym}</strong></span>
                            </div>

                            <div style={{ marginBottom: '16px', padding: '14px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'inline-block' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: '#ccc', marginBottom: '8px', fontWeight: 'bold' }}>المارجن الربحي</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>%</span>
                                        <input type="number" title="النسبة المئوية للمارجن" step="any" min="0" className="input-glass" style={{ width: '80px', textAlign: 'center' }} value={form.operatingMarginPct} onChange={e => setForm({ ...form, operatingMarginPct: e.target.value })} />
                                    </div>
                                    <span style={{ color: '#555' }}>⇄</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>مبلغ ({sym})</span>
                                        <input type="number" title="قيمة المارجن بالمبلغ" step="any" min="0" className="input-glass" style={{ width: '100px', textAlign: 'center', color: '#ffb74d' }} value={marginAmount > 0 ? Number(marginAmount.toFixed(0)) : ''} placeholder="0" onChange={e => { const amount = parseFloat(e.target.value) || 0; const newPct = baseCost > 0 ? (amount / baseCost) * 100 : 0; setForm({ ...form, operatingMarginPct: String(newPct) }); }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '10px', marginTop: '10px' }}>
                                <div style={{ padding: '10px 14px', background: 'rgba(41,182,246,0.1)', borderRadius: '10px', border: '1px solid rgba(41,182,246,0.2)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#919398' }}>إجمالي التكلفة</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4fc3f7' }}>{totalCost.toFixed(0)} {sym}</div>
                                </div>
                                <div style={{ padding: '10px 14px', background: 'rgba(102,187,106,0.1)', borderRadius: '10px', border: '1px solid rgba(102,187,106,0.2)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#919398' }}>التكلفة الكلية مع الخامات</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#66bb6a' }}>{(totalMaterials + totalOp + totalExtras + totalPaint + paintCost + transportCost).toFixed(0)} {sym}</div>
                                </div>
                                {Number(form.outputQuantity) > 0 && (
                                    <div style={{ padding: '10px 14px', background: 'rgba(171,71,188,0.1)', borderRadius: '10px', border: '1px solid rgba(171,71,188,0.2)' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#919398' }}>سعر تكلفة الوحدة</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ab47bc' }}>{unitCost.toFixed(0)} {sym}</div>
                                    </div>
                                )}
                                <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--primary-color), transparent 90%)', borderRadius: '10px', border: '1px solid color-mix(in srgb, var(--primary-color), transparent 80%)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#919398' }}>صافي الربح التقديري</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>{estimatedProfit.toFixed(0)} {sym}</div>
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '1.5rem 2.5rem', fontSize: '1.2rem', boxShadow: `0 5px 20px color-mix(in srgb, var(--primary-color), transparent 75%)`, borderRadius: '12px' }}>
                            {loading ? 'جاري التسجيل..' : 'تأكيد أمر التصنيع ✔'}
                        </button>
                    </div>
                </form>
            )}

            {/* ═══ WORKSHOP MODAL ═══ */}
            {showWsModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowWsModal(false)}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: '#8d6e63', margin: 0 }}>مستلزمات الورشة السريعة</h3>
                            <button onClick={() => setShowWsModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                            {inventories.filter((i: any) => i.category !== 'RAW_MATERIAL' && !i.name.includes('حديد') && !i.name.includes('ستانلس') && !i.name.includes('صاج')).map((inv: any) => (
                                <button key={inv.id} type="button" onClick={() => {
                                    const newMaterial = { itemId: inv.id, quantity: 0, unitCost: inv.lastPurchasedPrice || 0, isMeterCalc: true, metersUsed: '', pieceLength: 1 };
                                    setMaterials(prev => [...prev, newMaterial]);
                                    setShowWsModal(false);
                                }} style={{ padding: '12px', background: 'rgba(141,110,99,0.1)', border: '1px solid #8d6e63', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>{inv.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#caa596' }}>{Math.round(inv.stock)} {inv.unit}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ STAGE MODAL ═══ */}
            {showStageModal && selectedJob && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowStageModal(false)}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>تحديث مرحلة التصنيع</h3>
                                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>{selectedJob.name}</p>
                            </div>
                            <button onClick={() => setShowStageModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {STAGES.map((stage, i) => {
                                const currentIdx = getStageIndex(selectedJob.stage || (selectedJob.status === 'COMPLETED' ? 'COMPLETED' : 'RAW_MATERIAL'));
                                const isCurrent = i === currentIdx;
                                const isPast = i < currentIdx;
                                return (
                                    <button key={stage.key} onClick={() => handleUpdateStage(selectedJob.id, stage.key)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
                                            background: isCurrent ? `${stage.color}22` : isPast ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                                            border: `2px solid ${isCurrent ? stage.color : isPast ? stage.color + '44' : 'rgba(255,255,255,0.08)'}`,
                                            borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', color: '#fff',
                                            transition: 'all 0.2s'
                                        }}>
                                        <span style={{ fontSize: '1.5rem' }}>{stage.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: isCurrent ? stage.color : '#fff' }}>{stage.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{isCurrent ? '← المرحلة الحالية' : isPast ? 'مكتملة' : 'قادمة'}</div>
                                        </div>
                                        {isCurrent && (
                                            <span style={{ padding: '3px 10px', background: stage.color, color: '#fff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>نشط</span>
                                        )}
                                        {isPast && (
                                            <span style={{ color: '#66bb6a', fontSize: '1.2rem' }}>✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
