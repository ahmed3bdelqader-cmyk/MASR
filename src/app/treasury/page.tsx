'use client';
import React, { useEffect, useState, useMemo } from 'react';

type Treasury = { id: string, type: string, name: string | null, color: string | null, balance: number, transactions: any[] };

export default function TreasuryPage() {
    const [treasuries, setTreasuries] = useState<Treasury[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: 'MAIN', transactionType: 'IN', amount: '', channel: 'CASH', description: '', refNumber: '' });
    const [success, setSuccess] = useState('');

    // ── Filter state ───────────────────────────────────────────────────────────
    const [fType, setFType] = useState('ALL');          // ALL | IN | OUT
    const [fTreasury, setFTreasury] = useState('ALL');        // ALL | MAIN | BANK | ...
    const [fSearch, setFSearch] = useState('');
    const [fDateFrom, setFDateFrom] = useState('');
    const [fDateTo, setFDateTo] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showManageChannels, setShowManageChannels] = useState(false);
    const [channelForm, setChannelForm] = useState({ type: '', name: '', color: '#29b6f6' });
    const [isSavingChannel, setIsSavingChannel] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        fetchTreasuries();
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin(u.role === 'ADMIN' || !u.role);
        } catch { }
    }, []);

    const fetchTreasuries = async () => {
        try {
            const res = await fetch('/api/treasury');
            const data = await res.json();
            setTreasuries(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); setTreasuries([]); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess('');
        try {
            const payload = { ...form, amount: Math.round(parseFloat(form.amount) * 100) / 100 };
            const res = await fetch('/api/treasury', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                setSuccess('تم تسجيل الحركة بنجاح وتحديث الرصيد!');
                setForm({ ...form, amount: '', description: '', refNumber: '' });
                fetchTreasuries();
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('⚠️ هل أنت متأكد من حذف هذه الحركة وتعديل الرصيد؟')) return;
        try {
            const res = await fetch(`/api/treasury?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSuccess('تم حذف الحركة وتعديل الرصيد بنجاح!');
                fetchTreasuries();
            } else {
                const data = await res.json();
                alert('❌ فشل الحذف: ' + data.error);
            }
        } catch (e) { console.error(e); }
    };

    const getTreasuryDisplay = (type: string) => {
        const tr = treasuries.find(t => t.type === type);
        if (tr && tr.name) return { label: tr.name, color: tr.color || '#fff' };

        switch (type) {
            case 'MAIN': return { label: '💵 الخزينة الرئيسية', color: '#66bb6a' };
            case 'EMPLOYEE_CUSTODY': return { label: '🧾 عهد الموظفين', color: '#29b6f6' };
            case 'ADVANCES': return { label: '💸 سلف العمال', color: '#ffa726' };
            case 'BANK': return { label: '🏦 الحساب البنكي', color: '#ab47bc' };
            case 'VODAFONE_CASH': return { label: '📱 فودافون كاش', color: '#e53935' };
            default: return { label: type, color: '#fff' };
        }
    };

    const handleSaveChannel = async () => {
        if (!channelForm.type || !channelForm.name) return alert('يرجى إدخال النوع والاسم');
        setIsSavingChannel(true);
        try {
            const res = await fetch('/api/treasury/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(channelForm)
            });
            if (res.ok) {
                fetchTreasuries();
                setChannelForm({ type: '', name: '', color: '#29b6f6' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingChannel(false);
        }
    };

    const handleDeleteChannel = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه القناة؟ لا يمكن حذف القنوات التي تحتوي على عمليات.')) return;
        try {
            const res = await fetch(`/api/treasury/channels?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'فشل الحذف');
            } else {
                fetchTreasuries();
            }
        } catch (e) { console.error(e); }
    };

    const CHANNEL_ICONS: Record<string, string> = { CASH: '💵', BANK: '🏦', VODAFONE: '📱' };
    const CHANNEL_LABEL: Record<string, string> = { CASH: 'كاش', BANK: 'بنكي', VODAFONE: 'فودافون' };

    // ── All transactions flat list ─────────────────────────────────────────────
    const allTxns = useMemo(() =>
        treasuries
            .flatMap(tr => tr.transactions.map((txn: any) => ({ ...txn, treasuryType: tr.type })))
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [treasuries]);

    // ── Apply filters ──────────────────────────────────────────────────────────
    const filteredTxns = useMemo(() => {
        return allTxns.filter((txn: any) => {
            if (fType !== 'ALL' && txn.type !== fType) return false;
            if (fTreasury !== 'ALL' && txn.treasuryType !== fTreasury) return false;
            if (fSearch && !txn.description?.includes(fSearch) && !txn.refNumber?.includes(fSearch)) return false;
            if (fDateFrom) {
                const d = new Date(txn.createdAt); d.setHours(0, 0, 0, 0);
                const from = new Date(fDateFrom); from.setHours(0, 0, 0, 0);
                if (d < from) return false;
            }
            if (fDateTo) {
                const d = new Date(txn.createdAt); d.setHours(23, 59, 59, 999);
                const to = new Date(fDateTo); to.setHours(23, 59, 59, 999);
                if (d > to) return false;
            }
            return true;
        });
    }, [allTxns, fType, fTreasury, fSearch, fDateFrom, fDateTo]);

    useEffect(() => { setCurrentPage(1); }, [fType, fTreasury, fSearch, fDateFrom, fDateTo]);

    const totalPages = Math.ceil(filteredTxns.length / pageSize);
    const paginatedTxns = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTxns.slice(start, start + pageSize);
    }, [filteredTxns, currentPage]);

    const filteredIn = filteredTxns.filter((t: any) => t.type === 'IN').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const filteredOut = filteredTxns.filter((t: any) => t.type === 'OUT').reduce((s: number, t: any) => s + Number(t.amount), 0);

    // ── Print filtered treasury report ────────────────────────────────────────
    const printTreasuryReport = () => {
        const win = window.open('', '_blank');
        if (!win) return;

        const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
        const t = JSON.parse(localStorage.getItem('erp_print_template') || '{}');
        const logo = t.printLogoCustom || s.appLogo || '';
        const accentColor = t.accentColor || s.primaryColor || '#ab47bc';
        const coName = t.companyName || s.appName || 'Stand Masr';
        const shapeMap: Record<string, string> = { circle: '50%', square: '0', rect: '6px', rounded: '10px' };
        const logoRadius = shapeMap[s.logoShape || 'rounded'] || '10px';
        const logoSizePx = t.printLogoSize || '70';

        const logoImg = logo && t.showLogo !== false
            ? `<img src="${logo}" style="width:${logoSizePx}px;height:${logoSizePx}px;object-fit:contain;border-radius:${logoRadius};display:block" />`
            : '';

        const filterSummary = [
            fType !== 'ALL' ? (fType === 'IN' ? 'إيرادات فقط' : 'مصروفات فقط') : '',
            fTreasury !== 'ALL' ? getTreasuryDisplay(fTreasury).label.replace(/[^أ-ي ]/g, '').trim() : '',
            fSearch ? `بحث: "${fSearch}"` : '',
            fDateFrom ? `من: ${fDateFrom}` : '',
            fDateTo ? `إلى: ${fDateTo}` : '',
        ].filter(Boolean).join(' | ') || 'الكل';

        const rows = filteredTxns.map((txn: any) => {
            const isIn = txn.type === 'IN';
            const m = getTreasuryDisplay(txn.treasuryType);
            return `
                <tr>
                    <td style="text-align:center;">${new Date(txn.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td style="color:${m.color};font-weight:bold">${m.label}</td>
                    <td style="color:${isIn ? '#1a7a3c' : '#c0392b'};font-weight:bold;text-align:center;">${isIn ? '⬆ وارد' : '⬇ صادر'}</td>
                    <td>${txn.description || '-'}</td>
                    <td style="text-align:center;">${txn.refNumber || '-'}</td>
                    <td style="color:${isIn ? '#1a7a3c' : '#c0392b'};font-weight:bold;text-align:center" dir="ltr">${isIn ? '+' : '-'}${Number(txn.amount).toLocaleString('ar-EG')}</td>
                </tr>`;
        }).join('');

        const headerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:2px solid ${accentColor};padding-bottom:15px">
                <div style="display:flex;gap:15px">
                    ${logoImg}
                    <div>
                        <h1 style="margin:0 0 3px;font-size:1.35rem;color:${accentColor}">${coName}</h1>
                        ${t.companySubtitle ? `<p style="margin:2px 0;color:#666;font-size:0.82rem">${t.companySubtitle}</p>` : ''}
                        ${t.companyPhone ? `<p style="margin:2px 0;font-size:0.8rem">📞 ${t.companyPhone}</p>` : ''}
                        ${t.companyAddress ? `<p style="margin:2px 0;font-size:0.8rem">📍 ${t.companyAddress}</p>` : ''}
                    </div>
                </div>
                <div style="text-align:left">
                    <h2 style="margin:0 0 5px;color:${accentColor};font-size:1.15rem">📊 تقرير الحركات المالية</h2>
                    <p style="margin:2px 0;font-size:0.83rem"><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
            </div>
        `;

        const balRows = treasuries.map(tr => {
            const b = tr.balance;
            const m = getTreasuryDisplay(tr.type);
            return `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px dashed #eee">
                      <span style="color:${m.color};font-weight:bold">${m.label}</span>
                      <span style="font-weight:bold;color:${b >= 0 ? '#1a7a3c' : '#c0392b'}" dir="ltr">${b.toLocaleString('ar-EG')} ج.م</span>
                    </div>`;
        }).join('');

        const totalBal = treasuries.reduce((s: number, tr) => s + tr.balance, 0);

        win.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير سجل الحركات المالية</title>
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; margin: 30px; font-size: 0.95rem; }
                    .filter-bar { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 10px 15px; font-size: 0.85rem; margin-bottom: 20px; color: #444; }
                    .flex-container { display: flex; gap: 30px; margin-bottom: 25px; }
                    .balances-box { width: 320px; border: 2px solid ${accentColor}; border-radius: 8px; padding: 15px; background: #fafafa; }
                    .summary-box { flex: 1; border: 2px solid ${accentColor}; border-radius: 8px; padding: 15px; background: #fafafa; display: flex; flex-direction: column; justify-content: center; }
                    table { width: 100%; border-collapse: collapse; margin-block: 20px; font-size: 0.9rem; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background-color: ${accentColor}; color: #fff; text-align: center; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .net-row td { background: #fdfdfd; font-weight: bold; font-size: 1.05rem; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body onload="window.print()">
                ${headerHTML}
                
                <div class="filter-bar"><strong>🔍 نطاق التقرير / الفلتر:</strong> ${filterSummary}</div>
                
                <div class="flex-container">
                    <div class="balances-box">
                        <h3 style="margin-top:0;margin-bottom:15px;color:${accentColor};border-bottom:1px solid #ddd;padding-bottom:5px">💰 ملخص الأرصدة الحالية في الخزائن</h3>
                        ${balRows}
                        <div style="margin-top:10px;padding-top:10px;border-top:2px solid ${accentColor};display:flex;justify-content:space-between;font-weight:bold;font-size:1.1rem;color:${accentColor}">
                            <span>السيولة الإجمالية :</span>
                            <span dir="ltr">${totalBal.toLocaleString('ar-EG')} ج.م</span>
                        </div>
                    </div>
                    
                    <div class="summary-box">
                        <h3 style="margin-top:0;color:${accentColor};text-align:center;margin-bottom:20px">صافي حركة التقرير الحالي (${filteredTxns.length} حركة)</h3>
                        <div style="display:flex;justify-content:space-around;text-align:center;margin-bottom:15px">
                            <div>
                                <div style="color:#777;font-size:0.9rem">إجمالي الوارد</div>
                                <div style="color:#1a7a3c;font-weight:bold;font-size:1.4rem" dir="ltr">+${filteredIn.toLocaleString('ar-EG')} ج.م</div>
                            </div>
                            <div>
                                <div style="color:#777;font-size:0.9rem">إجمالي الصادر</div>
                                <div style="color:#c0392b;font-weight:bold;font-size:1.4rem" dir="ltr">-${filteredOut.toLocaleString('ar-EG')} ج.م</div>
                            </div>
                        </div>
                        <div style="text-align:center;padding:15px;background:#eee;border-radius:8px;font-size:1.2rem;font-weight:bold">
                            <span style="color:#555">صافي الفترة المحددة: </span>
                            <span style="color:${filteredIn - filteredOut >= 0 ? '#1a7a3c' : '#c0392b'}" dir="ltr">${(filteredIn - filteredOut).toLocaleString('ar-EG')} ج.م</span>
                        </div>
                    </div>
                </div>

                <h3 style="color:${accentColor};margin:0 0 10px">📋 سجل تفاصيل الحركات</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width:90px">التاريخ</th>
                            <th style="width:140px">الخزينة المستهدفة</th>
                            <th style="width:80px">النوع</th>
                            <th>وصف ومعلومات الحركة</th>
                            <th style="width:120px">المرجع</th>
                            <th style="width:110px">القيمة (ج.م)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">لا توجد حركات مطابقة للبحث أو الفلتر المختار</td></tr>'}
                    </tbody>
                </table>
                
                <div style="margin-top:30px;text-align:center;color:#888;font-size:0.8rem;border-top:1px solid #eee;padding-top:10px">
                    ${t.footerText || 'تم إصدار التقرير بواسطة نظام Stand Masr ERP'}
                </div>
            </body>
            </html>
        `);
        win.document.close();
    };

    const hasFilters = fType !== 'ALL' || fTreasury !== 'ALL' || fSearch || fDateFrom || fDateTo;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>الخزينة المتعددة والمصروفات</h1>
                    <p>متابعة وتوزيع الأرصدة وإدارة التدفقات النقدية والبنكية</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {isAdmin && (
                        <button onClick={() => setShowManageChannels(true)} className="btn-secondary" style={{ padding: '10px 20px' }}>
                            ⚙️ إدارة الحسابات / القنوات
                        </button>
                    )}
                    <button onClick={printTreasuryReport} className="btn-primary" style={{ padding: '10px 20px', background: '#ab47bc' }}>
                        🖨 طباعة جرد الخزينة PDF
                    </button>
                </div>
            </header>

            {/* Balance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '1.5rem' }}>
                {treasuries.map(tr => {
                    const meta = getTreasuryDisplay(tr.type);
                    return (
                        <div key={tr.id} className="glass-panel" style={{ borderTop: `4px solid ${meta.color}`, textAlign: 'center', padding: '1rem' }}>
                            <h3 style={{ color: '#fff', marginBottom: '6px', fontSize: '0.85rem' }}>{meta.label}</h3>
                            <p style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, color: meta.color }}>
                                {tr.balance.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span style={{ fontSize: '0.75rem', color: '#aaa' }}>ج.م</span>
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Main Layout Area */}
            <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <form onSubmit={handleSubmit} className="glass-panel" style={{ alignSelf: 'start', width: '100%' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>تسجيل حركة (وارد/صادر)</h3>
                    {success && <div style={{ color: '#66bb6a', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label htmlFor="tr_acc">الحساب / الخزنة المستهدفة</label>
                            <select id="tr_acc" className="input-glass" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                {treasuries.map(tr => (
                                    <option key={tr.id} value={tr.type}>{getTreasuryDisplay(tr.type).label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tr_type">نوع الحركة</label>
                            <select id="tr_type" className="input-glass" value={form.transactionType} onChange={e => setForm({ ...form, transactionType: e.target.value })}>
                                <option value="IN">وارد (+ إيداع/تحصيل)</option>
                                <option value="OUT">صادر (- مصروف/شراء/سلفة)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tr_chan">قناة الدفع</label>
                            <select id="tr_chan" className="input-glass" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value, refNumber: '' })}>
                                <option value="CASH">نقدي (كاش)</option>
                                <option value="BANK">تحويل بنكي</option>
                                <option value="VODAFONE">فودافون كاش</option>
                            </select>
                        </div>
                        {(form.channel === 'BANK' || form.channel === 'VODAFONE') && (
                            <div className="animate-fade-in" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <label htmlFor="tr_ref" style={{ color: '#29b6f6' }}>{form.channel === 'BANK' ? 'اسم البنك / رقم الحساب المحول منه' : 'رقم الموبايل المحول منه'}</label>
                                <input id="tr_ref" type="text" className="input-glass" value={form.refNumber} onChange={e => setForm({ ...form, refNumber: e.target.value })} placeholder="البيان" required />
                            </div>
                        )}
                        <div>
                            <label htmlFor="tr_amt">المبلغ (جنيه)</label>
                            <input id="tr_amt" type="number" step="0.01" className="input-glass" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0.01" />
                        </div>
                        <div>
                            <label htmlFor="tr_desc">الوصف</label>
                            <input id="tr_desc" type="text" className="input-glass" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', background: form.transactionType === 'IN' ? '#66bb6a' : '#E35E35' }}>
                            {form.transactionType === 'IN' ? 'تسجيل كإيراد +' : 'خصم كمصروف -'}
                        </button>
                    </div>
                </form>

                <div className="glass-panel">
                    {/* ── Filter Bar ── */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0 }}>
                                سجل الحركات المالية
                                {hasFilters && <span style={{ fontSize: '0.78rem', color: '#ffa726', marginRight: '8px' }}>🔍 فلتر نشط</span>}
                            </h3>
                            {hasFilters && (
                                <button onClick={() => { setFType('ALL'); setFTreasury('ALL'); setFSearch(''); setFDateFrom(''); setFDateTo(''); }}
                                    style={{ padding: '4px 12px', background: 'rgba(255,82,82,0.1)', border: '1px solid #ff5252', color: '#ff5252', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                                    ✕ مسح الفلتر
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {/* Type filter */}
                            {[{ k: 'ALL', l: 'الكل' }, { k: 'IN', l: '⬆ إيرادات' }, { k: 'OUT', l: '⬇ مصروفات' }].map(opt => (
                                <button key={opt.k} onClick={() => setFType(opt.k)}
                                    style={{ padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.81rem', fontWeight: fType === opt.k ? 700 : 400, background: fType === opt.k ? (opt.k === 'IN' ? '#66bb6a' : opt.k === 'OUT' ? '#E35E35' : 'var(--primary-color)') : 'transparent', color: fType === opt.k ? '#fff' : '#aaa', border: `1px solid ${fType === opt.k ? 'transparent' : 'rgba(255,255,255,0.15)'}` }}>
                                    {opt.l}
                                </button>
                            ))}
                            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                            {/* Treasury filter */}
                            <label htmlFor="f_tr" className="sr-only">تصفية حسب الخزينة</label>
                            <select id="f_tr" value={fTreasury} onChange={e => setFTreasury(e.target.value)}
                                style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ddd', padding: '5px 10px', fontFamily: 'inherit', fontSize: '0.81rem', cursor: 'pointer' }} title="اختر الخزينة">
                                <option value="ALL">🏛 كل الخزائن</option>
                                {treasuries.map(tr => (
                                    <option key={tr.id} value={tr.type}>{getTreasuryDisplay(tr.type).label.replace(/[^أ-ي ]/g, '').trim()}</option>
                                ))}
                            </select>
                            {/* Search */}
                            <label htmlFor="f_search" className="sr-only">بحث في سجل الحركات</label>
                            <input id="f_search" type="text" value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="بحث في الوصف.."
                                style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ddd', padding: '5px 10px', fontFamily: 'inherit', fontSize: '0.81rem', minWidth: '130px', flex: 1 }} title="البحث في الوصف" />
                            {/* Date range */}
                            <label htmlFor="f_d1" className="sr-only">من تاريخ</label>
                            <input id="f_d1" type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)}
                                style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ddd', padding: '5px 8px', fontFamily: 'inherit', fontSize: '0.79rem' }} title="من تاريخ" />
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>—</span>
                            <label htmlFor="f_d2" className="sr-only">إلى تاريخ</label>
                            <input id="f_d2" type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)}
                                style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ddd', padding: '5px 8px', fontFamily: 'inherit', fontSize: '0.79rem' }} title="إلى تاريخ" />
                        </div>

                        {/* Summary of filtered */}
                        {filteredTxns.length > 0 && (
                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.83rem', color: '#919398' }}>{filteredTxns.length} حركة معروضة</span>
                                <span style={{ fontSize: '0.83rem', color: '#66bb6a' }}>⬆ إيرادات: +{filteredIn.toFixed(0)} ج.م</span>
                                <span style={{ fontSize: '0.83rem', color: '#E35E35' }}>⬇ مصروفات: -{filteredOut.toFixed(0)} ج.م</span>
                                <span style={{ fontSize: '0.83rem', color: filteredIn - filteredOut >= 0 ? '#66bb6a' : '#E35E35', fontWeight: 'bold' }}>
                                    صافي: {(filteredIn - filteredOut).toFixed(0)} ج.م
                                </span>
                            </div>
                        )}
                    </div>

                    {loading ? <p>جاري التحميل...</p> : (
                        <div className="table-container" style={{ maxHeight: '500px' }}>
                            <table className="table-glass">
                                <thead>
                                    <tr>
                                        <th>تاريخ الحركة</th>
                                        <th>الخزنة</th>
                                        <th>النوع</th>
                                        <th>القناة والمرجع</th>
                                        <th>الوصف</th>
                                        <th>القيمة</th>
                                        {isAdmin && <th>إجراءات</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTxns.map((txn: any) => {
                                        const isIn = txn.type === 'IN';
                                        const isCollection = txn.clientPaymentId;
                                        return (
                                            <tr key={txn.id} style={{ background: isCollection ? 'rgba(41,182,246,0.04)' : 'transparent' }}>
                                                <td style={{ fontSize: '0.82rem' }}>{new Date(txn.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}<br /><span style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(txn.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></td>
                                                <td><span style={{ color: getTreasuryDisplay(txn.treasuryType).color, fontSize: '0.82rem' }}>{getTreasuryDisplay(txn.treasuryType).label}</span></td>
                                                <td><span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', background: isIn ? 'rgba(102,187,106,0.15)' : 'rgba(227,94,53,0.15)', color: isIn ? '#66bb6a' : '#E35E35' }}>{isIn ? (isCollection ? '💵 تحصيل' : '⬆ إيداع') : '⬇ صرف'}</span></td>
                                                <td><span style={{ fontSize: '0.82rem' }}>{CHANNEL_ICONS[txn.channel] || ''} {CHANNEL_LABEL[txn.channel] || txn.channel}</span>{txn.refNumber && <div style={{ fontSize: '0.75rem', color: '#888' }}>({txn.refNumber})</div>}</td>
                                                <td style={{ fontSize: '0.82rem', maxWidth: '200px' }}>{txn.description}</td>
                                                <td style={{ fontWeight: 'bold', color: isIn ? '#66bb6a' : '#E35E35', fontSize: '1rem' }}>{isIn ? '+' : '-'}{Number(txn.amount).toFixed(0)}</td>
                                                {isAdmin && (
                                                    <td>
                                                        <button onClick={() => handleDelete(txn.id)} style={{ background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: '1.2rem' }} title="حذف">🗑️</button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {filteredTxns.length === 0 && (
                                        <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>
                                            {allTxns.length === 0 ? 'لا توجد حركات مسجلة.' : 'لا توجد حركات تطابق معايير الفلترة.'}
                                        </td></tr>
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
            </div>
            {/* --- Manage Channels Modal --- */}
            {showManageChannels && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0, color: '#f59e0b' }}>⚙️ إدارة قنوات وحسابات الخزينة</h2>
                            <button onClick={() => setShowManageChannels(false)} style={{ background: 'transparent', border: 'none', color: '#ff5252', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', gap: '10px', marginBottom: '2rem', alignItems: 'end', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                            <div>
                                <label htmlFor="ch_code" style={{ fontSize: '0.8rem' }}>كود القناة (English)</label>
                                <input id="ch_code" type="text" className="input-glass" placeholder="مثلاً: OFFICE_SAFE" value={channelForm.type} onChange={e => setChannelForm({ ...channelForm, type: e.target.value.toUpperCase().replace(/\s/g, '_') })} />
                            </div>
                            <div>
                                <label htmlFor="ch_name" style={{ fontSize: '0.8rem' }}>اسم العرض (عربي)</label>
                                <input id="ch_name" type="text" className="input-glass" placeholder="مثلاً: خزينة المكتب" value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label htmlFor="ch_clr" style={{ fontSize: '0.8rem' }}>اللون</label>
                                <input id="ch_clr" type="color" className="input-glass" style={{ padding: '0', height: '42px' }} value={channelForm.color} onChange={e => setChannelForm({ ...channelForm, color: e.target.value })} />
                            </div>
                            <button className="btn-primary" onClick={handleSaveChannel} disabled={isSavingChannel}>
                                {isSavingChannel ? '...' : '➕ حفظ'}
                            </button>
                        </div>

                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>القنوات الحالية:</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {treasuries.map(tr => (
                                <div key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '10px', borderLeft: `5px solid ${tr.color || '#fff'}` }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{tr.name || tr.type}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Code: {tr.type} | الرصيد: {tr.balance.toLocaleString()} ج.م</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setChannelForm({ type: tr.type, name: tr.name || tr.type, color: tr.color || '#29b6f6' })} style={{ background: 'transparent', border: '1px solid #ffa726', color: '#ffa726', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>تعديل</button>
                                        <button onClick={() => handleDeleteChannel(tr.id)} style={{ background: 'transparent', border: '1px solid #ff5252', color: '#ff5252', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
