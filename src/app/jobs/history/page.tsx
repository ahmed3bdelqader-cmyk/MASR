'use client';
import React, { useEffect, useState } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/lib/reportTemplate';

import { Search, ChevronDown, Check, X } from 'lucide-react';

type ExtraItem = { description: string; quantity: number; unitPrice: number };
type PaintItem = {
    source: 'manual' | 'invoice';
    productName: string;
    quantity: number;
    color: string;
    colorCode: string;
    unitPrice: number;
};

// ─── SearchableSelect Component ──────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder, title, required, style }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selected = options.find((o: any) => o.id === value);
    const filtered = options.filter((o: any) =>
        (o.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.code || '').toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="searchable-select" style={style}>
            <div
                className={`input-glass select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`text-ellipsis selected-text ${!selected ? 'placeholder' : ''}`}>
                    {selected ? `${selected.name}${selected.code ? ` (${selected.code})` : ''}` : (placeholder || 'اختر...')}
                </span>
                <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
            </div>

            {isOpen && (
                <div className="glass-panel dropdown-menu animate-slide-up">
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="input-glass search-field"
                            autoFocus
                            placeholder="ابحث هنا..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div className="options-list">
                        {filtered.length === 0 && <div className="no-results">لا توجد نتائج</div>}
                        {filtered.map((opt: any) => (
                            <div
                                key={opt.id}
                                className={`option-item ${value === opt.id ? 'active' : ''}`}
                                onClick={() => {
                                    onChange(opt.id);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                <span className="option-name">
                                    {opt.name}{opt.code ? ` (${opt.code})` : ''}
                                </span>
                                {value === opt.id && <Check size={14} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .searchable-select {
                    position: relative;
                    width: 100%;
                }
                .select-trigger {
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    min-height: 44px;
                    transition: all 0.2s;
                }
                .select-trigger.open {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(227, 94, 53, 0.15);
                }
                .selected-text {
                    color: var(--text-primary);
                }
                .selected-text.placeholder {
                    color: var(--text-muted);
                }
                .chevron-icon {
                    transition: transform 0.2s;
                    opacity: 0.5;
                }
                .chevron-icon.rotated {
                    transform: rotate(180deg);
                }
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    z-index: 2100;
                    padding: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.12);
                }
                .search-input-wrapper {
                    position: relative;
                    margin-bottom: 10px;
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.5;
                }
                .search-field {
                    padding-left: 35px;
                    font-size: 0.85rem;
                }
                .options-list {
                    max-height: 240px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding-right: 4px;
                }
                /* Custom scrollbar for options-list */
                .options-list::-webkit-scrollbar {
                    width: 4px;
                }
                .options-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                .no-results {
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 0.85rem;
                }
                .option-item {
                    padding: 10px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.88rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                    color: var(--text-primary);
                    background: transparent;
                }
                .option-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .option-item.active {
                    background: var(--primary-color) !important;
                    color: #fff !important;
                }
                .option-name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
    const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [showStageModal, setShowStageModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5);

    const [clients, setClients] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', destinationType: 'INVENTORY', clientId: '', newClientName: '', outputProductId: '', outputProductCode: '', outputProductName: '', outputQuantity: '', operatingMarginPct: '0' });
    const [materials, setMaterials] = useState([{ categoryType: 'RAW_MATERIAL', itemId: '', quantity: 0, unitCost: 0, isMeterCalc: false, metersUsed: '', pieceLength: 6 }]);
    const [showWsModal, setShowWsModal] = useState(false);
    const [expenses, setExpenses] = useState([{ description: '', amount: 0, supplierId: '' }]);
    const [extras, setExtras] = useState<ExtraItem[]>([]);
    const [paintItems, setPaintItems] = useState<PaintItem[]>([]);
    const [paintInvoiceId, setPaintInvoiceId] = useState('');
    const [paintSupplierId, setPaintSupplierId] = useState('');
    const [paintCost, setPaintCost] = useState(0);
    const [transportCost, setTransportCost] = useState(0);
    const [suppliers, setSuppliers] = useState<{ id: string, name: string, type: string }[]>([]);

    useEffect(() => {
        fetch('/api/inventory').then(r => r.json()).then(d => setInventories(Array.isArray(d) ? d.filter((i: any) => i.type === 'MATERIAL') : [])).catch(e => console.error('Failed to fetch inventory:', e));
        fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(e => console.error('Failed to fetch clients:', e));
        fetch('/api/sales').then(r => r.json()).then(d => setInvoices(Array.isArray(d) ? d : [])).catch(e => console.error('Failed to fetch sales:', e));
        fetch('/api/products').then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : [])).catch(e => console.error('Failed to fetch products:', e));
        fetch('/api/jobs').then(r => r.json()).then(d => setJobs(Array.isArray(d) ? d : [])).catch(e => console.error('Failed to fetch jobs:', e));
        fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliers(Array.isArray(d) ? d : [])).catch(e => console.error('Failed to fetch suppliers:', e));

        const saved = localStorage.getItem('erp_jobs_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const refreshJobs = () => fetch('/api/jobs').then(r => r.json()).then(d => setJobs(Array.isArray(d) ? d : [])).catch(e => console.error('Failed to refresh jobs:', e));

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_jobs_pageSize', val);
        setCurrentPage(1);
    };

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

        // مصاريف التشغيل فقط (الدهان يُرسَل منفصلاً كـ paintItems)
        const allExpenses = [
            ...expenses,
            ...extras.map(ex => ({ description: `${ex.description} (${ex.quantity} × ${ex.unitPrice})`, amount: ex.quantity * ex.unitPrice, supplierId: null })),
            ...(paintCost > 0 ? [{ description: 'مصاريف دهانات إضافية', amount: paintCost, supplierId: paintSupplierId || null }] : []),
            ...(transportCost > 0 ? [{ description: 'مصاريف نقل', amount: transportCost, supplierId: null }] : []),
        ];

        try {
            // paintItems تُرسَل بشكل مستقل — ستُحفظ كـ PaintEntry بحالة PENDING_PAYMENT
            const payload = { ...form, materials, expenses: allExpenses, paintItems: paintItems.map(p => ({ ...p, supplierId: paintSupplierId })), invoiceTotal: null };
            const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (res.ok) {
                const pendingPaintCount = paintItems.filter(p => p.unitPrice > 0).length;
                setSuccess(`✅ تم تسجيل أمر التصنيع بنجاح.${pendingPaintCount > 0 ? ` — ${pendingPaintCount} بند دهان معلق في صفحة قسم الدهانات` : ''}`);
                setForm({ name: '', destinationType: 'INVENTORY', clientId: '', newClientName: '', outputProductId: '', outputProductCode: '', outputProductName: '', outputQuantity: '', operatingMarginPct: '0' });
                setMaterials([{ categoryType: 'RAW_MATERIAL', itemId: '', quantity: 0, unitCost: 0, isMeterCalc: false, metersUsed: '', pieceLength: 6 }]);
                setExpenses([{ description: '', amount: 0, supplierId: '' }]);
                setExtras([]); setPaintItems([]); setPaintInvoiceId(''); setPaintSupplierId('');
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

    // ── طباعة تقرير مجمع ──
    const handlePrintAggregated = async (data: Job[]) => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';

        const rowsHtml = data.map(j => `
            <tr>
                <td>#${j.serialNo}</td>
                <td style="text-align: right;">${j.name}</td>
                <td>${j.quantityProduced || 0}</td>
                <td>${STAGES.find(s => s.key === (j.stage || 'RAW_MATERIAL'))?.label || 'قيد التنفيذ'}</td>
                <td style="text-align: center; font-weight: 700;">${j.totalMaterialCost.toLocaleString('en-US')} ${symVal}</td>
                <td style="text-align: center; font-weight: 700;">${j.totalOperatingCost.toLocaleString('en-US')} ${symVal}</td>
                <td style="text-align: center; font-weight: 800; color: #166534;">${(j.netProfit || 0).toLocaleString('en-US')} ${symVal}</td>
            </tr>
        `).join('');

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 5px;">إجمالي خامات</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${data.reduce((s, j) => s + j.totalMaterialCost, 0).toLocaleString('en-US')} ${symVal}</div>
                </div>
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 5px;">إجمالي تشغيل</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${data.reduce((s, j) => s + j.totalOperatingCost, 0).toLocaleString('en-US')} ${symVal}</div>
                </div>
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 5px;">إجمالي أرباح</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #166534;">${data.reduce((s, j) => s + (j.netProfit || 0), 0).toLocaleString('en-US')} ${symVal}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>الكود</th><th style="text-align: right;">البيان</th><th>الكمية</th><th>الحالة</th><th>تكلفة الخامات</th><th>تكلفة التشغيل</th><th>الربح</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        const html = generatePrintHtml(bodyHtml, "تقرير مجمع لأوامر التصنيع", config);

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

    // ── طباعة تقرير مفصل لأمر واحد ──
    const handlePrintDetailed = async (job: Job) => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';

        const bodyHtml = `
            <style>
                .job-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
                .meta-card { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
                .meta-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
                .meta-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
            </style>

            <div class="job-meta-grid">
                <div class="meta-card">
                    <div class="meta-label">امر تصنيع</div>
                    <div class="meta-value">${job.name}</div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">سيريال: #${job.serialNo}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-label">الحالة والمواعيد</div>
                    <div class="meta-value">${STAGES.find(s => s.key === (job.stage || 'RAW_MATERIAL'))?.label || 'قيد التنفيذ'}</div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">تاريخ البدء: ${new Date(job.createdAt).toLocaleDateString('ar-EG')}</div>
                </div>
            </div>

            <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 12px; border-right: 4px solid #3b82f6; padding-right: 10px;">📦 الخامات والمستلزمات</h3>
            <table>
                <thead>
                    <tr><th style="text-align: right;">الخامة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
                </thead>
                <tbody>
                    ${job.materials?.length ? job.materials.map((m: any) => `
                        <tr>
                            <td style="text-align: right;">${m.item?.name || 'خامة'}</td>
                            <td>${m.quantity}</td>
                            <td>${m.unitCost.toLocaleString('en-US')}</td>
                            <td>${m.totalCost.toLocaleString('en-US')}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4">لا توجد خامات مسجلة</td></tr>'}
                </tbody>
            </table>

            <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 12px; border-right: 4px solid #f59e0b; padding-right: 10px; margin-top: 25px;">⚙️ تكاليف التشغيل والخدمات</h3>
            <table>
                <thead>
                    <tr><th style="text-align: right;">البيان / الوصف</th><th>المورد</th><th>القيمة</th></tr>
                </thead>
                <tbody>
                    ${job.expenses?.length ? job.expenses.map((e: any) => `
                        <tr>
                            <td style="text-align: right;">${e.description}</td>
                            <td>${e.supplierId ? 'مورد محفوظ' : 'كاش'}</td>
                            <td>${e.amount.toLocaleString('en-US')}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3">لا توجد تكاليف تشغيل إضافية</td></tr>'}
                </tbody>
            </table>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px;">
                <div style="padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #64748b;">تكلفة الخامات</div>
                    <div style="font-size: 1.1rem; font-weight: 800;">${job.totalMaterialCost.toLocaleString('en-US')} ${symVal}</div>
                </div>
                <div style="padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #64748b;">تكلفة التشغيل</div>
                    <div style="font-size: 1.1rem; font-weight: 800;">${job.totalOperatingCost.toLocaleString('en-US')} ${symVal}</div>
                </div>
                <div style="grid-column: span 2; padding: 15px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; text-align: center;">
                    <div style="font-size: 0.85rem; color: #1e40af; font-weight: 800;">الربح التقديري</div>
                    <div style="font-size: 1.4rem; font-weight: 900; color: #166534;">${(job.netProfit || 0).toLocaleString('en-US')} ${symVal}</div>
                </div>
            </div>
        `;

        const html = generatePrintHtml(bodyHtml, `تقرير أمر تصنيع مفصل - ${job.name}`, config);

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
    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(jobs.length / (pageSize as number));
    const paginatedJobs = React.useMemo(() => {
        if (pageSize === 'ALL') return jobs;
        const start = (currentPage - 1) * (pageSize as number);
        return jobs.slice(start, start + (pageSize as number));
    }, [jobs, currentPage, pageSize]);

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">🏭 القلب النابض — أوامر التصنيع</h1>
                    <p className="page-subtitle">إدارة خطوط الإنتاج وحساب صافي الربح الحقيقي لكل مشروع بدقة</p>
                </div>
            </header>

            {/* ══ TABS ══ */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '12px', width: 'fit-content' }}>
                <button
                    onClick={() => setActiveTab('new')}
                    className={`btn-modern ${activeTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ background: activeTab === 'new' ? '#ab47bc' : 'transparent', border: 'none', color: activeTab === 'new' ? '#fff' : '#888', padding: '8px 24px' }}>
                    أمر التصنيع
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`btn-modern ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', alignItems: 'center', background: activeTab === 'list' ? '#66bb6a' : 'transparent', border: 'none', color: activeTab === 'list' ? '#fff' : '#888', padding: '8px 24px' }}>
                    سجل أوامر التصنيع
                    <span style={{ marginRight: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{jobs.length}</span>
                </button>
            </div>

            <div>
                <div className="main-content-area">
                    {success && (
                        <div className="sh-badge paid animate-fade-in success-notification">
                            {success}
                        </div>
                    )}

                    {/* ═══ LIST TAB ═══ */}
                    {activeTab === 'list' && (
                        <div className="glass-panel jobs-list-container">
                            <div className="list-toolbar">
                                <h3 className="section-title">📋 سجل أوامر التصنيع</h3>
                                <button onClick={() => handlePrintAggregated(jobs)} className="btn-modern btn-primary">🖨️ طباعة تقرير مجمع</button>
                            </div>
                            <div className="jobs-cards-stack">
                                {jobs.length === 0 && <p className="empty-list-txt">لا توجد أوامر تصنيع بعد</p>}
                                {paginatedJobs.map(job => {
                                    const stageIdx = getStageIndex(job.stage || (job.status === 'COMPLETED' ? 'COMPLETED' : 'RAW_MATERIAL'));
                                    const currentStage = STAGES[stageIdx];
                                    return (
                                        <div key={job.id} className="job-card-wrapper">
                                            <div className="job-card-header">
                                                <div className="job-title-group">
                                                    <div className="job-serial-name">
                                                        <span className="serial-badge">#{job.serialNo}</span>
                                                        <h4 className="job-name-txt">{job.name}</h4>
                                                    </div>
                                                    <div className="job-date">{new Date(job.createdAt).toLocaleDateString('ar-EG')}</div>
                                                </div>
                                                <div className="job-actions-group">
                                                    <button onClick={() => handlePrintDetailed(job)} className="btn-modern btn-secondary print-btn-sq" title="طباعة تفصيلية">🖨️</button>
                                                    <button onClick={() => { setSelectedJob(job); setShowStageModal(true); }}
                                                        className="stage-btn"
                                                        style={{ background: `${currentStage.color}15`, border: `1px solid ${currentStage.color}44`, color: currentStage.color }}>
                                                        {currentStage.icon} تقدم المرحلة
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stage Progress Bar */}
                                            <div className="progress-stepper">
                                                {STAGES.map((stage, i) => (
                                                    <React.Fragment key={stage.key}>
                                                        <div className={`step-item ${i <= stageIdx ? 'active' : ''} ${i === stageIdx ? 'current' : ''}`}>
                                                            <div className="step-circle" style={{
                                                                borderColor: i <= stageIdx ? stage.color : 'rgba(255,255,255,0.1)',
                                                                background: i <= stageIdx ? `${stage.color}22` : 'rgba(255,255,255,0.04)',
                                                                boxShadow: i === stageIdx ? `0 0 12px ${stage.color}66` : 'none'
                                                            }}>
                                                                {i < stageIdx ? '✓' : stage.icon}
                                                            </div>
                                                            <span className="step-label" style={{ color: i <= stageIdx ? stage.color : '#555' }}>{stage.label}</span>
                                                        </div>
                                                        {i < STAGES.length - 1 && (
                                                            <div className={`step-connector ${i < stageIdx ? 'filled' : ''}`} />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>

                                            {/* الحالة والتكاليف */}
                                            <div className="job-stats-row">
                                                <span className={`sh-badge ${job.status === 'COMPLETED' ? 'paid' : 'partial'}`} style={{ border: 'none', background: currentStage.color + '15', color: currentStage.color }}>
                                                    {currentStage.icon} {currentStage.label} — {job.status === 'COMPLETED' ? 'مكتمل' : 'نشط'}
                                                </span>
                                                {job.status === 'COMPLETED' && job.completedAt && (
                                                    <span className="duration-badge">
                                                        ⏱ استغرق: {formatDuration(job.createdAt, job.completedAt)}
                                                    </span>
                                                )}
                                                <span className="stat-item">🔩 خامات: <strong className="val-mat">{job.totalMaterialCost?.toFixed(0)} {sym}</strong></span>
                                                <span className="stat-item">⚙️ تشغيل: <strong className="val-op">{job.totalOperatingCost?.toFixed(0)} {sym}</strong></span>
                                                {(job as any).paintCostTotal > 0 && (
                                                    <span className="stat-item paint-stat">
                                                        🎨 دهان: <strong className="val-paint">{(job as any).paintCostTotal?.toFixed(0)} {sym}</strong>
                                                        {(job as any).paintEntries?.some((p: any) => p.status === 'PENDING_PAYMENT') && (
                                                            <span className="sh-badge unpaid mini">دين</span>
                                                        )}
                                                    </span>
                                                )}
                                                <span className="stat-item">📊 ربح: <strong className="val-profit">{job.netProfit?.toFixed(0) || 0} {sym}</strong></span>
                                            </div>

                                            {/* ملخص التكاليف أسفل البطاقة */}
                                            <div className="costs-summary-footer">
                                                <div className="cost-unit">
                                                    <div className="unit-label">مصاريف تشغيل</div>
                                                    <div className="unit-val op">{job.totalOperatingCost?.toFixed(0)} {sym}</div>
                                                </div>
                                                <div className="cost-unit">
                                                    <div className="unit-label">إجمالي التكلفة</div>
                                                    <div className="unit-val total">{(job.totalMaterialCost + job.totalOperatingCost)?.toFixed(0)} {sym}</div>
                                                </div>
                                                <div className="cost-unit highlight">
                                                    <div className="unit-label">إجمالي البيع</div>
                                                    <div className="unit-val sale">{(job.totalMaterialCost + job.totalOperatingCost + (job.netProfit || 0))?.toFixed(0)} {sym}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Pagination Controls */}
                                <div className="pagination-wrapper">
                                    <div className="page-size-selector">
                                        <span className="page-size-label">عدد النتائج:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => handlePageSizeChange(e.target.value)}
                                            className="page-size-select"
                                            aria-label="Items per page"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value="ALL">الكل</option>
                                        </select>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="page-navigation">
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary nav-btn">&rarr; السابق</button>
                                            <div className="page-indicator">
                                                {currentPage} / {totalPages}
                                            </div>
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary nav-btn">التالي &larr;</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ NEW JOB FORM TAB ═══ */}
                    {activeTab === 'new' && (
                        <form onSubmit={handleCreateJob} className="glass-panel">

                            {/* ═══ 1. بيانات أمر التصنيع ═══ */}
                            <div className="job-section-container">
                                <h3 className="job-section-title">1. بيانات أمر التصنيع</h3>
                                <div className="job-data-grid">
                                    <div className="job-field-group">
                                        <label htmlFor="job_name">اسم وصف الشغلانة</label>
                                        <input id="job_name" type="text" className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="ستاند عرض حديد لكارفور.." title="اسم أمر التصنيع" />
                                    </div>
                                    <div className="job-field-group">
                                        <label htmlFor="destinationType">توجيه الطلب</label>
                                        <select id="destinationType" className="input-glass" value={form.destinationType} onChange={e => setForm({ ...form, destinationType: e.target.value, clientId: '', newClientName: '' })} title="وجهة الطلب">
                                            <option value="INVENTORY">طرح في المخزن الذكي</option>
                                            <option value="SAVED_CLIENT">تسليم لعميل محفوظ</option>
                                            <option value="NEW_CLIENT">تسليم لعميل جديد</option>
                                        </select>
                                        {form.destinationType === 'SAVED_CLIENT' && (
                                            <div className="job-mt-2">
                                                <label htmlFor="client_sel" className="sr-only">اختر العميل</label>
                                                <SearchableSelect
                                                    options={clients}
                                                    value={form.clientId}
                                                    onChange={(val: string) => setForm({ ...form, clientId: val })}
                                                    placeholder="- اختر العميل -"
                                                />
                                            </div>
                                        )}
                                        {form.destinationType === 'NEW_CLIENT' && (
                                            <div className="job-mt-2">
                                                <label htmlFor="new_client_name" className="sr-only">اسم العميل الجديد</label>
                                                <input id="new_client_name" type="text" className="input-glass" value={form.newClientName} onChange={e => setForm({ ...form, newClientName: e.target.value })} required placeholder="اسم العميل الجديد" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="job-field-group">
                                        <label htmlFor="outputProductId">المنتج المصنع</label>
                                        <SearchableSelect
                                            options={[{ id: '', name: '+ منتج جديد (أدخل بالأسفل)', code: '' }, ...products]}
                                            value={form.outputProductId}
                                            onChange={(val: string) => setForm({ ...form, outputProductId: val, outputProductName: '', outputProductCode: '' })}
                                            placeholder="- اختر المنتج -"
                                        />
                                        {!form.outputProductId && (
                                            <div className="job-subfield-row job-mt-2">
                                                <div className="job-subfield code-field">
                                                    <label htmlFor="prod_code" className="sr-only">كود المنتج</label>
                                                    <input id="prod_code" type="text" title="كود المنتج" className="input-glass" value={form.outputProductCode} onChange={e => setForm({ ...form, outputProductCode: e.target.value })} placeholder="كود المنتج" />
                                                </div>
                                                <div className="job-subfield">
                                                    <label htmlFor="prod_name" className="sr-only">اسم المنتج</label>
                                                    <input id="prod_name" type="text" title="اسم المنتج" className="input-glass" value={form.outputProductName} onChange={e => setForm({ ...form, outputProductName: e.target.value })} placeholder="اسم المنتج" required />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="job-field-group">
                                        <label htmlFor="outputQuantity">الكمية المنتجة (قطع صحيحة)</label>
                                        <input id="outputQuantity" type="number" min="1" step="1" className="input-glass" value={form.outputQuantity} onKeyDown={e => { if (e.key === '.' || e.key === '-' || e.key === 'e') e.preventDefault(); }} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, outputQuantity: val }); }} required title="الكمية الإجمالية الصحيحة" />
                                    </div>
                                </div>
                            </div>

                            {/* ═══ 2. الخامات ═══ */}
                            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ color: '#29b6f6', margin: 0 }}>2. خامات ومستلزمات</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="button" onClick={() => setShowWsModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: '#8d6e63' }}>+ ورشة سريعة</button>
                                        <button type="button" onClick={() => setMaterials([...materials, { categoryType: 'RAW_MATERIAL', itemId: '', quantity: 0, unitCost: 0, isMeterCalc: false, metersUsed: '', pieceLength: 6 }])} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>+ إضافة خامة/مستهلك</button>
                                    </div>
                                </div>
                                {materials.map((m, idx) => {
                                    const inv: any = inventories.find((i: any) => i.id === m.itemId);

                                    const filteredInventories = inventories.filter((i: any) => {
                                        const isMetal = i.mainCategory?.formType === 'METAL_FORM' || (i.name && (i.name.includes('حديد') || i.name.includes('صاج') || i.name.includes('مواسير') || i.name.includes('استانلس') || i.name.includes('علبة')));
                                        if (m.categoryType === 'RAW_MATERIAL') return isMetal;
                                        if (m.categoryType === 'CONSUMABLE') return !isMetal;
                                        return true;
                                    });

                                    return (
                                        <div key={idx} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(41,182,246,0.1)' }}>
                                            <div className="jobs-item-grid">
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) minmax(150px, 2fr)', gap: '10px', alignItems: 'end' }}>
                                                        <div style={{ width: '100%' }}>
                                                            <label htmlFor={`mat-type-${idx}`} style={{ display: 'block', marginBottom: '6px' }}>النوع</label>
                                                            <select
                                                                id={`mat-type-${idx}`}
                                                                className="input-glass"
                                                                value={m.categoryType || 'RAW_MATERIAL'}
                                                                onChange={e => {
                                                                    const n = [...materials];
                                                                    n[idx].categoryType = e.target.value;
                                                                    n[idx].itemId = '';
                                                                    n[idx].unitCost = 0;
                                                                    setMaterials(n);
                                                                }}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <option value="RAW_MATERIAL">خامة</option>
                                                                <option value="CONSUMABLE">مستهلك</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ width: '100%' }}>
                                                            <label htmlFor={`mat-${idx}`} style={{ display: 'block', marginBottom: '6px' }}>{m.categoryType === 'RAW_MATERIAL' ? 'الخامة' : 'المستهلك'}</label>
                                                            <SearchableSelect
                                                                options={filteredInventories.map((i: any) => ({
                                                                    id: i.id,
                                                                    name: `${i.name} (متوفر: ${Math.round(i.stock)} ${i.unit})`,
                                                                    code: ''
                                                                }))}
                                                                value={m.itemId}
                                                                onChange={(val: string) => handleMaterialChange(idx, val)}
                                                                placeholder={m.categoryType === 'RAW_MATERIAL' ? "- اختر الخامة -" : "- اختر المستهلك -"}
                                                            />
                                                        </div>
                                                    </div>
                                                    {m.itemId && (
                                                        <label htmlFor={`mat-det-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '8px', fontSize: '0.8rem', color: '#919398' }}>
                                                            <input id={`mat-det-${idx}`} type="checkbox" title="تفعيل الإدخال التفصيلي" checked={m.isMeterCalc} onChange={e => { const n = [...materials]; n[idx].isMeterCalc = e.target.checked; setMaterials(n); }} style={{ accentColor: '#29b6f6' }} />
                                                            إدخال تفصيلي (متر/علبة..)
                                                        </label>
                                                    )}
                                                </div>
                                                {m.isMeterCalc ? (
                                                    <>
                                                        <div style={{ width: '100%' }}>
                                                            <label htmlFor={`content-${idx}`}>محتوى العبوة</label>
                                                            <input id={`content-${idx}`} type="number" step="any" className="input-glass" style={{ width: '100%' }} value={m.pieceLength || ''} onChange={e => { const n = [...materials]; n[idx].pieceLength = parseFloat(e.target.value) || 1; if (n[idx].metersUsed) n[idx].quantity = Number(n[idx].metersUsed) / n[idx].pieceLength; setMaterials(n); }} required title="طول القطعة أو سعة العبوة" />
                                                        </div>
                                                        <div style={{ width: '100%' }}>
                                                            <label htmlFor={`usage-${idx}`}>الاستهلاك الفعلي</label>
                                                            <input id={`usage-${idx}`} type="number" step="any" className="input-glass" style={{ width: '100%' }} value={m.metersUsed} onChange={e => { const n = [...materials]; n[idx].metersUsed = e.target.value; n[idx].quantity = (parseFloat(e.target.value) || 0) / n[idx].pieceLength; setMaterials(n); }} title="الاستهلاك بالأطوال أو الأوزان" />
                                                        </div>
                                                        <div style={{ width: '100%' }}>
                                                            <span style={{ display: 'block', fontSize: '0.82rem', color: '#919398', marginBottom: '8px' }}>المسحوب</span>
                                                            <div style={{ padding: '0.75rem 0', color: '#999', fontSize: '0.9rem' }}>{parseFloat(Number(m.quantity || 0).toFixed(4))}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ width: '100%' }}>
                                                        <label htmlFor={`qty-${idx}`}>الكمية ({inv ? inv.unit : '...'})</label>
                                                        <input id={`qty-${idx}`} type="number" step="any" className="input-glass" style={{ width: '100%' }} value={m.quantity === 0 ? '' : m.quantity} onChange={e => { const n = [...materials]; n[idx].quantity = parseFloat(e.target.value) || 0; setMaterials(n); }} required title="الكمية المطلوبة" />
                                                    </div>
                                                )}
                                                <div style={{ width: '100%' }}>
                                                    <label htmlFor={`ucost-${idx}`}>سعر الوحدة</label>
                                                    <input id={`ucost-${idx}`} type="number" step="any" className="input-glass" style={{ width: '100%' }} value={isNaN(m.unitCost) ? 0 : m.unitCost} onChange={e => { const n = [...materials]; n[idx].unitCost = parseFloat(e.target.value) || 0; setMaterials(n); }} required title="تكلفة الوحدة" />
                                                </div>
                                                <div style={{ width: '100%' }}>
                                                    <span style={{ display: 'block', fontSize: '0.82rem', color: '#919398', marginBottom: '8px' }}>الإجمالي</span>
                                                    <div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#29b6f6' }}>{Math.round(m.unitCost * m.quantity)}</div>
                                                </div>
                                                {materials.length > 1 && (
                                                    <div style={{ width: '100%' }}>
                                                        <button type="button" onClick={() => removeMaterial(idx)} style={{ padding: '10px', background: '#E35E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }} title="حذف الخامة">حذف</button>
                                                    </div>
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
                                    <div key={idx} className="jobs-item-grid" style={{ marginBottom: '10px', background: 'rgba(171,71,188,0.05)', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ flex: 1 }}><label htmlFor={`ex-desc-${idx}`}>البيان</label><input id={`ex-desc-${idx}`} type="text" className="input-glass" style={{ width: '100%' }} value={ex.description} onChange={e => updateExtra(idx, 'description', e.target.value)} required title="وصف البند" /></div>
                                        <div style={{ width: '100%' }}><label htmlFor={`ex-qty-${idx}`}>الكمية</label><input id={`ex-qty-${idx}`} type="number" step="any" min="0.001" className="input-glass" style={{ width: '100%' }} value={ex.quantity} onChange={e => updateExtra(idx, 'quantity', parseFloat(e.target.value))} required title="الكمية" /></div>
                                        <div style={{ width: '100%' }}><label htmlFor={`ex-price-${idx}`}>سعر الوحدة</label><input id={`ex-price-${idx}`} type="number" step="any" className="input-glass" style={{ width: '100%' }} value={ex.unitPrice} onChange={e => updateExtra(idx, 'unitPrice', parseFloat(e.target.value))} required title="سعر الوحدة" /></div>
                                        <div style={{ width: '100%' }}><span style={{ display: 'block', fontSize: '0.82rem', color: '#919398', marginBottom: '8px' }}>الإجمالي</span><div style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#ab47bc' }}>{(ex.quantity * ex.unitPrice).toFixed(0)}</div></div>
                                        <div style={{ width: '100%' }}>
                                            <button type="button" onClick={() => removeExtra(idx)} style={{ padding: '10px', background: '#E35E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>حذف</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ═══ 4. قسم الدهان ═══ */}
                            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ color: '#26c6da', margin: 0 }}>4. 🎨 قسم الدهان</h3>
                                    <button type="button" onClick={addPaintManual} style={{ padding: '6px 14px', background: 'rgba(38,198,218,0.12)', border: '1px solid #26c6da', color: '#26c6da', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+ إضافة منتج</button>
                                </div>
                                <div style={{ background: 'rgba(38,198,218,0.05)', border: '1px solid rgba(38,198,218,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                                    <p style={{ color: '#26c6da', fontWeight: 600, margin: '0 0 10px', fontSize: '0.88rem' }}>📋 استيراد من فاتورة مبيعات:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                                        <div style={{ flex: '1 1 200px' }}>
                                            <label htmlFor="paintInvoiceSelect">اختر الفاتورة</label>
                                            <select id="paintInvoiceSelect" className="input-glass" style={{ width: '100%' }} value={paintInvoiceId} onChange={e => setPaintInvoiceId(e.target.value)} title="استيراد بنود من فاتورة">
                                                <option value="">- اختر فاتورة -</option>
                                                {invoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoiceNo} - {inv.client?.name || 'بدون عميل'}</option>)}
                                            </select>
                                        </div>
                                        <button type="button" onClick={importFromInvoice} disabled={!paintInvoiceId} style={{ padding: '0.75rem 20px', background: paintInvoiceId ? '#26c6da' : '#555', color: '#fff', border: 'none', borderRadius: '8px', cursor: paintInvoiceId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 700, flex: '1 1 auto' }}>⬇ جلب المنتجات</button>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <label htmlFor="paintSupplierSelect" style={{ fontSize: '0.85rem' }}>مصنع الدهانات (المورد)</label>
                                        <select id="paintSupplierSelect" className="input-glass" style={{ width: '100%' }} value={paintSupplierId} onChange={e => setPaintSupplierId(e.target.value)} title="تعيين مصنع الدهان">
                                            <option value="">-- بدون مورد (أو اختر المورد لاحقاً) --</option>
                                            {suppliers.filter(s => s.type === 'PAINT').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {paintItems.length > 0 && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <div style={{ minWidth: '600px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 120px 140px 100px 110px 48px', gap: '8px', padding: '8px 10px', background: 'rgba(38,198,218,0.1)', borderRadius: '8px', marginBottom: '6px', fontSize: '0.8rem', color: '#26c6da', fontWeight: 600 }}>
                                                <span>اسم المنتج</span><span>الكمية</span><span>اللون</span><span>كود اللون</span><span>سعر الدهان</span><span>الإجمالي</span><span></span>
                                            </div>
                                            {paintItems.map((p, idx) => (
                                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 120px 140px 100px 110px 48px', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px 10px', background: 'rgba(38,198,218,0.03)', borderRadius: '8px', border: '1px solid rgba(38,198,218,0.08)' }}>
                                                    <input type="text" title="اسم المنتج" id={`p-name-${idx}`} className="input-glass" style={{ width: '100%' }} value={p.productName} onChange={e => updatePaint(idx, 'productName', e.target.value)} readOnly={p.source === 'invoice'} />
                                                    <input type="number" title="الكمية" id={`p-qty-${idx}`} step="any" className="input-glass" style={{ width: '100%' }} value={p.quantity} onChange={e => updatePaint(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                                                    <input type="text" title="اللون" id={`p-clr-${idx}`} className="input-glass" style={{ width: '100%' }} value={p.color} onChange={e => updatePaint(idx, 'color', e.target.value)} placeholder="أبيض.." />
                                                    <input type="text" title="كود اللون" id={`p-code-${idx}`} className="input-glass" style={{ width: '100%' }} value={p.colorCode} onChange={e => updatePaint(idx, 'colorCode', e.target.value)} placeholder="#FFFFFF" />
                                                    <input type="number" title="سعر وحدة الدهان" id={`p-uprice-${idx}`} step="any" className="input-glass" style={{ width: '100%' }} value={p.unitPrice} onChange={e => updatePaint(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                                    <div style={{ fontWeight: 'bold', color: '#26c6da', textAlign: 'center' }}>{(p.quantity * p.unitPrice).toFixed(0)}</div>
                                                    <button type="button" onClick={() => removePaint(idx)} title="حذف البند" style={{ padding: '8px', background: 'rgba(227,94,53,0.1)', color: '#E35E35', border: '1px solid rgba(227,94,53,0.3)', borderRadius: '6px', cursor: 'pointer', width: '100%' }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ═══ 5. تكاليف التشغيل ═══ */}
                            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ color: '#ffa726', margin: 0 }}>5. تكاليف التشغيل المباشرة (تشغيل خارجي)</h3>
                                    <button type="button" onClick={() => setExpenses([...expenses, { description: '', amount: 0, supplierId: '' }])} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>+ تشغيلة</button>
                                </div>
                                <datalist id="expensePresets">
                                    <option value="قطع ليزر" /><option value="درفلة ومونتاج" /><option value="نقل وتحميل" /><option value="دهان الكتروستاتيك" />
                                </datalist>
                                {expenses.map((ex, idx) => (
                                    <div key={idx} className="jobs-item-grid" style={{ marginBottom: '10px' }}>
                                        <div style={{ flex: 1 }}><label htmlFor={`exp-desc-${idx}`}>نوع التكلفة</label><input id={`exp-desc-${idx}`} type="text" list="expensePresets" className="input-glass" style={{ width: '100%' }} value={ex.description} onChange={e => { const n = [...expenses]; n[idx].description = e.target.value; setExpenses(n); }} required placeholder="قطع ليزر ورشة محمد" title="وصف التكلفة" /></div>
                                        <div style={{ flex: 1 }}>
                                            <label htmlFor={`exp-supp-${idx}`}>حساب المورد</label>
                                            <select id={`exp-supp-${idx}`} className="input-glass" style={{ width: '100%' }} value={ex.supplierId} onChange={e => { const n = [...expenses]; n[idx].supplierId = e.target.value; setExpenses(n); }}>
                                                <option value="">-- كاش / بدون مورد --</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type === 'ALUMINUM' ? 'ألومنيوم' : s.type === 'EXTERNAL' ? 'تشغيل' : s.type})</option>)}
                                            </select>
                                        </div>
                                        <div style={{ width: '100%' }}><label htmlFor={`exp-amt-${idx}`}>التكلفة ({sym})</label><input id={`exp-amt-${idx}`} type="number" step="any" className="input-glass" style={{ width: '100%' }} value={ex.amount} onChange={e => { const n = [...expenses]; n[idx].amount = parseFloat(e.target.value); setExpenses(n); }} required title="قيمة التكلفة" /></div>
                                        {expenses.length > 1 && (
                                            <div style={{ width: '100%' }}>
                                                <button type="button" onClick={() => removeExpense(idx)} style={{ padding: '10px', background: '#E35E35', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>حذف</button>
                                            </div>
                                        )}
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
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '5rem' }}>
                                <div style={{ flex: '1 1 100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        <span style={{ color: '#919398', fontSize: '0.9rem' }}>🔩 خامات مباشرة: <strong style={{ color: '#29b6f6' }}>{totalMaterials.toFixed(0)} {sym}</strong></span>
                                        <span style={{ color: '#919398', fontSize: '0.9rem' }}>⚙️ تشغيل: <strong style={{ color: '#ffa726' }}>{(totalOp + totalExtras).toFixed(0)} {sym}</strong></span>
                                        <span style={{ color: '#919398', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🎨 دهان:
                                            <strong style={{ color: '#26c6da' }}>{totalPaint.toFixed(0)} {sym}</strong>
                                            {totalPaint > 0 && (
                                                <span style={{ fontSize: '0.7rem', background: 'rgba(255,82,82,0.2)', border: '1px solid rgba(255,82,82,0.4)', color: '#ff5252', padding: '1px 7px', borderRadius: '10px', fontWeight: 700 }}>معلق الدفع</span>
                                            )}
                                        </span>
                                        {paintCost > 0 && <span style={{ color: '#919398', fontSize: '0.9rem' }}>🎨 دهانات إضافية: <strong style={{ color: '#26c6da' }}>{paintCost.toFixed(0)} {sym}</strong></span>}
                                        {transportCost > 0 && <span style={{ color: '#919398', fontSize: '0.9rem' }}>🚛 نقل: <strong style={{ color: '#ab47bc' }}>{transportCost.toFixed(0)} {sym}</strong></span>}
                                    </div>

                                    <div style={{ marginBottom: '16px', padding: '14px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#ccc', marginBottom: '8px', fontWeight: 'bold' }}>المارجن الربحي</label>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 100px' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#aaa' }}>%</span>
                                                <input type="number" title="النسبة المئوية للمارجن" step="any" min="0" className="input-glass" style={{ width: '100%', textAlign: 'center' }} value={form.operatingMarginPct} onChange={e => setForm({ ...form, operatingMarginPct: e.target.value })} />
                                            </div>
                                            <span style={{ color: '#555' }}>⇄</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 120px' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#aaa' }}>مبلغ ({sym})</span>
                                                <input type="number" title="قيمة المارجن بالمبلغ" step="any" min="0" className="input-glass" style={{ width: '100%', textAlign: 'center', color: '#ffb74d' }} value={marginAmount > 0 ? Number(marginAmount.toFixed(0)) : ''} placeholder="0" onChange={e => { const amount = parseFloat(e.target.value) || 0; const newPct = baseCost > 0 ? (amount / baseCost) * 100 : 0; setForm({ ...form, operatingMarginPct: String(newPct) }); }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '8px', marginTop: '15px', width: '100%', boxSizing: 'border-box' }}>
                                        <div style={{ padding: '8px 12px', background: 'rgba(41,182,246,0.1)', borderRadius: '8px', border: '1px solid rgba(41,182,246,0.2)' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#919398' }}>إجمالي التكلفة</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4fc3f7' }}>{totalCost.toLocaleString('en-US')} {sym}</div>
                                        </div>
                                        <div style={{ padding: '8px 12px', background: 'rgba(102,187,106,0.1)', borderRadius: '8px', border: '1px solid rgba(102,187,106,0.2)' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#919398' }}>التكلفة الكلية مع الخامات</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#66bb6a' }}>{(totalMaterials + totalOp + totalExtras + totalPaint + paintCost + transportCost).toLocaleString('en-US')} {sym}</div>
                                        </div>
                                        {Number(form.outputQuantity) > 0 && (
                                            <div style={{ padding: '8px 12px', background: 'rgba(171,71,188,0.1)', borderRadius: '8px', border: '1px solid rgba(171,71,188,0.2)' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#919398' }}>سعر تكلفة الوحدة</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ab47bc' }}>{unitCost.toLocaleString('en-US')} {sym}</div>
                                            </div>
                                        )}
                                        <div style={{ padding: '8px 12px', background: 'color-mix(in srgb, var(--primary-color), transparent 90%)', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--primary-color), transparent 80%)' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#919398' }}>صافي الربح التقديري</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>{estimatedProfit.toLocaleString('en-US')} {sym}</div>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: '1 1 100%', padding: '1.5rem 2.5rem', fontSize: '1.2rem', boxShadow: `0 5px 20px color-mix(in srgb, var(--primary-color), transparent 75%)`, borderRadius: '12px', marginTop: '10px' }}>
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
                                            const newMaterial = { categoryType: 'CONSUMABLE', itemId: inv.id, quantity: 0, unitCost: inv.lastPurchasedPrice || 0, isMeterCalc: true, metersUsed: '', pieceLength: 1 };
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
            </div>
            <style jsx>{`
                .tab-badge {
                    margin-right: auto;
                    background: rgba(255,255,255,0.1);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    color: #fff;
                }
                .jobs-list-container {
                    padding: 1.5rem;
                }
                .list-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .section-title {
                    margin: 0;
                    color: var(--primary-color);
                }
                .jobs-cards-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .job-card-wrapper {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    padding: 1.2rem;
                }
                .job-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .job-title-group {
                    display: flex;
                    flex-direction: column;
                }
                .job-serial-name {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .serial-badge {
                    background: rgba(227, 94, 53, 0.15);
                    color: var(--primary-color);
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 800;
                }
                .job-name-txt {
                    margin: 0;
                    color: #fff;
                    font-size: 1rem;
                }
                .job-date {
                    font-size: 0.78rem;
                    color: #666;
                    margin-top: 4px;
                }
                .job-actions-group {
                    display: flex;
                    gap: 8px;
                }
                .stage-btn {
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .progress-stepper {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 1rem;
                    align-items: center;
                }
                .step-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                }
                .step-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    border-width: 2px;
                    border-style: solid;
                    transition: all 0.3s;
                }
                .step-label {
                    font-size: 0.6rem;
                    text-align: center;
                    line-height: 1.2;
                }
                .step-connector {
                    height: 3px;
                    flex: 1;
                    background: rgba(255,255,255,0.06);
                    border-radius: 10px;
                    margin-bottom: 18px;
                    transition: background 0.3s;
                }
                .step-connector.filled {
                    background: #66bb6a;
                }
                .job-stats-row {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .duration-badge {
                    color: #66bb6a;
                    font-size: 0.82rem;
                    font-weight: 700;
                    background: rgba(102,187,106,0.1);
                    padding: 3px 10px;
                    border-radius: 20px;
                }
                .stat-item {
                    color: #919398;
                    font-size: 0.82rem;
                }
                .val-mat { color: #29b6f6; }
                .val-op { color: #ffa726; }
                .val-paint { color: #26c6da; }
                .val-profit { color: #66bb6a; }
                .mini { font-size: 0.6rem; padding: 1px 6px; opacity: 0.8; }
                .costs-summary-footer {
                    margin-top: 1rem;
                    padding: 12px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 10px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
                    gap: 8px;
                }
                .cost-unit {
                    text-align: center;
                }
                .unit-label {
                    font-size: 0.7rem;
                    color: #888;
                }
                .unit-val {
                    font-weight: 700;
                }
                .unit-val.op { color: #ffa726; }
                .unit-val.total { color: #29b6f6; }
                .unit-val.sale { color: var(--primary-color); font-size: 1rem; }
                .cost-unit.highlight {
                    border-right: 1px solid rgba(255,255,255,0.05);
                    padding-right: 8px;
                }
                .pagination-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: 2rem;
                    flex-wrap: wrap-reverse;
                    gap: 20px;
                    padding: 15px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                }
                .page-size-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0,0,0,0.2);
                    padding: 5px 15px;
                    border-radius: 20px;
                }
                .page-size-label {
                    color: var(--text-muted);
                    font-size: 0.85rem;
                }
                .page-size-select {
                    padding: 0px;
                    font-size: 0.9rem;
                    width: auto;
                    border: none;
                    background: transparent;
                    color: var(--primary-color);
                    font-weight: bold;
                    cursor: pointer;
                    outline: none;
                }
                .page-size-select option {
                    color: #000;
                }
                .page-navigation {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    flex: 1 1 auto;
                    max-width: 350px;
                }
                .nav-btn {
                    flex: 1;
                    justify-content: center;
                }
                .page-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 60px;
                    background: rgba(227,94,53,0.1);
                    color: var(--primary-color);
                    border-radius: 10px;
                    padding: 6px 12px;
                    font-weight: bold;
                    font-size: 0.9rem;
                    direction: ltr;
                    white-space: nowrap;
                    border: 1px solid rgba(227, 94, 53, 0.2);
                }
                
                .text-ellipsis {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                .jobs-item-grid {
                    display: grid;
                    grid-template-columns: minmax(150px, 1fr) auto auto auto auto;
                    gap: 15px;
                    align-items: flex-end;
                }
                @media (max-width: 768px) {
                    .job-card-header {
                        flex-direction: column;
                    }
                    .jobs-item-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    .jobs-item-grid > div:first-child {
                        grid-column: 1 / -1;
                    }
                    .job-data-grid {
                        grid-template-columns: 1fr;
                    }
                    .cost-unit.highlight {
                        border-right: none;
                        padding-right: 0;
                        border-top: 1px solid rgba(255,255,255,0.05);
                        padding-top: 8px;
                        grid-column: span 2;
                    }
                }
                .input-glass {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>
        </div>
    );
}
