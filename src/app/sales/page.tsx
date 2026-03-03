'use client';
import React, { useEffect, useState } from 'react';

export default function SalesPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [invoiceNo, setInvoiceNo] = useState('');
    const [clientId, setClientId] = useState('');
    const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: 0 }]);
    const [taxPct, setTaxPct] = useState(0);
    const [discountPct, setDiscountPct] = useState(0);
    const [success, setSuccess] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetch('/api/clients').then(res => res.json()).then(data => setClients(Array.isArray(data) ? data : []));
        fetch('/api/products').then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));

        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);
        } catch { }

        const fetchNextInv = async () => {
            try {
                const res = await fetch('/api/settings/counters?type=sales');
                if (res.ok) {
                    const data = await res.json();
                    setInvoiceNo(data.invoiceNo);
                } else {
                    const s = (() => { try { const raw = localStorage.getItem('erp_settings'); return raw ? JSON.parse(raw) : null; } catch { return null; } })();
                    setInvoiceNo(`${s?.invoicePrefix || 'INV'}-####`);
                }
            } catch { }
        };
        fetchNextInv();
    }, []);

    const handleCreateSales = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return alert('برجاء اختيار العميل');
        if (items.some(i => !i.productId || i.quantity <= 0)) return alert('تأكد من اختيار منتج وكمية صحيحة');

        setLoading(true);
        setSuccess('');
        try {
            const payload = { invoiceNo, clientId, items, taxPct, discountPct };
            const res = await fetch('/api/sales', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                const s = (() => { try { const raw = localStorage.getItem('erp_settings'); return raw ? JSON.parse(raw) : null; } catch { return null; } })();
                setSuccess(`تم إصدار فاتورة المبيعات بنجاح وقيمتها: ${data.total} جنيه وتم خصمها من المخزون`);
                // refetch the newly incremented predicted number
                fetch('/api/settings/counters?type=sales')
                    .then(r => r.json())
                    .then(d => setInvoiceNo(d.invoiceNo))
                    .catch(() => {
                        const s = (() => { try { const raw = localStorage.getItem('erp_settings'); return raw ? JSON.parse(raw) : null; } catch { return null; } })();
                        setInvoiceNo(`${s?.invoicePrefix || 'INV'}-####`);
                    });
                setClientId('');
                setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
                setTaxPct(0); setDiscountPct(0);
            } else { alert(data.error); }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleProductChange = (idx: number, pid: string) => {
        const prod: any = products.find((p: any) => p.id === pid);
        const newItems = [...items];
        newItems[idx].productId = pid;
        newItems[idx].unitPrice = prod ? prod.price : 0;
        setItems(newItems);
    };

    const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const discountVal = subtotal * (discountPct / 100);
    const taxVal = (subtotal - discountVal) * (taxPct / 100);
    const total = subtotal - discountVal + taxVal;

    return (
        <div className="unified-container animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1>إصدار الفواتير الاحترافية والمبيعات</h1>
                <p>إنشاء وتسجيل فواتير العملاء مع خصم المخزون أوتوماتيكياً وطباعة PDF/Excel مستقبلاً</p>
            </header>

            {success && <div style={{ background: 'rgba(102, 187, 106, 0.2)', color: '#66bb6a', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>{success}</div>}

            <form onSubmit={handleCreateSales} className="glass-panel">
                <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <label htmlFor="invNo">رقم الفاتورة (يمكنك تعديله)</label>
                        <input id="invNo" type="text" className="input-glass" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} required placeholder="INV-0001" title="رقم الفاتورة" />
                    </div>
                    <div>
                        <label htmlFor="clientId">اسم العميل / الشركة</label>
                        <select id="clientId" className="input-glass" value={clientId} onChange={e => setClientId(e.target.value)} required title="اختر العميل">
                            <option value="">-- اختر عميل مسجل --</option>
                            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                        <h3>أصناف منتجات المبيعات</h3>
                        <button type="button" onClick={() => setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }])} className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.9rem' }}>+ إضافة منتج للفاتورة</button>
                    </div>

                    {items.map((it, idx) => (
                        <div key={idx} className="subfield-row">
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label htmlFor={`prod-${idx}`}>المنتج المباع</label>
                                <select id={`prod-${idx}`} className="input-glass" value={it.productId} onChange={e => handleProductChange(idx, e.target.value)} required title="اختر المنتج">
                                    <option value="">- اختر منتج -</option>
                                    {products.map((p: any) => {
                                        const shortName = p.name.length > 70 ? p.name.substring(0, 70) + '...' : p.name;
                                        return <option key={p.id} value={p.id} title={p.name}>{shortName} (متوفر: {p.stock})</option>;
                                    })}
                                </select>
                            </div>
                            <div style={{ width: '120px' }}>
                                <label htmlFor={`qty-${idx}`}>الكمية (العدد)</label>
                                <input id={`qty-${idx}`} type="number" className="input-glass" value={it.quantity} onChange={e => { const n = [...items]; n[idx].quantity = parseFloat(e.target.value); setItems(n); }} min="1" required title="الكمية" />
                            </div>
                            <div style={{ width: '140px' }}>
                                <label htmlFor={`price-${idx}`}>السعر (قطعة)</label>
                                <input id={`price-${idx}`} type="number" className="input-glass" value={it.unitPrice} onChange={e => { const n = [...items]; n[idx].unitPrice = parseFloat(e.target.value); setItems(n); }} required title="السعر للقطعة" />
                            </div>
                            <div style={{ width: '150px', display: 'flex', flexDirection: 'column' }}>
                                <label>الإجمالي الفرعي</label>
                                <span style={{ padding: '0.75rem 0', color: '#fff', fontWeight: 'bold' }}>{(it.quantity * it.unitPrice).toFixed(0)} جنيه</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="responsive-grid" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '1rem', alignItems: 'center' }}>
                    <div>
                        <label htmlFor="discount">نسبة الخصم التجاري (%)</label>
                        <input id="discount" type="number" className="input-glass" value={discountPct} onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)} min="0" max="100" title="نسبة الخصم" />
                    </div>
                    <div>
                        <label htmlFor="tax">نسبة ضريبة القيمة المضافة (%)</label>
                        <input id="tax" type="number" className="input-glass" value={taxPct} onChange={e => setTaxPct(parseFloat(e.target.value) || 0)} min="0" max="100" title="نسبة الضريبة" />
                    </div>
                    <div style={{ textAlign: 'left', minWidth: '100%' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '10px' }}>السعر قبل: <span style={{ color: '#ccc' }}>{subtotal.toFixed(0)} ج</span></h2>
                        <h2 style={{ color: 'var(--primary-color)', fontSize: '2rem', margin: 0 }}>الإجمالي النهائي: {total.toFixed(0)} ج.م</h2>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                    {isAdmin ? (
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>
                            {loading ? 'جاري المعالجة والترحيل...' : 'إصدار وتأكيد الفاتورة وتسجيلها ←'}
                        </button>
                    ) : (
                        <div style={{ color: '#E35E35', background: 'rgba(227,94,53,0.1)', padding: '1rem', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                            ⚠️ عذراً، إصدار الفواتير مسموح به للمديرين فقط
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
