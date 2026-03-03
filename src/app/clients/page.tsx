'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/core/reportTemplate';
import { Search, Plus, Trash2, Pencil, BarChart3, MessageCircle, Wallet, MoreHorizontal } from 'lucide-react';
import { createPortal } from 'react-dom';
import PrintLayout from '@/components/PrintLayout';


// ─── Types ────────────────────────────────────────────────────────────────────
type Phone = { id?: string; phone: string; isPrimaryWhatsApp: boolean };
type Client = {
    id: string; serial: number; name: string; storeName?: string;
    email?: string; address?: string;
    phones: Phone[];
    totalInvoices: number; totalPayments: number; balanceDue: number;
    invoices: { id: string; invoiceNo: string; total: number; status: string; createdAt: string }[];
};

const SYM = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } });

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const dropdownBtnStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        textAlign: 'right',
        cursor: 'pointer',
        fontSize: '0.95rem',
        transition: 'background 0.2s',
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'ALL'>(5);
    const [form, setForm] = useState({
        name: '', storeName: '', address: '', email: '',
        phones: [{ phone: '', isPrimaryWhatsApp: true }]
    });
    const [editingClient, setEditingClient] = useState<Client | null>(null);

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

    const [actionModal, setActionModal] = useState<Client | null>(null);
    const [printData, setPrintData] = useState<Client | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchClients();
        const saved = localStorage.getItem('erp_clients_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_clients_pageSize', val);
        setCurrentPage(1);
    };

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            setClients(data.map((c: any) => ({ ...c, phones: c.phones || [], invoices: c.invoices || [] })));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation: must have at least one phone and one primary whatsapp
        if (form.phones.length === 0 || !form.phones.some(p => p.isPrimaryWhatsApp)) {
            return alert('يجب إضافة رقم هاتف واحد على الأقل وتحديده كرقم واتساب أساسي');
        }

        try {
            const method = editingClient ? 'PUT' : 'POST';
            const body = editingClient ? { ...form, id: editingClient.id } : form;

            const res = await fetch('/api/clients', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setForm({ name: '', storeName: '', address: '', email: '', phones: [{ phone: '', isPrimaryWhatsApp: true }] });
                setEditingClient(null);
                fetchClients();
            } else {
                const err = await res.json();
                alert(`❌ خطأ: ${err.error || 'فشل الحفظ'}`);
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (cl: Client) => {
        if (!confirm(`⚠️ هل أنت متأكد من حذف العميل "${cl.name}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
        try {
            const res = await fetch(`/api/clients?id=${cl.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchClients();
            } else {
                const err = await res.json();
                alert(`❌ فشل الحذف: ${err.error}`);
            }
        } catch (e) { console.error(e); }
    };

    const startEdit = (cl: Client) => {
        setEditingClient(cl);
        setForm({
            name: cl.name,
            storeName: cl.storeName || '',
            address: cl.address || '',
            email: cl.email || '',
            phones: cl.phones.length > 0
                ? cl.phones.map(p => ({ phone: p.phone, isPrimaryWhatsApp: p.isPrimaryWhatsApp }))
                : [{ phone: '', isPrimaryWhatsApp: true }]
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addPhoneField = () => setForm({ ...form, phones: [...form.phones, { phone: '', isPrimaryWhatsApp: false }] });
    const updatePhoneField = (idx: number, val: string) => {
        const p = [...form.phones]; p[idx].phone = val; setForm({ ...form, phones: p });
    };
    const setPrimaryWA = (idx: number) => {
        const p = form.phones.map((item, i) => ({ ...item, isPrimaryWhatsApp: i === idx }));
        setForm({ ...form, phones: p });
    };
    const removePhoneField = (idx: number) => {
        if (form.phones.length <= 1) return;
        const p = form.phones.filter((_, i) => i !== idx);
        if (!p.some(x => x.isPrimaryWhatsApp)) p[0].isPrimaryWhatsApp = true;
        setForm({ ...form, phones: p });
    };

    // ── Filtering and Pagination Logic ─────────────────────────────────────────
    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            c.name.includes(searchTerm) ||
            (c.storeName && c.storeName.includes(searchTerm)) ||
            c.phones.some(p => p.phone.includes(searchTerm)) ||
            `C-${c.serial}`.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredClients.length / pageSize);
    const paginatedClients = useMemo(() => {
        if (pageSize === 'ALL') return filteredClients;
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
            c.phones.map(p => p.phone + (p.isPrimaryWhatsApp ? ' (WA)' : '')).join(' | '),
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
                            phones: [
                                { phone: cells[4] || '', isPrimaryWhatsApp: true },
                                ...(cells[5] ? [{ phone: cells[5], isPrimaryWhatsApp: false }] : [])
                            ],
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

    // ── Client Statement Export ────────────────────────────────────────────────
    // ── طباعة كشف حساب عميل ──
    const handlePrintStatement = async (cl: Client) => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';
        const dateStr = new Date().toLocaleDateString('ar-EG');

        const bodyHtml = `
            <style>
                .client-header { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; margin-top: 10px; }
                .info-card { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                .info-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
                .info-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
            </style>

            <div class="client-header">
                <div class="info-card">
                    <div class="info-label">بيانات العميل</div>
                    <div class="info-value">${cl.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">كود العميل: #C-${cl.serial} ${cl.storeName ? `| ${cl.storeName}` : ''}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">الموقف المالي الحالي</div>
                    <div class="info-value" style="color: ${cl.balanceDue > 0 ? '#991b1b' : '#166534'};">
                        ${cl.balanceDue.toLocaleString('en-US')} ${symVal}
                        <span style="font-size: 0.7rem; font-weight: bold; margin-right: 5px;">${cl.balanceDue > 0 ? '(مدين)' : '(دائن)'}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="padding: 15px; background: #f1f5f9; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">إجمالي المبيعات</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b;">${(cl.totalInvoices || 0).toLocaleString('en-US')} ${symVal}</div>
                </div>
                <div style="padding: 15px; background: #f1f5f9; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">إجمالي المتحصلات</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #166534;">${(cl.totalPayments || 0).toLocaleString('en-US')} ${symVal}</div>
                </div>
            </div>

            <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 15px; color: #1e293b; border-right: 4px solid ${config.accentColor || '#E35E35'}; padding-right: 12px;">📄 سجل فواتير المبيعات</h3>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: right;">رقم الفاتورة</th>
                        <th>التاريخ</th>
                        <th style="text-align: center;">المبلغ الإجمالي</th>
                        <th style="text-align: center;">حالة السداد</th>
                    </tr>
                </thead>
                <tbody>
                    ${cl.invoices?.length ? cl.invoices.map(inv => `
                        <tr>
                            <td style="text-align: right; font-weight: bold;">#${inv.invoiceNo}</td>
                            <td>${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                            <td style="text-align: center; font-weight: 700;">${(inv.total || 0).toLocaleString('en-US')} ${symVal}</td>
                            <td style="text-align: center;">
                                <span style="padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; background: ${inv.status === 'PAID' ? '#dcfce7' : '#fee2e2'}; color: ${inv.status === 'PAID' ? '#166534' : '#991b1b'}">
                                    ${inv.status === 'PAID' ? 'مسددة بالكامل' : inv.status === 'PARTIAL' ? 'مسددة جزئياً' : 'آجلة'}
                                </span>
                            </td>
                        </tr>
                    `).join('') : '<tr><td colspan="4">لا توجد فواتير مسجلة في كشف الحساب</td></tr>'}
                </tbody>
            </table>
        `;

        const html = generatePrintHtml(bodyHtml, `كشف حساب عميل مفصل - ${cl.name}`, config);

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




    const buildClientStatementProps = (cl: Client) => {
        if (!cl) return null;

        return {
            documentTitle: `كشف حساب عميل: ${cl.name}`,
            fileName: `Statement_${cl.name}_${new Date().toISOString().split('T')[0]}`,
            metaInfo: [
                ['رقم العميل', `C-${cl.serial}`],
                ['الاسم', cl.name],
                ...(cl.storeName ? [['النشاط', cl.storeName] as [string, string]] : []),
                ['تاريخ الطباعة', new Date().toLocaleDateString('ar-EG')]
            ] as [string, string][],
            tableHeaders: ['رقم الفاتورة', 'التاريخ', 'القيمة', 'الحالة'],
            tableRows: cl.invoices.map((inv) => [
                inv.invoiceNo,
                new Date(inv.createdAt).toLocaleDateString('ar-EG'),
                `${(inv.total || 0).toFixed(0)} ${SYM()}`,
                inv.status
            ]),
            summaryRows: [
                ['الرصيد المتبقي', `${cl.balanceDue.toFixed(0)} ${SYM()}`]
            ] as [string, string][],
            whatsappTemplateType: 'clients',
            whatsappData: {
                '[اسم_الطرف]': cl.name,
                '[الرصيد]': `${cl.balanceDue.toFixed(0)} ${SYM()}`,
                '[تاريخ_اليوم]': new Date().toLocaleDateString('ar-EG'),
            },
        };
    };

    const sym = SYM();
    const totalBalance = clients.reduce((acc, c) => acc + c.balanceDue, 0);

    return (
        <>
            <div className="unified-container animate-fade-in">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">👥 إدارة العملاء والتحصيلات</h1>
                        <p className="page-subtitle">
                            متابعة أرصدة <strong style={{ color: 'var(--text-primary)' }}>{clients.length}</strong> عميل | إجمالي المستحقات:{" "}
                            <span style={{ color: totalBalance > 0 ? 'var(--primary-color)' : '#66bb6a', fontWeight: 800 }}>
                                {mounted ? totalBalance.toLocaleString('en-US') : '0'} {mounted ? SYM() : 'ج.م'}
                            </span>
                        </p>
                    </div>
                    <div className="header-actions">
                        <button onClick={exportToCSV} className="btn-modern btn-secondary" title="تصدير للبيانات">📥 تصدير</button>
                        <label className="btn-modern btn-secondary" style={{ cursor: 'pointer' }}>
                            📤 استيراد
                            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                        </label>
                    </div>
                </header>

                <div className="reports-grid" style={{ alignItems: 'start' }}>
                    {/* ─────────────── SIDEBAR FORM ─────────────── */}
                    <div className="glass-panel" style={{ position: 'sticky', top: '24px' }}>
                        <h4 className="settings-section-label">
                            {editingClient ? '📝 تعديل بيانات العميل' : '✨ تسجيل عميل جديد'}
                        </h4>
                        <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label className="field-label" htmlFor="client-name">الاسم الكامل *</label>
                                <input id="client-name" type="text" className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="اسم العميل" />
                            </div>
                            <div>
                                <label className="field-label" htmlFor="client-store">اسم المتجر / الشركة</label>
                                <input id="client-store" type="text" className="input-glass" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} placeholder="اختياري" />
                            </div>

                            {/* Multiple Phones Section */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="field-label" style={{ marginBottom: 0 }}>📱 أرقام الهاتف</label>
                                    <button type="button" onClick={addPhoneField} className="btn-modern btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>+ إضافة</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {form.phones.map((phi, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    className="input-glass"
                                                    value={phi.phone}
                                                    onChange={e => updatePhoneField(idx, e.target.value)}
                                                    placeholder="رقم الهاتف"
                                                    style={{ paddingLeft: '35px' }}
                                                    required={idx === 0}
                                                    aria-label={`رقم هاتف ${idx + 1}`}
                                                />
                                                <label
                                                    title="تعيين كواتساب"
                                                    style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', margin: 0, display: 'flex' }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="primaryWA"
                                                        checked={phi.isPrimaryWhatsApp}
                                                        onChange={() => setPrimaryWA(idx)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{
                                                        fontSize: '1.1rem',
                                                        filter: phi.isPrimaryWhatsApp ? 'none' : 'grayscale(1)',
                                                        opacity: phi.isPrimaryWhatsApp ? 1 : 0.3,
                                                        transition: 'all 0.2s'
                                                    }}>🟢</span>
                                                </label>
                                            </div>
                                            {form.phones.length > 1 && (
                                                <button type="button" onClick={() => removePhoneField(idx)} className="btn-danger" style={{ width: '32px', height: '32px' }}>×</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="field-label" htmlFor="client-address">العنوان</label>
                                <textarea id="client-address" className="input-glass" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="المدينة، الحي..." style={{ resize: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button type="submit" className="btn-modern btn-primary" style={{ flex: 2 }}>
                                    {editingClient ? '💾 حفظ التعديلات' : '➕ إضافة العميل'}
                                </button>
                                {editingClient && (
                                    <button type="button" onClick={() => { setEditingClient(null); setForm({ name: '', storeName: '', address: '', email: '', phones: [{ phone: '', isPrimaryWhatsApp: true }] }); }} className="btn-modern btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* ─────────────── MAIN CONTENT ─────────────── */}
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Search bar */}
                        <div className="glass-panel" style={{ padding: '1rem' }}>
                            <input
                                type="text"
                                className="input-glass"
                                placeholder="🔍 ابحث بالاسم، المتجر أو الرقم المسلسل..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%' }}
                                aria-label="بحث عن عميل"
                            />
                        </div>

                        {/* Table View */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            {loading ? (
                                <p style={{ textAlign: 'center', color: '#555', padding: '3rem' }}>⏳ جاري تحميل البيانات...</p>
                            ) : (
                                <>
                                    <div className="smart-table-container">
                                        <table className="smart-table">
                                            <thead>
                                                <tr>
                                                    <th className="hide-on-tablet text-center" style={{ width: '60px' }}>#</th>
                                                    <th>العميل والنشاط</th>
                                                    <th className="text-center" style={{ width: '150px' }}>الرصيد المتبقي</th>
                                                    <th className="hide-on-tablet text-center" style={{ width: '160px' }}>الهاتف الأساسي</th>
                                                    <th className="text-left" style={{ width: '120px' }}>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedClients.map(cl => {
                                                    const primaryPhone = cl.phones.find(p => p.isPrimaryWhatsApp) || cl.phones[0];
                                                    return (
                                                        <tr key={cl.id}>
                                                            <td className="hide-on-tablet text-center" data-label="المسلسل">C-{cl.serial}</td>
                                                            <td data-label="العميل" style={{ minWidth: '200px' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <div className="mobile-card-title text-ellipsis" title={cl.name}>{cl.name}</div>
                                                                    {cl.storeName && <div className="text-muted text-sm text-ellipsis" title={cl.storeName}>🏢 {cl.storeName}</div>}
                                                                </div>
                                                            </td>
                                                            <td data-label="الرصيد" className="text-center">
                                                                <div className={cl.balanceDue > 0 ? "mobile-card-balance balance-red" : "mobile-card-balance balance-green"}>
                                                                    {cl.balanceDue.toLocaleString('en-US')} <span className="text-sm font-normal">{sym}</span>
                                                                </div>
                                                            </td>
                                                            <td className="hide-on-tablet text-center" data-label="الهاتف">
                                                                <div className="flex-group">
                                                                    <span className="text-sm">{primaryPhone?.phone}</span>
                                                                    {cl.phones.length > 1 && <span className="phone-tag" title={`${cl.phones.length} أرقام`}>+{cl.phones.length - 1}</span>}
                                                                </div>
                                                            </td>
                                                            <td data-label="الإجراءات" className="text-left">
                                                                <div className="action-bar-cell mobile-card-actions" style={{ position: 'relative' }}>
                                                                    <button onClick={() => openPay(cl)} className="btn-modern btn-primary btn-sm" title="تحصيل مبلغ" style={{ padding: '0 8px' }}>
                                                                        <Wallet size={16} /> تحصيل
                                                                    </button>

                                                                    <button
                                                                        onClick={() => setActionModal(cl)}
                                                                        className="btn-modern btn-secondary btn-sm"
                                                                        title="المزيد من الإجراءات"
                                                                        style={{ padding: '0 8px' }}
                                                                    >
                                                                        <MoreHorizontal size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap-reverse', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '20px' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>عدد النتائج:</span>
                                            <select
                                                value={pageSize}
                                                onChange={(e) => handlePageSizeChange(e.target.value)}
                                                style={{ padding: '0px', fontSize: '0.9rem', width: 'auto', border: 'none', background: 'transparent', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                                                aria-label="Items per page"
                                            >
                                                <option style={{ color: '#000' }} value={5}>5</option>
                                                <option style={{ color: '#000' }} value={10}>10</option>
                                                <option style={{ color: '#000' }} value={20}>20</option>
                                                <option style={{ color: '#000' }} value={50}>50</option>
                                                <option style={{ color: '#000' }} value="ALL">الكل</option>
                                            </select>
                                        </div>

                                        {totalPages > 1 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flex: '1 1 auto', maxWidth: '350px' }}>
                                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>&rarr; السابق</button>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', background: 'rgba(227,94,53,0.1)', color: 'var(--primary-color)', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr', whiteSpace: 'nowrap', border: '1px solid rgba(227,94,53,0.2)' }}>
                                                    {currentPage} / {totalPages}
                                                </div>
                                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>التالي &larr;</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {payModal && mounted && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">تسجيل مالي: {payModal.name}</h2>
                            <button onClick={() => setPayModal(null)} className="close-btn" title="إغلاق">✕</button>
                        </div>
                        {payMsg && <div style={{ background: 'rgba(102,187,106,0.1)', color: '#66bb6a', padding: '10px', borderRadius: '8px', marginBottom: '1rem' }}>{payMsg}</div>}
                        <form onSubmit={handlePay} className="modal-body custom-scroll">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div><label className="field-label" htmlFor="p-amt">المبلغ المطلوب</label><input id="p-amt" type="number" className="input-glass" value={payAmount} onChange={e => setPayAmount(e.target.value)} required style={{ fontSize: '1.4rem', fontWeight: 800, color: '#29b6f6' }} /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div><label className="field-label" htmlFor="p-chan">قناة الدفع</label>
                                        <select id="p-chan" className="input-glass" value={payChannel} onChange={e => { setPayChannel(e.target.value); setPayTreasury(e.target.value === 'CASH' ? 'MAIN' : e.target.value === 'BANK' ? 'BANK' : 'VODAFONE_CASH'); }}>
                                            <option value="CASH">كاش</option><option value="BANK">بنك</option><option value="VODAFONE">فودافون كاش</option>
                                        </select>
                                    </div>
                                    <div><label className="field-label" htmlFor="p-tres">الخزينة</label>
                                        <select id="p-tres" className="input-glass" value={payTreasury} onChange={e => setPayTreasury(e.target.value)}>
                                            <option value="MAIN">الرئيسية</option><option value="BANK">البنكي</option><option value="VODAFONE_CASH">فودافون</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={paying} className="btn-modern btn-primary" style={{ height: '50px', width: '100%' }}>{paying ? 'جاري الحفظ...' : 'تأكيد العملية'}</button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {/* Action Bottom Sheet (Mobile) / Modal (Desktop) */}
            {actionModal && mounted && createPortal(
                <div className="modal-overlay" onClick={() => setActionModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ margin: 0 }}>إجراءات العميل: <span style={{ color: 'var(--primary-color)', marginRight: '10px' }}>{actionModal.name}</span></h2>
                            <button onClick={() => setActionModal(null)} className="close-btn" title="إغلاق">✕</button>
                        </div>

                        <div className="modal-body custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(() => {
                                const primaryPhone = actionModal.phones.find(p => p.isPrimaryWhatsApp) || actionModal.phones[0];
                                return (
                                    <>
                                        {primaryPhone?.phone && (
                                            <button onClick={() => { window.open(`https://wa.me/${primaryPhone.phone.replace(/\D/g, '')}`, '_blank'); setActionModal(null); }} className="btn-modern btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                                                <MessageCircle size={20} style={{ color: '#4caf50' }} /> تواصل عبر الواتساب <span style={{ marginLeft: 'auto', opacity: 0.5 }}>{primaryPhone.phone}</span>
                                            </button>
                                        )}

                                        <button onClick={() => { startEdit(actionModal); setActionModal(null); }} className="btn-modern btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                                            <Pencil size={20} style={{ color: '#ffa726' }} /> تعديل بيانات العميل
                                        </button>

                                        <button onClick={() => { handlePrintStatement(actionModal); setActionModal(null); }} className="btn-modern btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                                            <BarChart3 size={20} style={{ color: '#29b6f6' }} /> طباعة كشف حساب تفصيلي
                                        </button>

                                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                                        <button onClick={() => { handleDelete(actionModal); setActionModal(null); }} className="btn-modern bg-white/5 hover:bg-red-500/10" style={{ justifyContent: 'flex-start', padding: '16px', color: '#ff5252', border: '1px solid rgba(255,82,82,0.2)' }}>
                                            <Trash2 size={20} /> حذف العميل نهائياً
                                        </button>
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                </div>, document.body
            )}


        </>
    );
}

