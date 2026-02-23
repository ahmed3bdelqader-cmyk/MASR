'use client';
import React, { useEffect, useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Client = {
    id: string; serial: number; name: string; storeName?: string;
    phone1?: string; phone2?: string; email?: string; address?: string;
    totalInvoices: number; totalPayments: number; balanceDue: number;
    invoices: { id: string; invoiceNo: string; total: number; status: string; createdAt: string }[];
};

const SYM = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } });

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [form, setForm] = useState({ name: '', storeName: '', address: '', phone1: '', phone2: '' });

    // ── Payment modal state ────────────────────────────────────────────────────
    const [payModal, setPayModal] = useState<Client | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payChannel, setPayChannel] = useState('CASH');
    const [payTreasury, setPayTreasury] = useState('MAIN');
    const [payInvoice, setPayInvoice] = useState('');
    const [payBank, setPayBank] = useState('');
    const [payNote, setPayNote] = useState('');
    const [paying, setPaying] = useState(false);
    const [payMsg, setPayMsg] = useState('');

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            setClients(data.map((c: any) => ({ ...c, invoices: c.invoices || [] })));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (res.ok) { setForm({ name: '', storeName: '', address: '', phone1: '', phone2: '' }); fetchClients(); }
        } catch (e) { console.error(e); }
    };

    // ── Filtering and Pagination Logic ─────────────────────────────────────────
    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            c.name.includes(searchTerm) ||
            (c.storeName && c.storeName.includes(searchTerm)) ||
            (c.phone1 && c.phone1.includes(searchTerm)) ||
            `C-${c.serial}`.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const totalPages = Math.ceil(filteredClients.length / pageSize);
    const paginatedClients = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredClients.slice(start, start + pageSize);
    }, [filteredClients, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 on search
    }, [searchTerm]);

    // ── Import / Export Logic ──────────────────────────────────────────────────
    const exportToCSV = () => {
        const headers = ['المسلسل', 'اسم العميل', 'اسم النشاط/المحل', 'العنوان', 'رقم الهاتف 1', 'رقم الهاتف 2', 'البريد الإلكتروني', 'إجمالي المبيعات', 'إجمالي التحصيلات', 'الرصيد المتبقي'];
        const rows = clients.map(c => [
            c.serial,
            c.name,
            c.storeName || '',
            c.address || '',
            c.phone1 || '',
            c.phone2 || '',
            c.email || '',
            c.totalInvoices,
            c.totalPayments,
            c.balanceDue
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
        link.setAttribute("download", `قاعدة_بيانات_العملاء_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
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
                const items = [];
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
                    if (cells.length >= 2 && cells[1]) {
                        items.push({
                            name: cells[1],
                            storeName: cells[2] || '',
                            address: cells[3] || '',
                            phone1: cells[4] || '',
                            phone2: cells[5] || '',
                            email: cells[6] || '',
                        });
                    }
                }
                if (items.length > 0) {
                    if (!confirm(`سيتم إضافة ${items.length} عميل جديد إلى النظام. هل تود الاستمرار؟`)) return;
                    setLoading(true);
                    const res = await fetch('/api/clients', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(items)
                    });
                    if (res.ok) {
                        alert(`✅ تم استيراد ${items.length} عميل بنجاح`);
                        fetchClients();
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

    // ── Open payment modal ─────────────────────────────────────────────────────
    const openPay = (cl: Client) => {
        setPayModal(cl);
        setPayAmount(cl.balanceDue > 0 ? cl.balanceDue.toFixed(0) : '');
        setPayChannel('CASH'); setPayTreasury('MAIN'); setPayBank(''); setPayInvoice(''); setPayNote(''); setPayMsg('');
    };

    // ── Submit payment ─────────────────────────────────────────────────────────
    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payModal) return;
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0) return alert('أدخل مبلغاً صحيحاً');
        setPaying(true); setPayMsg('');
        try {
            const selectedInv = payModal.invoices.find(i => i.id === payInvoice);
            const res = await fetch('/api/clients/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: payModal.id, amount, channel: payChannel, treasuryType: payTreasury,
                    bankName: payChannel === 'BANK' ? payBank : null,
                    invoiceId: payInvoice || null, invoiceRef: selectedInv?.invoiceNo || null, note: payNote,
                })
            });
            if (res.ok) {
                setPayMsg(`✅ تم تسجيل تحصيل ${amount} ${SYM()} من ${payModal.name} وترحيله للخزينة`);
                await fetchClients();
                setTimeout(() => { setPayModal(null); setPayMsg(''); }, 2500);
            } else {
                const data = await res.json();
                setPayMsg(`❌ ${data.error || 'حدث خطأ'}`);
            }
        } catch (err) { setPayMsg('❌ خطأ في الاتصال بالخادم'); } finally { setPaying(false); }
    };

    // ── Print statement ────────────────────────────────────────────────────────
    const printStatement = (cl: Client) => {
        const win = window.open('', '_blank');
        if (!win) return;
        const sym = SYM();
        const appS = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}'); } catch { return {}; } })();
        const DEFAULT: any = { companyName: (appS as any).appName || '', accentColor: (appS as any).primaryColor || '#E35E35', footerText: 'شكراً لتعاملكم معنا', footerAlign: 'center', socialAlign: 'center', headerPosition: 'space-between', logoPosition: 'right', showLogo: true, printLogoSize: '70' };
        let t: any = { ...DEFAULT };
        try { const sv = localStorage.getItem('erp_invoice_template'); if (sv) t = { ...t, ...JSON.parse(sv) }; } catch { }
        const accent = t.accentColor || '#E35E35';
        const logo = t.printLogoCustom || (appS as any).appLogo || '';
        const logoSizePx = t.printLogoSize || '70';
        const shapeMap: Record<string, string> = { circle: '50%', square: '0', rect: '6px', rounded: '10px' };
        const logoRadius = shapeMap[(appS as any).logoShape || 'rounded'] || '10px';
        const logoImg = logo && t.showLogo ? `<img src="${logo}" style="width:${logoSizePx}px;height:${logoSizePx}px;object-fit:contain;border-radius:${logoRadius};display:block" />` : '';
        const infoBlock = `<div><h1 style="margin:0;font-size:1.35rem;color:${accent}">${t.companyName || (appS as any).appName || ''}</h1><p style="margin:2px 0;font-size:0.8rem">${t.companyAddress || ''}</p></div>`;
        const metaBlock = `<div style="text-align:left"><h2 style="margin:0;color:${accent};font-size:1.05rem">🧾 كشف حساب عميل</h2><p style="margin:2px 0;font-size:0.83rem">${cl.name}</p></div>`;

        const rows = cl.invoices.map(inv => `<tr><td>${inv.invoiceNo}</td><td style="text-align:center">${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td><td style="text-align:center">${(inv.total || 0).toFixed(0)} ${sym}</td><td style="text-align:center">${inv.status}</td></tr>`).join('');

        win.document.write(`<html dir="rtl"><head><title>كشف حساب</title><style>body{font-family:Tahoma;padding:20px;}table{width:100%;border-collapse:collapse;}th{background:${accent};color:white;padding:10px;}td{padding:10px;border-bottom:1px solid #eee;}</style></head><body onload="window.print()"><div style="display:flex;justify-content:space-between;margin-bottom:30px"><div>${logoImg}${infoBlock}</div>${metaBlock}</div><h3>📋 سجل الفواتير</h3><table><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:20px;text-align:left;font-weight:bold;font-size:1.2rem;border-top:2px solid ${accent};padding-top:10px">💳 الرصيد المتبقي: ${cl.balanceDue.toFixed(0)} ${sym}</div></body></html>`);
        win.document.close();
    };

    const sym = SYM();
    const totalBalance = clients.reduce((acc, c) => acc + c.balanceDue, 0);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1>إدارة العملاء والتحصيلات</h1>
                <p>متابعة أرصدة {clients.length} عميل | إجمالي المستحقات: <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>{totalBalance.toLocaleString()} {sym}</span></p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* ── Add client form ── */}
                <form onSubmit={handleCreate} className="glass-panel" style={{ position: 'sticky', top: '20px' }}>
                    <h3 style={{ marginBottom: '1.2rem' }}>تسجيل عميل جديد</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div><label htmlFor="cl_name">الاسم</label><input id="cl_name" type="text" className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div><label htmlFor="cl_store">المتجر/الشركة</label><input id="cl_store" type="text" className="input-glass" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} /></div>
                        <div><label htmlFor="cl_phone">رقم الهاتف</label><input id="cl_phone" type="text" className="input-glass" value={form.phone1} onChange={e => setForm({ ...form, phone1: e.target.value })} /></div>
                        <div><label htmlFor="cl_address">العنوان</label><textarea id="cl_address" className="input-glass" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>حفظ البيانات</button>
                    </div>
                </form>

                {/* ── Table Section ── */}
                <div className="glass-panel" style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <input
                                type="text"
                                className="input-glass"
                                placeholder="🔍 ابحث بالاسم، المتجر أو الرقم المسلسل..."
                                title="ابحث في قائمة العملاء"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ borderRadius: '12px', padding: '10px 15px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button onClick={exportToCSV} className="btn-secondary" title="تصدير قائمة العملاء إلى CSV" style={{ color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)' }}>📥 تصدير</button>
                            <label className="btn-secondary" title="استيراد عملاء من ملف CSV" style={{ color: '#66bb6a', borderColor: 'rgba(102, 187, 106, 0.3)', margin: 0, cursor: 'pointer' }}>
                                📤 استيراد
                                <input type="file" title="اختر ملف CSV" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    {loading ? <p>جاري تحميل البيانات...</p> : (
                        <>
                            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                                <table className="table-glass" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>العميل</th>
                                            <th>إجمالي الفواتير</th>
                                            <th>الرصيد الآجل</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedClients.map(cl => (
                                            <tr key={cl.id} style={{ background: 'rgba(255,255,255,0.02)', transition: '0.2s' }}>
                                                <td style={{ padding: '12px', color: '#666', fontSize: '0.75rem' }}>C-{cl.serial}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cl.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#777' }}>{cl.storeName || cl.phone1 || '-'}</div>
                                                </td>
                                                <td style={{ padding: '12px' }}>{cl.totalInvoices.toLocaleString()}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ color: cl.balanceDue > 0 ? 'var(--primary-color)' : '#66bb6a', fontWeight: 800 }}>
                                                        {cl.balanceDue.toLocaleString()} {sym}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => openPay(cl)}
                                                            className={`btn-secondary btn-sm ${cl.balanceDue > 0 ? '' : 'disabled'}`}
                                                            style={{
                                                                color: cl.balanceDue > 0 ? '#66bb6a' : '#555',
                                                                borderColor: cl.balanceDue > 0 ? 'rgba(102,187,106,0.3)' : 'rgba(255,255,255,0.1)'
                                                            }}
                                                        >
                                                            💵 تحصيل
                                                        </button>
                                                        <button onClick={() => printStatement(cl)} className="btn-secondary btn-sm" title="طباعة كشف حساب">🖨</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredClients.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>لا توجد نتائج للبحث.</div>}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>السابق</button>
                                    <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>صفحة {currentPage} من {totalPages}</span>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>التالي</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {payModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '15px' }}>
                    <div style={{ background: '#1c1e24', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>تسجيل مالي: {payModal.name}</h3>
                            <button onClick={() => setPayModal(null)} style={{ background: 'transparent', border: 'none', color: '#ff5252', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        {payMsg && <div style={{ background: 'rgba(102,187,106,0.1)', color: '#66bb6a', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>{payMsg}</div>}
                        <form onSubmit={handlePay}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div><label htmlFor="pay_amt">المبلغ المطلوب</label><input id="pay_amt" type="number" className="input-glass" value={payAmount} onChange={e => setPayAmount(e.target.value)} required style={{ fontSize: '1.4rem', fontWeight: 800, color: '#29b6f6' }} title="مبلغ التحصيل" /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div><label htmlFor="pay_chan">قناة الدفع</label>
                                        <select id="pay_chan" className="input-glass" value={payChannel} onChange={e => { setPayChannel(e.target.value); setPayTreasury(e.target.value === 'CASH' ? 'MAIN' : e.target.value === 'BANK' ? 'BANK' : 'VODAFONE_CASH'); }} title="اختر قناة الدفع">
                                            <option value="CASH">كاش</option><option value="BANK">بنك</option><option value="VODAFONE">فودافون كاش</option>
                                        </select>
                                    </div>
                                    <div><label htmlFor="pay_tres">الخزينة</label>
                                        <select id="pay_tres" className="input-glass" value={payTreasury} onChange={e => setPayTreasury(e.target.value)} title="اختر الخزينة">
                                            <option value="MAIN">الرئيسية</option><option value="BANK">البنكي</option><option value="VODAFONE_CASH">فودافون</option>
                                        </select>
                                    </div>
                                </div>
                                <div><label htmlFor="pay_inv">فاتورة (إن كانت دفعة لفاتورة)</label>
                                    <select id="pay_inv" className="input-glass" value={payInvoice} onChange={e => setPayInvoice(e.target.value)} title="اختر الفاتورة المرتبطة">
                                        <option value="">دفعة عامة</option>
                                        {payModal.invoices.filter(i => i.status !== 'PAID').map(inv => <option key={inv.id} value={inv.id}>{inv.invoiceNo} ({inv.total}{sym})</option>)}
                                    </select>
                                </div>
                                <button type="submit" disabled={paying} className="btn-primary" style={{ height: '50px', fontSize: '1.1rem' }}>{paying ? 'جاري الحفظ...' : 'تأكيد العملية'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
