'use client';
import React, { useState, useEffect } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/lib/reportTemplate';
import { Search, Plus, Wallet, Pencil, MessageCircle, Trash2 } from 'lucide-react';

// Supplier Type
type Phone = { id?: string; phone: string; isPrimaryWhatsApp: boolean };

export type Supplier = {
    id: string;
    serial?: number;
    name: string;
    type: string;
    address?: string;
    balance: number;
    createdAt?: string;
    phones: Phone[];
    purchases?: any[];
    paintJobs?: any[];
    supplierPayments?: any[];
};

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'MATERIAL',
        address: '',
        balance: 0,
        phones: [{ phone: '', isPrimaryWhatsApp: true }]
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [treasuries, setTreasuries] = useState<{ id: string, name: string }[]>([]);

    // Payment Form
    const [showPayment, setShowPayment] = useState<Supplier | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [selectedTreasury, setSelectedTreasury] = useState('');

    useEffect(() => {
        setMounted(true);
        fetchSuppliers();
        fetch('/api/treasury').then(r => r.json()).then(data => {
            if (data.success) {
                const arr = Array.isArray(data.data) ? data.data : [];
                setTreasuries(arr);
                if (arr.length > 0) setSelectedTreasury(arr[0].id);
            }
        }).catch(() => { });
        const saved = localStorage.getItem('erp_suppliers_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_suppliers_pageSize', val);
        setCurrentPage(1);
    };

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers');
            const data = await res.json();
            setSuppliers(Array.isArray(data) ? data.map((s: any) => ({ ...s, phones: s.phones || [] })) : []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.phones.length === 0 || !form.phones.some(p => p.isPrimaryWhatsApp)) {
            return alert('يجب إضافة رقم هاتف واحد على الأقل وتحديده كرقم واتساب أساسي');
        }

        const method = editingId ? 'PUT' : 'POST';
        const body = editingId ? { ...form, id: editingId } : form;

        const res = await fetch('/api/suppliers', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            setShowAdd(false);
            setEditingId(null);
            setForm({ name: '', type: 'MATERIAL', address: '', balance: 0, phones: [{ phone: '', isPrimaryWhatsApp: true }] });
            fetchSuppliers();
        } else {
            const err = await res.json();
            alert(`❌ خطأ: ${err.error}`);
        }
    };

    const startEdit = (s: Supplier) => {
        setEditingId(s.id);
        setForm({
            name: s.name,
            type: s.type,
            address: s.address || '',
            balance: s.balance,
            phones: s.phones.length > 0 ? s.phones.map(p => ({ phone: p.phone, isPrimaryWhatsApp: p.isPrimaryWhatsApp })) : [{ phone: '', isPrimaryWhatsApp: true }]
        });
        setShowAdd(true);
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

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف المورد: ${name}؟`)) return;
        await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
        fetchSuppliers();
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showPayment) return;
        try {
            await fetch('/api/suppliers/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: showPayment.id,
                    amount: paymentAmount,
                    method: paymentMethod,
                    treasuryId: selectedTreasury
                })
            });
            setShowPayment(null);
            fetchSuppliers();
            alert('تم تسجيل الدفعة بنجاح');
        } catch (err) {
            alert('حدث خطأ');
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'ALL'>(5);

    const filteredSuppliers = suppliers.filter((s: Supplier) =>
        s.name.includes(searchTerm) ||
        (s.type && s.type.includes(searchTerm)) ||
        s.phones.some((p: Phone) => p.phone.includes(searchTerm)) ||
        (s.serial && `S-${s.serial}`.includes(searchTerm))
    );

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredSuppliers.length / pageSize);
    const paginatedSuppliers = pageSize === 'ALL' ? filteredSuppliers : filteredSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePrintStatement = async (s: Supplier) => {
        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';
        const dateStr = new Date().toLocaleDateString('ar-EG');

        const bodyHtml = `
            <style>
                .sup-header { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; margin-top: 10px; }
                .info-card { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                .info-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
                .info-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
            </style>

            <div class="sup-header">
                <div class="info-card">
                    <div class="info-label">بيانات المورد</div>
                    <div class="info-value">${s.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">كود المورد: #${s.serial || '---'} | الفئة: ${s.type === 'GOODS' ? 'بضائع' : 'خدمات'}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">إجمالي الرصيد المستحق</div>
                    <div class="info-value" style="color: #991b1b;">${s.balance.toLocaleString('en-US')} ${symVal}</div>
                </div>
            </div>

            <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 15px; color: #1e293b; border-right: 4px solid ${config.accentColor || '#E35E35'}; padding-right: 12px;">📄 سجل العمليات</h3>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: right;">التاريخ</th>
                        <th>البيان</th>
                        <th style="text-align: center;">المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${(s.purchases || []).map(p => `
                        <tr>
                            <td style="text-align: right;">${new Date(p.createdAt).toLocaleDateString('ar-EG')}</td>
                            <td>فاتورة توريد #${p.invoiceNo || p.id.slice(-5)}</td>
                            <td style="text-align: center; font-weight: 700;">${p.total.toLocaleString('en-US')} ${symVal}</td>
                        </tr>
                    `).join('')}
                    ${(s.supplierPayments || []).map(p => `
                        <tr>
                            <td style="text-align: right;">${new Date(p.createdAt || new Date()).toLocaleDateString('ar-EG')}</td>
                            <td style="color: #166534;">دفعة مسددة (صرف نقدية)</td>
                            <td style="text-align: center; font-weight: 700; color: #166534;">-${p.amount.toLocaleString('en-US')} ${symVal}</td>
                        </tr>
                    `).join('')}
                    ${(!s.purchases?.length && !s.supplierPayments?.length) ? '<tr><td colspan="3">لا توجد حركات مسجلة لهذا المورد</td></tr>' : ''}
                </tbody>
            </table>
        `;

        const html = generatePrintHtml(bodyHtml, `كشف حساب مورد - ${s.name}`, config);

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

    const totalBalance = suppliers.reduce((a, s) => a + s.balance, 0);

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">🏢 إدارة الموردين</h1>
                    <p className="page-subtitle">
                        إجمالي المستحقات:{" "}
                        <span style={{ color: totalBalance > 0 ? '#ff5252' : '#66bb6a', fontWeight: 'bold' }}>
                            {mounted ? totalBalance.toLocaleString('en-US') : '0'} ج.م
                        </span>
                    </p>
                </div>
                <div className="header-actions">
                    <button onClick={() => {
                        setEditingId(null);
                        setForm({ name: '', type: 'MATERIAL', address: '', balance: 0, phones: [{ phone: '', isPrimaryWhatsApp: true }] });
                        setShowAdd(true);
                    }} className="btn-modern btn-primary">
                        ➕ مورد جديد
                    </button>
                </div>
            </header>

            <div className="content-centered-wrapper">
                {/* Search bar */}
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="ابحث بالاسم، النشاط، رقم الهاتف أو الكود (S-1)..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            aria-label="بحث عن مورد"
                            style={{ width: '100%', paddingRight: '45px', height: '52px' }}
                        />
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#919398' }}>
                        تم العثور على: <strong style={{ color: '#fff' }}>{filteredSuppliers.length}</strong> مورد
                    </div>
                </div>

                <div className="glass-panel" >
                    {loading ? (
                        <p >⏳ جاري تحميل البيانات...</p>
                    ) : (
                        <>
                            <div className="smart-table-container">
                                <table className="smart-table">
                                    <thead>
                                        <tr>
                                            <th className="hide-on-tablet" style={{ width: '80px' }}>الكود</th>
                                            <th>المورد / النشاط</th>
                                            <th className="text-center">الرصيد المستحق</th>
                                            <th className="hide-on-tablet text-center">الهاتف الأساسي</th>
                                            <th className="text-left">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedSuppliers.map(s => {
                                            const primaryPhone = s.phones.find(p => p.isPrimaryWhatsApp) || s.phones[0];
                                            return (
                                                <tr key={s.id}>
                                                    <td className="hide-on-tablet" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>S-{s.serial || '---'}</td>
                                                    <td>
                                                        <div className="mobile-card-title">{s.name}</div>
                                                        <div className={`type-badge ${s.type} hide-on-tablet`}>
                                                            {s.type === 'PAINT' ? '🎨 دهانات' : s.type === 'ALUMINUM' ? '⚙️ ألومنيوم' : s.type === 'MATERIAL' ? '📦 خامات' : '⚒️ خارجي'}
                                                        </div>
                                                    </td>
                                                    <td data-label="الرصيد" className="text-center">
                                                        <div className={s.balance > 0 ? "mobile-card-balance balance-red" : "mobile-card-balance balance-green"}>
                                                            {s.balance.toLocaleString('en-US')} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>ج.م</span>
                                                        </div>
                                                    </td>
                                                    <td className="hide-on-tablet" data-label="الهاتف" >
                                                        <div >
                                                            <span >{primaryPhone?.phone}</span>
                                                            {s.phones.length > 1 && <span className="phone-tag">+{s.phones.length - 1}</span>}
                                                        </div>
                                                    </td>
                                                    <td data-label="الإجراءات">
                                                        <div className="action-bar-cell mobile-card-actions">
                                                            <button onClick={() => setShowPayment(s)} className="btn-action" title="سداد مالي" ><Wallet size={20} /></button>
                                                            <button onClick={() => startEdit(s)} className="btn-action btn-edit" title="تعديل"><Pencil size={20} /></button>
                                                            {primaryPhone?.phone && (
                                                                <button
                                                                    onClick={() => {
                                                                        const p = primaryPhone.phone.replace(/\D/g, '');
                                                                        window.open(`https://wa.me/${p}`, '_blank');
                                                                    }}
                                                                    className="btn-action btn-whatsapp"
                                                                    title="واتساب"
                                                                >
                                                                    <MessageCircle size={20} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDelete(s.id, s.name)} className="btn-action btn-danger" title="حذف"><Trash2 size={20} /></button>
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

            {/* ADD/EDIT MODAL */}
            {showAdd && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingId ? <Pencil size={20} className="text-orange-400" /> : <Plus size={20} className="text-blue-400" />}
                                {editingId ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
                            </h2>
                            <button onClick={() => setShowAdd(false)} className="close-btn" title="إغلاق">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="modal-body custom-scroll">
                            <div className="mb-3">
                                <label className="field-label" htmlFor="sup-name">اسم المورد / المصنع</label>
                                <input id="sup-name" type="text" className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="مثال: شركة الهدى للألومنيوم" />
                            </div>

                            <div className="flex-between mb-3">
                                <div style={{ flex: 1 }}>
                                    <label className="field-label" htmlFor="sup-type">نوع النشاط</label>
                                    <select id="sup-type" className="input-glass" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="MATERIAL">خامات عامة وحديد</option>
                                        <option value="PAINT">مصنع دهان الكتروستاتيك</option>
                                        <option value="ALUMINUM">ألومنيوم وقطاعات</option>
                                        <option value="EXTERNAL">تشغيل خارجي للغير</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="field-label" htmlFor="sup-balance">الرصيد الافتتاحي (ج.م)</label>
                                    <input id="sup-balance" type="number" className="input-glass" value={form.balance} onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="field-label">عنوان المورد</label>
                                <input type="text" className="input-glass" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="العنوان بالتفصيل..." />
                            </div>

                            {/* Phones Section */}
                            <div className="flex-column mb-3">
                                <div className="flex-between">
                                    <label className="field-label" style={{ margin: 0 }}>📱 أرقام الهاتف</label>
                                    <button type="button" onClick={addPhoneField} title="إضافة رقم إضافي" style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>+ إضافة رقم</button>
                                </div>
                                <div className="flex-column">
                                    {form.phones.map((phi, idx) => (
                                        <div key={idx} className="flex-group">
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    className="input-glass"
                                                    value={phi.phone}
                                                    onChange={e => updatePhoneField(idx, e.target.value)}
                                                    placeholder="رقم الهاتف"
                                                    required={idx === 0}
                                                    style={{ paddingRight: '35px' }}
                                                />
                                                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                                    <input type="radio" name="primary-wa" checked={phi.isPrimaryWhatsApp} onChange={() => setPrimaryWA(idx)} style={{ cursor: 'pointer' }} title="تحديد كواتساب أساسي" />
                                                </div>
                                            </div>
                                            {form.phones.length > 1 && (
                                                <button type="button" onClick={() => removePhoneField(idx)} title="حذف" style={{ background: '#fff', border: '1px solid #ccc', color: '#000', borderRadius: '4px', padding: '10px', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-modern btn-secondary flex-1">إلغاء</button>
                                <button type="submit" className="btn-modern btn-primary flex-1">حفظ البيانات</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {showPayment && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <Wallet size={20} className="text-green-400" />
                                تسجيل دفعة: {showPayment.name}
                            </h2>
                            <button onClick={() => setShowPayment(null)} className="close-btn" title="إغلاق">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="modal-body custom-scroll">
                            <div className="mb-3">
                                <label className="field-label" htmlFor="pay-amt">المبلغ المدفوع (ج.م)</label>
                                <input id="pay-amt" type="number" className="input-glass" value={paymentAmount || ''} onChange={e => setPaymentAmount(parseFloat(e.target.value))} required autoFocus />
                            </div>
                            <div className="mb-3">
                                <label className="field-label" htmlFor="pay-method">طريقة الدفع</label>
                                <select id="pay-method" className="input-glass" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option value="CASH">نقدي (كاش)</option>
                                    <option value="BANK">تحويل بنكي</option>
                                    <option value="VODAFONE">فودافون كاش</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="field-label" htmlFor="pay-tres">سحب من خزينة</label>
                                <select id="pay-tres" className="input-glass" value={selectedTreasury} onChange={e => setSelectedTreasury(e.target.value)}>
                                    {treasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowPayment(null)} className="btn-modern btn-secondary flex-1">إلغاء</button>
                                <button type="submit" className="btn-modern btn-success flex-1" style={{ background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)', border: 'none', color: 'white' }}>تأكيد الدفع</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}


