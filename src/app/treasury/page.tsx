'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/core/reportTemplate';
import ExpensesView from '@/components/ExpensesView';
import { banksData, FinancialInstitution } from '@/core/banksData';


type Treasury = { id: string, type: string, name: string | null, color: string | null, bankId: string | null, logoPath: string | null, balance: number, transactions: any[] };

export default function TreasuryPage() {
    const sym = useMemo(() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } }, []);
    const [treasuries, setTreasuries] = useState<Treasury[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: 'MAIN', transactionType: 'IN', amount: '', channel: 'CASH', description: '', refNumber: '' });
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'TREASURY' | 'EXPENSES'>('TREASURY');

    // ── Filter state ───────────────────────────────────────────────────────────
    const [fType, setFType] = useState('ALL');          // ALL | IN | OUT
    const [fTreasury, setFTreasury] = useState('ALL');        // ALL | MAIN | BANK | ...
    const [fSearch, setFSearch] = useState('');
    const [fDateFrom, setFDateFrom] = useState('');
    const [fDateTo, setFDateTo] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showManageChannels, setShowManageChannels] = useState(false);
    const [channelForm, setChannelForm] = useState({ type: '', name: '', color: '#29b6f6', bankId: '', logoPath: '' });
    const [bankSearch, setBankSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSavingChannel, setIsSavingChannel] = useState(false);
    const [showBalances, setShowBalances] = useState(false);

    // Pagination
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5); // Default 5

    useEffect(() => {
        fetchTreasuries();
        // Load saved page size
        const saved = localStorage.getItem('erp_treasury_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));

        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);
        } catch { }

        const handleReload = () => fetchTreasuries();
        window.addEventListener('reloadTreasury', handleReload);
        return () => window.removeEventListener('reloadTreasury', handleReload);
    }, []);

    const fetchTreasuries = async () => {
        try {
            const res = await fetch('/api/treasury');
            let data = await res.json();
            if (Array.isArray(data)) {
                let needsRefresh = false;
                for (let tr of data) {
                    if (!tr.bankId && tr.type !== 'MAIN') {
                        const nameLower = (tr.name || tr.type).toLowerCase();
                        let matchedBank = null;
                        if (nameLower.includes('cib')) matchedBank = banksData.find(b => b.id === 'CIB');
                        else if (nameLower.includes('أهلي') || nameLower.includes('nbe')) matchedBank = banksData.find(b => b.id === 'NBE');
                        else if (nameLower.includes('مصر') || nameLower.includes('misr')) matchedBank = banksData.find(b => b.id === 'BANQUE_MISR');
                        else if (nameLower.includes('qnb')) matchedBank = banksData.find(b => b.id === 'QNB');
                        else if (nameLower.includes('اسكندرية') || nameLower.includes('alex')) matchedBank = banksData.find(b => b.id === 'ALEX_BANK');
                        else if (nameLower.includes('قاهرة') || nameLower.includes('caire')) matchedBank = banksData.find(b => b.id === 'BANQUE_DU_CAIRE');
                        else if (nameLower.includes('فودافون') || nameLower.includes('vodafone')) matchedBank = banksData.find(b => b.id === 'VODAFONE_CASH');
                        else if (nameLower.includes('أورانج') || nameLower.includes('orange')) matchedBank = banksData.find(b => b.id === 'ORANGE_CASH');
                        else if (nameLower.includes('اتصالات') || nameLower.includes('etisalat')) matchedBank = banksData.find(b => b.id === 'ETISALAT_CASH');
                        else if (nameLower.includes('انستا') || nameLower.includes('instapay')) matchedBank = banksData.find(b => b.id === 'INSTAPAY');

                        if (matchedBank) {
                            try {
                                await fetch('/api/treasury/channels', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: tr.type, name: tr.name, color: matchedBank.color || tr.color, bankId: matchedBank.id, logoPath: matchedBank.logoPath })
                                });
                                needsRefresh = true;
                            } catch (e) { }
                        }
                    }
                }
                if (needsRefresh) {
                    const res2 = await fetch('/api/treasury');
                    data = await res2.json();
                }
                setTreasuries(data);
            }
        } catch (e) { console.error(e); setTreasuries([]); } finally { setLoading(false); }
    };

    const handleSelectBank = (bank: FinancialInstitution) => {
        setBankSearch(bank.name);
        setIsDropdownOpen(false);
        if (bank.type === 'CUSTOM') {
            setChannelForm({ ...channelForm, bankId: 'CUSTOM', type: '', name: '', color: bank.color, logoPath: '' });
        } else {
            setChannelForm({ ...channelForm, type: bank.defaultCode, name: bank.name, color: bank.color, bankId: bank.id, logoPath: bank.logoPath });
        }
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
        console.log('Attempting to save channel:', channelForm);
        if (!channelForm.type || !channelForm.name) {
            console.warn('Missing type or name:', channelForm);
            return alert('يرجى إدخال النوع والاسم');
        }
        setIsSavingChannel(true);
        try {
            const res = await fetch('/api/treasury/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(channelForm)
            });
            console.log('API Response status:', res.status);
            if (res.ok) {
                await fetchTreasuries();
                setChannelForm({ type: '', name: '', color: '#29b6f6', bankId: '', logoPath: '' });
                setBankSearch('');
                alert('✅ تم حفظ القناة بنجاح!');
            } else {
                const data = await res.json();
                console.error('API Error details:', data);
                alert('❌ غير قادر على الحفظ: ' + (data.error || 'حدث خطأ غير معروف'));
            }
        } catch (e) {
            console.error('Fetch exception:', e);
            alert('❌ فشل الاتصال بالخادم، يرجى المحاولة لاحقاً');
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

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_treasury_pageSize', val);
        setCurrentPage(1);
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

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredTxns.length / pageSize);
    const paginatedTxns = useMemo(() => {
        if (pageSize === 'ALL') return filteredTxns;
        const start = (currentPage - 1) * pageSize;
        return filteredTxns.slice(start, start + pageSize);
    }, [filteredTxns, currentPage, pageSize]);

    const filteredIn = filteredTxns.filter((t: any) => t.type === 'IN').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const filteredOut = filteredTxns.filter((t: any) => t.type === 'OUT').reduce((s: number, t: any) => s + Number(t.amount), 0);

    // ── Build export props for treasury list ─────────────────────────────
    const buildTreasuryExportProps = () => {
        if (filteredTxns.length === 0) return null;

        const tableHeaders = ['التاريخ', 'الخزينة المستهدفة', 'النوع', 'وصف الحركة', 'المرجع', `القيمة (${sym})`];
        const tableRows = filteredTxns.map((txn: any) => {
            const isIn = txn.type === 'IN';
            const m = getTreasuryDisplay(txn.treasuryType);
            return [
                new Date(txn.createdAt).toLocaleDateString('ar-EG'),
                m.label.replace(/[^أ-ي0-9a-zA-Z ]/g, '').trim(),
                isIn ? 'وارد' : 'صادر',
                txn.description || '-',
                txn.refNumber || '-',
                `${isIn ? '+' : '-'}${Number(txn.amount).toLocaleString('ar-EG')}`
            ];
        });

        const filterSummaryText = [
            fType !== 'ALL' ? (fType === 'IN' ? 'إيرادات فقط' : 'مصروفات فقط') : '',
            fTreasury !== 'ALL' ? getTreasuryDisplay(fTreasury).label.replace(/[^أ-ي0-9a-zA-Z ]/g, '').trim() : '',
            fSearch ? `بحث: "${fSearch}"` : '',
            fDateFrom ? `من: ${fDateFrom}` : '',
            fDateTo ? `إلى: ${fDateTo}` : ''
        ].filter(Boolean).join(' | ') || 'الكل';

        const totalSysBalance = treasuries.reduce((s: number, tr) => s + tr.balance, 0);

        return {
            documentTitle: 'تقرير الحركات المالية (الخزينة)',
            fileName: `Treasury_Report_${new Date().toISOString().split('T')[0]}`,
            metaInfo: [
                ['تاريخ التقرير', new Date().toLocaleDateString('ar-EG')],
                ['نطاق الفلتر', filterSummaryText],
                ['إجمالي حركات التقرير', String(filteredTxns.length)]
            ] as [string, string][],
            tableHeaders,
            tableRows,
            summaryRows: [
                ['إجمالي الإيداعات', `${filteredIn.toLocaleString('ar-EG')} ${sym}`],
                ['إجمالي السحوبات', `${filteredOut.toLocaleString('ar-EG')} ${sym}`],
                ['صافي حركة التقرير', `${(filteredIn - filteredOut).toLocaleString('ar-EG')} ${sym}`],
                ['السيولة الإجمالية لكل الخزائن', `${totalSysBalance.toLocaleString('ar-EG')} ${sym}`]
            ] as [string, string][]
        };
    };

    const handlePrintTreasuryReport = async () => {
        const props = buildTreasuryExportProps();
        if (!props) return;

        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';
        const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

        const rowsHtml = props.tableRows.map(row => `
            <tr>
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td style="text-align:center"><span style="padding:2px 8px;border-radius:6px;font-size:0.8rem;background:${row[2] === 'وارد' ? '#dcfce7' : '#fee2e2'};color:${row[2] === 'وارد' ? '#166534' : '#991b1b'}">${row[2]}</span></td>
                <td>${row[3]}</td>
                <td>${row[4]}</td>
                <td style="text-align:center;font-weight:700;color:${row[5].startsWith('+') ? '#166534' : '#991b1b'}">${row[5]}</td>
            </tr>
        `).join('');

        const summaryHtml = `
            <div style="margin-top: 30px; width: 350px; margin-right: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                ${props.summaryRows.map(s => `
                    <div style="display:flex;justify-content:space-between;padding:12px 15px;border-bottom:1px solid #eee;">
                        <span style="color:#64748b; font-size: 0.9rem;">${s[0]}</span>
                        <span style="font-weight:800;color:#1e293b; font-size: 1rem;">${s[1]}</span>
                    </div>
                `).join('')}
            </div>
        `;

        const bodyHtml = `
            <div style="margin-bottom: 20px; font-size: 0.85rem; color: #666; background: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                ${props.metaInfo.map(m => `<div><strong>${m[0]}:</strong> ${m[1]}</div>`).join('')}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th><th>الخزينة</th><th>النوع</th><th>البيان</th><th>المرجع</th><th>القيمة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            ${summaryHtml}
        `;

        const html = generatePrintHtml(bodyHtml, props.documentTitle, config);

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

    const hasFilters = fType !== 'ALL' || fTreasury !== 'ALL' || fSearch || fDateFrom || fDateTo;

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">💰 الخزينة المتعددة والمصروفات</h1>
                    <p className="page-subtitle">متابعة وتوزيع الأرصدة وإدارة التدفقات النقدية والبنكية في الوقت الفعلي</p>
                </div>
                <div className="header-actions">
                    {isAdmin && (
                        <button onClick={() => setShowManageChannels(true)} className="btn-modern btn-secondary">
                            ⚙️ إدارة القنوات
                        </button>
                    )}
                    <button onClick={handlePrintTreasuryReport} className="btn-modern btn-primary">
                        🖨️ طباعة تقرير الحركة
                    </button>
                </div>
            </header>

            {/* Balance Cards */}
            <div className="treasury-status-grid">
                {treasuries.map(tr => {
                    const meta = getTreasuryDisplay(tr.type);
                    return (
                        <div key={tr.id} className="glass-panel balance-card" style={{ borderTop: `4px solid ${meta.color}`, cursor: 'pointer', userSelect: 'none' }} onClick={() => setShowBalances(!showBalances)} title="انقر لإظهار/إخفاء الأرصدة">
                            <h3 className="card-label">{meta.label}</h3>
                            <div className="card-amount" style={{ color: meta.color }}>
                                {showBalances ? tr.balance.toLocaleString('en-US') : '****'} <span className="card-currency">{sym}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="tabs-nav-treasury">
                <button onClick={() => setActiveTab('TREASURY')} className={`btn-modern tab-btn ${activeTab === 'TREASURY' ? 'btn-primary' : 'btn-secondary'}`}>
                    🏦 حركة الخزائن العام
                </button>
                <button onClick={() => setActiveTab('EXPENSES')} className={`btn-modern tab-btn expenses-btn ${activeTab === 'EXPENSES' ? 'active' : ''}`}>
                    🧾 تسجيل مصروفات
                </button>
            </div>

            {/* Main Layout Area */}
            {activeTab === 'TREASURY' ? (
                <div className="reports-grid-treasury">
                    <form onSubmit={handleSubmit} className="glass-panel report-sidebar-menu form-sticky">
                        <h3 className="settings-section-label txn-form-title">تسجيل حركة جديدة</h3>
                        {success && <div className="sh-badge paid txn-success-badge">{success}</div>}
                        <div className="txn-fields-wrapper">
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
                                <div className="animate-fade-in channel-details-box">
                                    <label htmlFor="tr_ref" className="channel-ref-label">{form.channel === 'BANK' ? 'اسم البنك / رقم الحساب المحول منه' : 'رقم الموبايل المحول منه'}</label>
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
                            <button type="submit" className={`btn-modern btn-submit-txn ${form.transactionType === 'IN' ? 'in-txn' : 'out-txn'}`}>
                                {form.transactionType === 'IN' ? 'تسجيل كإيراد +' : 'خصم كمصروف -'}
                            </button>
                        </div>
                    </form>

                    <div className="glass-panel results-view-panel">
                        {/* ── Filter Bar ── */}
                        <div className="txn-list-header-wrapper">
                            <div className="txn-list-title-row">
                                <h3 className="txn-list-title">
                                    سجل الحركات المالية
                                    {hasFilters && <span className="active-filter-txt">🔍 فلتر نشط</span>}
                                </h3>
                                {hasFilters && (
                                    <button onClick={() => { setFType('ALL'); setFTreasury('ALL'); setFSearch(''); setFDateFrom(''); setFDateTo(''); }}
                                        className="clear-filter-btn">
                                        ✕ مسح الفلتر
                                    </button>
                                )}
                            </div>

                            <div className="filter-pills-bar">
                                {/* Type filter */}
                                {[{ k: 'ALL', l: 'الكل' }, { k: 'IN', l: '⬆ إيرادات' }, { k: 'OUT', l: '⬇ مصروفات' }].map(opt => (
                                    <button key={opt.k} onClick={() => setFType(opt.k)}
                                        className={`filter-pill ${fType === opt.k ? 'active' : ''} ${fType === opt.k ? (opt.k === 'IN' ? 'in-pill' : opt.k === 'OUT' ? 'out-pill' : 'primary-pill') : ''}`}>
                                        {opt.l}
                                    </button>
                                ))}
                                <div className="filter-divider" />
                                {/* Treasury filter */}
                                <label htmlFor="f_tr" className="sr-only">تصفية حسب الخزينة</label>
                                <select id="f_tr" value={fTreasury} onChange={e => setFTreasury(e.target.value)}
                                    className="filter-select" title="اختر الخزينة">
                                    <option value="ALL">🏛 كل الخزائن</option>
                                    {treasuries.map(tr => (
                                        <option key={tr.id} value={tr.type}>{getTreasuryDisplay(tr.type).label.replace(/[^أ-ي ]/g, '').trim()}</option>
                                    ))}
                                </select>
                                {/* Search */}
                                <label htmlFor="f_search" className="sr-only">بحث في سجل الحركات</label>
                                <input id="f_search" type="text" value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="بحث في الوصف.."
                                    className="filter-input search-input" title="البحث في الوصف" />
                                {/* Date range */}
                                <label htmlFor="f_d1" className="sr-only">من تاريخ</label>
                                <input id="f_d1" type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)}
                                    className="filter-date" title="من تاريخ" />
                                <span className="date-separator">—</span>
                                <label htmlFor="f_d2" className="sr-only">إلى تاريخ</label>
                                <input id="f_d2" type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)}
                                    className="filter-date" title="إلى تاريخ" />
                            </div>

                            {/* Summary of filtered */}
                            {filteredTxns.length > 0 && (
                                <div className="filter-summary-row">
                                    <span className="results-count-txt">{filteredTxns.length} حركة معروضة</span>
                                    <span className="sh-badge paid summary-badge">إيرادات: +{filteredIn.toLocaleString('en-US')} {sym}</span>
                                    <span className="sh-badge unpaid summary-badge">مصروفات: -{filteredOut.toLocaleString('en-US')} {sym}</span>
                                    <span className={`net-change-val ${filteredIn - filteredOut >= 0 ? 'positive' : 'negative'}`}>
                                        صافي: {(filteredIn - filteredOut).toLocaleString('en-US')} {sym}
                                    </span>
                                </div>
                            )}
                        </div>

                        {loading ? <p>جاري التحميل...</p> : (
                            <div className="table-container table-wrapper-treasury">
                                <table className="table-glass high-density responsive-cards treasury-table">
                                    <thead>
                                        <tr>
                                            <th>التاريخ</th>
                                            <th>الخزنة</th>
                                            <th>النوع</th>
                                            <th>القناة</th>
                                            <th>البيان</th>
                                            <th style={{ textAlign: 'center' }}>القيمة</th>
                                            {isAdmin && <th style={{ textAlign: 'center' }}>إجراءات</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedTxns.map((txn: any) => {
                                            const isIn = txn.type === 'IN';
                                            const isCollection = txn.clientPaymentId;
                                            return (
                                                <tr key={txn.id} className={isCollection ? 'txn-row-collection' : ''}>
                                                    <td data-label="التاريخ" className="txn-datetime">
                                                        {new Date(txn.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        <br />
                                                        <span className="txn-time">{new Date(txn.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td data-label="الخزنة">
                                                        <span className="txn-treasury-btn" style={{ color: getTreasuryDisplay(txn.treasuryType).color }}>{getTreasuryDisplay(txn.treasuryType).label}</span>
                                                    </td>
                                                    <td data-label="النوع">
                                                        <span className={`txn-type-badge ${isIn ? 'in' : 'out'}`}>{isIn ? (isCollection ? '💵 تحصيل' : '⬆ إيداع') : '⬇ صرف'}</span>
                                                    </td>
                                                    <td data-label="القناة">
                                                        <span className="txn-channel-badge">{CHANNEL_ICONS[txn.channel] || ''} {CHANNEL_LABEL[txn.channel] || txn.channel}</span>
                                                        {txn.refNumber && <div className="txn-ref-txt">({txn.refNumber})</div>}
                                                    </td>
                                                    <td data-label="البيان" className="txn-desc-cell">{txn.description}</td>
                                                    <td data-label="القيمة" className="txn-amount-td">
                                                        <span className={`txn-amount-val ${isIn ? 'positive' : 'negative'}`}>
                                                            {isIn ? '+' : '-'}{Number(txn.amount).toLocaleString('en-US')}
                                                        </span>
                                                    </td>
                                                    {isAdmin && (
                                                        <td data-label="إجراءات" className="txn-actions-td">
                                                            <button onClick={() => handleDelete(txn.id)} className="btn-modern btn-danger btn-sm trash-btn" title="حذف">🗑️</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {filteredTxns.length === 0 && (
                                            <tr><td colSpan={isAdmin ? 7 : 6} className="empty-results-cell">
                                                {allTxns.length === 0 ? 'لا توجد حركات مسجلة.' : 'لا توجد حركات تطابق معايير الفلترة.'}
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                                <div className="pagination-controls-treasury">
                                    <div className="results-count-selector">
                                        <span className="page-size-label">عدد النتائج:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => handlePageSizeChange(e.target.value)}
                                            className="page-size-dropdown"
                                            aria-label="Items per page"
                                        >
                                            <option value={5}>5</option>
                                            <option value={15}>15</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                            <option value="ALL">الكل</option>
                                        </select>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="page-nav-wrapper">
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary nav-btn">&rarr; السابق</button>
                                            <div className="page-indicator">
                                                {currentPage} / {totalPages}
                                            </div>
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary nav-btn">التالي &larr;</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <ExpensesView sym={sym} isAdmin={isAdmin} />
            )}

            {showManageChannels && (
                <div className="confirm-overlay animate-fade-in modal-overlay-shell" onClick={() => setShowManageChannels(false)}>
                    <div className="glass-panel confirm-modal modal-content-shell" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-shell">
                            <h2 className="modal-title-shell">⚙️ إدارة قنوات وحسابات الخزينة</h2>
                            <button onClick={() => setShowManageChannels(false)} className="modal-close-btn">✕</button>
                        </div>

                        <div className="bank-search-wrapper">
                            <label className="field-hint-mini">البنك أو المحفظة الذكية (اختياري)</label>
                            <div className="bank-input-group">
                                {channelForm.logoPath && <img src={channelForm.logoPath} alt="Logo" className="bank-logo-mini" onError={(e) => e.currentTarget.style.display = 'none'} />}
                                <input
                                    type="text"
                                    className="input-glass bank-search-input"
                                    placeholder="ابحث عن البنك أو المحفظة..."
                                    value={bankSearch}
                                    onChange={e => { setBankSearch(e.target.value); setIsDropdownOpen(true); }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    // small delay to allow click on dropdown items
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                />
                                <span className="bank-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>▼</span>
                            </div>

                            {isDropdownOpen && (
                                <div className="banks-dropdown-menu">
                                    {banksData.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.defaultCode.toLowerCase().includes(bankSearch.toLowerCase())).map(bank => (
                                        <div key={bank.id} className="bank-option" onClick={() => handleSelectBank(bank)}>
                                            {bank.logoPath ? <img src={bank.logoPath} alt={bank.name} className="bank-opt-logo" onError={(e) => e.currentTarget.style.display = 'none'} /> : <div className="bank-opt-placeholder">🏦</div>}
                                            <div className="bank-info-group">
                                                <div className="bank-opt-name">{bank.name}</div>
                                                <div className="bank-type-label">{bank.type === 'BANK' ? 'بنك' : bank.type === 'WALLET' ? 'محفظة' : 'مخصص'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="channel-entry-grid">
                            <div className="entry-field">
                                <label className="field-hint-mini">كود القناة</label>
                                <input type="text" className="input-glass" placeholder="OFFICE_SAFE" value={channelForm.type} onChange={e => setChannelForm({ ...channelForm, type: e.target.value.toUpperCase().replace(/\s/g, '_') })} />
                            </div>
                            <div className="entry-field">
                                <label className="field-hint-mini">اسم العرض</label>
                                <input type="text" className="input-glass" placeholder="خزينة المكتب" value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} />
                            </div>
                            <div className="entry-field">
                                <label className="field-hint-mini">اللون</label>
                                <input type="color" className="input-glass color-picker-input" value={channelForm.color} onChange={e => setChannelForm({ ...channelForm, color: e.target.value })} />
                            </div>
                            <button className="btn-modern btn-primary save-channel-btn" onClick={handleSaveChannel} disabled={isSavingChannel}>
                                {isSavingChannel ? '...' : '➕ حفظ'}
                            </button>
                        </div>

                        <h3 className="settings-section-label">القنوات الحالية</h3>
                        <div className="channels-list-grid">
                            {treasuries.map(tr => (
                                <div key={tr.id} className="glass-panel channel-item-card" style={tr.logoPath ? {} : { borderLeft: `5px solid ${tr.color || '#fff'}` }}>
                                    <div className="channel-item-info">
                                        {tr.logoPath && (
                                            <div className="channel-logo-boxed">
                                                <img src={tr.logoPath} alt="Logo" className="channel-logo-img" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="channel-item-name">{tr.name || tr.type}</div>
                                            <div className="channel-item-meta">{tr.type} | الرصيد: {tr.balance.toLocaleString('en-US')} {sym}</div>
                                        </div>
                                    </div>
                                    <div className="channel-item-actions">
                                        <button onClick={() => {
                                            setChannelForm({ type: tr.type, name: tr.name || tr.type, color: tr.color || '#29b6f6', bankId: tr.bankId || '', logoPath: tr.logoPath || '' });
                                            const bk = banksData.find(b => b.id === tr.bankId);
                                            setBankSearch(bk ? bk.name : '');
                                        }} className="btn-modern btn-secondary btn-sm edit-channel-btn">✏️</button>
                                        <button onClick={() => handleDeleteChannel(tr.id)} className="btn-modern btn-danger btn-sm">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .treasury-status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 15px;
                    margin-bottom: 1.5rem;
                }
                .balance-card {
                    text-align: center;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: transform 0.3s;
                }
                .balance-card:hover {
                    transform: translateY(-5px);
                }
                .card-label {
                    color: var(--text-muted);
                    margin-bottom: 0;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .card-amount {
                    font-size: 1.6rem;
                    font-weight: 800;
                }
                .card-currency {
                    font-size: 0.8rem;
                    opacity: 0.7;
                }
                .tabs-nav-treasury {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 1.5rem;
                }
                .tab-btn {
                    padding: 10px 24px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 700;
                }
                .expenses-btn.active {
                    background: #E35E35;
                    border-color: rgba(227,94,53,0.3);
                    color: #fff;
                }
                .reports-grid-treasury {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 20px;
                    align-items: start;
                }
                .form-sticky {
                    align-self: start;
                    width: 100%;
                    position: sticky;
                    top: 24px;
                }
                .txn-form-title {
                    margin-bottom: 1.25rem;
                }
                .txn-success-badge {
                    margin-bottom: 1rem;
                    display: block;
                    text-align: center;
                }
                .txn-fields-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .channel-details-box {
                    padding: 10px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                }
                .channel-ref-label {
                    color: #29b6f6;
                    font-size: 0.85rem;
                    display: block;
                    margin-bottom: 4px;
                }
                .btn-submit-txn {
                    margin-top: 0.5rem;
                    padding: 12px;
                }
                .in-txn {
                    background: #66bb6a;
                    border-color: rgba(102,187,106,0.3);
                }
                .out-txn {
                    background: #E35E35;
                    border-color: rgba(227,94,53,0.3);
                }
                .results-view-panel {
                    min-width: 0;
                }
                .txn-list-header-wrapper {
                    margin-bottom: 1.25rem;
                }
                .txn-list-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .txn-list-title {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .active-filter-txt {
                    font-size: 0.78rem;
                    color: #ffa726;
                }
                .clear-filter-btn {
                    padding: 4px 12px;
                    background: rgba(255,82,82,0.1);
                    border: 1px solid #ff5252;
                    color: #ff5252;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-family: inherit;
                }
                .filter-pills-bar {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    align-items: center;
                    padding: 12px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .filter-pill {
                    padding: 5px 12px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 0.81rem;
                    background: transparent;
                    color: #aaa;
                    border: 1px solid rgba(255,255,255,0.15);
                    transition: all 0.2s;
                }
                .filter-pill.active {
                    color: #fff;
                    border-color: transparent;
                    font-weight: 700;
                }
                .in-pill { background: #66bb6a; }
                .out-pill { background: #E35E35; }
                .primary-pill { background: var(--primary-color); }
                .filter-divider {
                    width: 1px;
                    height: 24px;
                    background: rgba(255,255,255,0.1);
                }
                .filter-select, .filter-input, .filter-date {
                    background: #1a1c22;
                    border: 1px solid rgba(255,255,255,0.15);
                    borderRadius: 8px;
                    color: #ddd;
                    padding: 5px 10px;
                    font-family: inherit;
                    font-size: 0.81rem;
                    cursor: pointer;
                    outline: none;
                }
                .search-input {
                    min-width: 130px;
                    flex: 1;
                }
                .date-separator {
                    color: #666;
                    font-size: 0.8rem;
                }
                .filter-summary-row {
                    display: flex;
                    gap: 16px;
                    marginTop: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .results-count-txt {
                    font-size: 0.83rem;
                    color: var(--text-muted);
                }
                .summary-badge {
                    font-size: 0.75rem;
                }
                .net-change-val {
                    font-size: 0.83rem;
                    fontWeight: 800;
                }
                .net-change-val.positive { color: #66bb6a; }
                .net-change-val.negative { color: #ff5252; }
                
                .table-wrapper-treasury {
                    max-height: 500px;
                }
                .txn-row-collection {
                    background: rgba(41,182,246,0.04) !important;
                }
                .txn-datetime {
                    font-size: 0.82rem;
                }
                .txn-time {
                    font-size: 0.7rem;
                    color: #666;
                }
                .txn-treasury-btn {
                    font-size: 0.82rem;
                    font-weight: 600;
                }
                .txn-type-badge {
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }
                .txn-type-badge.in {
                    background: rgba(102,187,106,0.15);
                    color: #66bb6a;
                }
                .txn-type-badge.out {
                    background: rgba(227,94,53,0.15);
                    color: #E35E35;
                }
                .txn-channel-badge {
                    font-size: 0.82rem;
                }
                .txn-ref-txt {
                    font-size: 0.75rem;
                    color: #888;
                }
                .txn-desc-cell {
                    font-size: 0.82rem;
                    max-width: 200px;
                }
                .txn-amount-td {
                    text-align: center;
                }
                .txn-amount-val {
                    font-weight: 800;
                    font-size: 1.05rem;
                }
                .txn-amount-val.positive { color: #66bb6a; }
                .txn-amount-val.negative { color: #ff5252; }
                .trash-btn {
                    padding: 4px 8px;
                }
                .empty-results-cell {
                    text-align: center;
                    padding: 2rem;
                    color: #555;
                }
                .pagination-controls-treasury {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    marginTop: 2rem;
                    flex-wrap: wrap-reverse;
                    gap: 20px;
                    padding: 15px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                }
                .results-count-selector {
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
                .page-size-dropdown {
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
                .page-size-dropdown option { color: #000; }
                .page-nav-wrapper {
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
                    padding: 8px 15px;
                }
                .page-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    minWidth: 60px;
                    background: rgba(227,94,53,0.1);
                    color: var(--primary-color);
                    border-radius: 10px;
                    padding: 6px 12px;
                    font-weight: bold;
                    font-size: 0.9rem;
                    direction: ltr;
                    white-space: nowrap;
                    border: 1px solid rgba(227,94,53,0.2);
                }
                /* Modal Styles */
                .modal-content-shell {
                    width: 100%;
                    max-width: 700px;
                    padding: 2rem;
                }
                .modal-header-shell {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .modal-title-shell {
                    margin: 0;
                    color: #f59e0b;
                    font-size: 1.25rem;
                }
                .modal-close-btn {
                    background: transparent;
                    border: none;
                    color: #888;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .bank-search-wrapper {
                    position: relative;
                    margin-bottom: 1.5rem;
                }
                .field-hint-mini {
                    font-size: 0.8rem;
                    color: #aaa;
                    display: block;
                    margin-bottom: 4px;
                }
                .bank-input-group {
                    display: flex;
                    align-items: center;
                    background: #1a1c22;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    overflow: hidden;
                }
                .bank-logo-mini {
                    width: 24px;
                    height: 24px;
                    margin: 0 10px;
                    object-fit: contain;
                }
                .bank-search-input {
                    width: 100%;
                    border: none;
                    background: transparent;
                }
                .bank-dropdown-trigger {
                    padding: 0 10px;
                    color: #888;
                    cursor: pointer;
                }
                .banks-dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #1e2128;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    margin-top: 5px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
                .bank-option {
                    padding: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    transition: background 0.2s;
                }
                .bank-option:hover {
                    background: rgba(255,255,255,0.05);
                }
                .bank-opt-logo {
                    width: 24px;
                    height: 24px;
                    object-fit: contain;
                }
                .bank-opt-placeholder {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .bank-opt-name {
                    color: #fff;
                    font-size: 0.9rem;
                }
                .bank-type-label {
                    color: #888;
                    font-size: 0.75rem;
                }
                .channel-entry-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 80px auto;
                    gap: 10px;
                    margin-bottom: 2rem;
                    align-items: end;
                    background: rgba(255,255,255,0.03);
                    padding: 15px;
                    border-radius: 12px;
                }
                .color-picker-input {
                    padding: 0;
                    height: 42px;
                    cursor: pointer;
                }
                .save-channel-btn {
                    height: 42px;
                    padding: 0 20px;
                }
                .channels-list-grid {
                    display: grid;
                    gap: 10px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding-right: 5px;
                }
                .channel-item-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: rgba(255,255,255,0.02);
                }
                .channel-item-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .channel-logo-boxed {
                    background: #fff;
                    padding: 5px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .channel-logo-img {
                    width: 30px;
                    height: 30px;
                    object-fit: contain;
                }
                .channel-item-name {
                    font-weight: 700;
                    color: #fff;
                }
                .channel-item-meta {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .channel-item-actions {
                    display: flex;
                    gap: 8px;
                }
                .edit-channel-btn {
                    color: #ffa726;
                    border-color: rgba(255,167,38,0.2);
                }
                @media (max-width: 992px) {
                    .reports-grid-treasury {
                        grid-template-columns: 1fr;
                    }
                    .form-sticky {
                        position: relative;
                        top: 0;
                    }
                }
                @media (max-width: 600px) {
                    .channel-entry-grid {
                        grid-template-columns: 1fr;
                    }
                    .save-channel-btn {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
