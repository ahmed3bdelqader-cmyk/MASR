'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { fetchReportTemplate, generatePrintHtml } from '@/lib/reportTemplate';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
type PayrollRecord = {
    id: string; type: string; amount: number; date: string; month?: number; year?: number; note?: string;
};

type Phone = { id?: string; phone: string; isPrimaryWhatsApp: boolean };

type Employee = {
    id: string; employeeId: number; name: string; title: string;
    contractType: string; baseSalary: number; hireDate: string; nationalId?: string;
    qualification?: string; role?: string; canLogin?: boolean;
    department?: string; address?: string;
    phones: Phone[];
    payrollRecords: PayrollRecord[];
};

const SYM = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } });

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'ALL'>(5);
    const [sym, setSym] = useState('ج.م');

    // Form states
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        id: '', name: '', title: '', age: '', address: '', nationalId: '', qualification: '', department: '', hireDate: new Date().toISOString().split('T')[0],
        contractType: 'MONTHLY', baseSalary: '', canLogin: false, role: 'WORKER', username: '', password: '',
        phones: [{ phone: '', isPrimaryWhatsApp: true }]
    });

    // Pay modal states
    const [payModal, setPayModal] = useState<Employee | null>(null);
    const [payAction, setPayAction] = useState({
        type: 'SALARY', amount: '', treasury: 'MAIN', channel: 'CASH',
        month: new Date().getMonth() + 1, year: new Date().getFullYear(), note: '', skipTreasury: false
    });
    const [payMsg, setPayMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [viewStatement, setViewStatement] = useState<any>(null);
    const [statementData, setStatementData] = useState<any>(null);
    const [statStartDate, setStatStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [statEndDate, setStatEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isFetchingStmt, setIsFetchingStmt] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [s, setS] = useState<any>({});

    useEffect(() => {
        fetchEmployees();
        setSym(SYM());
        try {
            const sett = JSON.parse(localStorage.getItem('erp_settings') || '{}');
            setS(sett);
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);
        } catch { }
        const saved = localStorage.getItem('erp_employees_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, []);

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_employees_pageSize', val);
        setCurrentPage(1);
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            if (Array.isArray(data)) setEmployees(data.map((e: any) => ({ ...e, phones: e.phones || [] })));
            else setEmployees([]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.phones.length === 0 || !form.phones.some(p => p.isPrimaryWhatsApp)) {
            return alert('يجب إضافة رقم هاتف واحد على الأقل وتحديده كواتساب أساسي');
        }

        if (isSaving) return;
        setIsSaving(true);
        try {
            const isEdit = !!form.id;
            const res = await fetch('/api/employees', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowAdd(false);
                setForm({
                    id: '', name: '', title: '', age: '', address: '', nationalId: '', qualification: '', department: '',
                    hireDate: new Date().toISOString().split('T')[0], contractType: 'MONTHLY', baseSalary: '', canLogin: false,
                    role: 'WORKER', username: '', password: '', phones: [{ phone: '', isPrimaryWhatsApp: true }]
                });
                fetchEmployees();
            } else {
                const err = await res.json();
                alert(`❌ خطأ: ${err.error}`);
            }
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
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

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payModal || isPaying) return;
        setIsPaying(true);
        try {
            const res = await fetch('/api/payroll', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: payModal.id, ...payAction })
            });
            if (res.ok) {
                setPayMsg('✅ تمت العملية بنجاح وترحيلها للخزينة');
                fetchEmployees();
                setTimeout(() => { setPayModal(null); setPayMsg(''); }, 1500);
            } else {
                const data = await res.json();
                setPayMsg('❌ ' + data.error);
            }
        } catch (e) { setPayMsg('❌ فشل الاتصال'); } finally { setIsPaying(false); }
    };

    const fetchStatement = async (empId: string) => {
        setIsFetchingStmt(true);
        try {
            const res = await fetch(`/api/employees/statement?employeeId=${empId}&startDate=${statStartDate}&endDate=${statEndDate}`);
            const data = await res.json();
            setStatementData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsFetchingStmt(false);
        }
    };


    const handleDeleteEmployee = async (id: string, name: string) => {
        if (!confirm(`⚠️ حذف الموظف "${name}" نهائياً؟`)) return;
        try {
            const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchEmployees();
        } catch { }
    };

    const handleEditClick = (emp: any) => {
        setForm({
            id: emp.id, name: emp.name || '', title: emp.title || '', age: emp.age ? emp.age.toString() : '',
            address: emp.address || '',
            nationalId: emp.nationalId || '', qualification: emp.qualification || '', department: emp.department || '',
            hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            contractType: emp.contractType || 'MONTHLY', baseSalary: emp.baseSalary ? emp.baseSalary.toString() : '',
            canLogin: emp.canLogin || false, role: emp.role || 'WORKER', username: emp.username || '', password: '',
            phones: emp.phones.length > 0 ? emp.phones.map((p: any) => ({ phone: p.phone, isPrimaryWhatsApp: p.isPrimaryWhatsApp })) : [{ phone: '', isPrimaryWhatsApp: true }]
        });
        setShowAdd(true);
    };

    const filtered = useMemo(() => {
        return employees.filter(e =>
            e.name.includes(searchTerm) || e.title.includes(searchTerm) || e.employeeId.toString().includes(searchTerm)
        );
    }, [employees, searchTerm]);

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 'ALL') return filtered;
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handlePrintEmployeeStatement = async () => {
        if (!viewStatement || !statementData) return;

        const config = await fetchReportTemplate();
        const symVal = config.currencySymbol || 'ج.م';
        const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

        const rowsHtml = statementData.payrollRecords?.map((r: any) => `
            <tr>
                <td>${new Date(r.date).toLocaleDateString('ar-EG')}</td>
                <td style="font-weight: bold; color: ${r.type === 'SALARY' ? '#166534' : r.type === 'BONUS' ? '#1e40af' : '#991b1b'}">
                    ${r.type === 'SALARY' ? 'راتب' : r.type === 'ADVANCE' ? 'سلفة' : r.type === 'BONUS' ? 'مكافأة' : r.type === 'PENALTY' ? 'خصم' : r.type}
                </td>
                <td style="text-align:center;font-weight:700">${r.amount.toLocaleString('en-US')} ${symVal}</td>
                <td>${r.note || '-'}</td>
            </tr>
        `).join('');

        const totalPaid = statementData.payrollRecords?.reduce((acc: number, r: any) => acc + r.amount, 0) || 0;
        const totalHours = statementData.attendances?.reduce((acc: number, a: any) => acc + (a.hoursWorked || 0), 0) || 0;
        const presentDays = statementData.attendances?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;

        const bodyHtml = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">إجمالي المدفوعات</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${totalPaid.toLocaleString('en-US')} ${symVal}</div>
                </div>
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">ساعات العمل</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${totalHours.toFixed(1)} س</div>
                </div>
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">أيام الحضور</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${presentDays} يوم</div>
                </div>
            </div>

            <div style="margin-bottom: 20px; font-size: 0.9rem; color: #333; background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe;">
                <strong>بيانات الموظف:</strong> ${viewStatement.name} (${viewStatement.title}) | كود: #${viewStatement.employeeId}
                <div style="font-size: 0.8rem; margin-top: 4px; color: #666;">الفترة من ${statStartDate} إلى ${statEndDate}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        const html = generatePrintHtml(bodyHtml, `كشف حساب موظف - ${viewStatement.name}`, config);

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

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const exportCSV = () => {
        const headers = ['الكود', 'الاسم', 'الوظيفة', 'تاريخ التعيين', 'الراتب', 'القسم'];
        const rows = employees.map(e => [e.employeeId, e.name, e.title, e.hireDate, e.baseSalary, e.department || '']);
        let csv = "\uFEFF" + headers.join(",") + "\n";
        rows.forEach(r => csv += r.map(v => `"${v}"`).join(",") + "\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "سجل_الموظفين.csv";
        link.click();
    };

    const importCSV = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split('\n');
            const items = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.replace(/"/g, ''));
                if (parts.length >= 2) items.push({
                    name: parts[1],
                    title: parts[2],
                    baseSalary: parts[4],
                    hireDate: parts[3],
                    department: parts[5],
                    phones: [{ phone: parts[6] || '', isPrimaryWhatsApp: true }]
                });
            }
            if (items.length > 0) {
                setLoading(true);
                await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
                fetchEmployees();
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">👥 شؤون العاملين</h1>
                    <p className="page-subtitle">إدارة {employees.length} موظف وفني وكشوف حساباتهم</p>
                </div>
                <div className="header-actions" style={{ gap: '10px' }}>
                    <button onClick={exportCSV} className="btn-secondary" style={{ padding: '0 15px', height: '42px', fontSize: '0.9rem' }} title="تصدير بيانات الموظفين">📥 تصدير</button>
                    {isAdmin && (
                        <button onClick={() => {
                            setForm({
                                id: '', name: '', title: '', age: '', address: '', nationalId: '', qualification: '', department: '', hireDate: new Date().toISOString().split('T')[0],
                                contractType: 'MONTHLY', baseSalary: '', canLogin: false, role: 'WORKER', username: '', password: '',
                                phones: [{ phone: '', isPrimaryWhatsApp: true }]
                            });
                            setShowAdd(true);
                        }} className="btn-primary" style={{ padding: '0 20px', height: '42px', fontWeight: 800 }}>
                            ➕ موظف جديد
                        </button>
                    )}
                </div>
            </header>

            <div className="content-centered-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-panel" >
                    <input
                        type="text"
                        className="input-glass"
                        placeholder="🔍 ابحث بالاسم، الوظيفة أو رقم هاتف..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        title="بحث عن موظف"
                    />
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
                                            <th>الموظف / القسم</th>
                                            <th className="hide-on-tablet">الوظيفة</th>
                                            <th >الراتب الأساسي</th>
                                            <th >الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map(emp => {
                                            const primaryPhone = emp.phones?.find((p: any) => p.isPrimaryWhatsApp) || emp.phones?.[0];
                                            return (
                                                <tr key={emp.id} className="employee-row-transition">
                                                    <td data-label="الموظف">
                                                        <div className="mobile-card-title" style={{ color: 'var(--primary-light)', fontWeight: 800 }}>{emp.name}</div>
                                                        <div className="emp-dept" style={{
                                                            fontSize: '0.75rem',
                                                            color: '#aaa',
                                                            background: 'rgba(255,255,255,0.06)',
                                                            padding: '2px 10px',
                                                            borderRadius: '20px',
                                                            width: 'fit-content',
                                                            margin: '5px auto 5px auto',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            textAlign: 'center'
                                                        }}>
                                                            {emp.department || 'عام'}
                                                        </div>
                                                    </td>
                                                    <td data-label="الوظيفة" style={{ fontWeight: 600 }}>{emp.title}</td>
                                                    <td data-label="الراتب الأساسي">
                                                        <div className="mobile-card-balance balance-green" style={{ fontSize: '1.2rem', fontWeight: 900, margin: '5px 0' }}>
                                                            <span>{emp.baseSalary.toLocaleString('en-US')}</span> <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>{sym}</small>
                                                        </div>
                                                    </td>
                                                    <td data-label="الإجراءات">
                                                        <div className="action-bar-cell mobile-card-actions" style={{ gap: '8px', padding: '10px 0' }}>
                                                            <button onClick={() => { setPayModal(emp); setPayAction(p => ({ ...p, type: 'SALARY', amount: emp.baseSalary.toString() })) }} className="btn-action" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }} title="صرف مالي">💵</button>

                                                            {primaryPhone?.phone && (
                                                                <button
                                                                    onClick={() => {
                                                                        const p = primaryPhone.phone.replace(/\D/g, '');
                                                                        window.open(`https://wa.me/2${p}`, '_blank');
                                                                    }}
                                                                    className="btn-action btn-whatsapp"
                                                                    style={{ background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }}
                                                                    title="واتساب"
                                                                >
                                                                    💬
                                                                </button>
                                                            )}
                                                            <button onClick={() => setViewStatement(emp)} className="btn-action" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }} title="كشف حساب / طباعة">📊</button>
                                                            {isAdmin && (
                                                                <button onClick={() => handleEditClick(emp)} className="btn-action btn-edit" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }} title="تعديل">📝</button>
                                                            )}
                                                            {isAdmin && (
                                                                <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="btn-action btn-danger" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }} title="حذف">🗑️</button>
                                                            )}
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

            {/* --- MODALS --- */}
            {payModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-sm">
                        <div className="modal-header">
                            <h2 >💸 تسجيل مالي: {payModal.name}</h2>
                            <button onClick={() => setPayModal(null)} className="btn-action btn-danger" >✕</button>
                        </div>
                        {payMsg && <p >{payMsg}</p>}
                        <form onSubmit={handlePay} className="field-group">
                            <div className="field-group">
                                <label className="field-label" htmlFor="pay_amt">المبلغ ({sym})</label>
                                <input id="pay_amt" type="number" className="input-glass" value={payAction.amount} onChange={e => setPayAction({ ...payAction, amount: e.target.value })} required />
                            </div>
                            <div className="field-group">
                                <label className="field-label" htmlFor="pay_type">نوع العملية</label>
                                <select id="pay_type" className="input-glass" value={payAction.type} onChange={e => setPayAction({ ...payAction, type: e.target.value })} title="نوع العملية">
                                    <option value="SALARY">راتب كامل</option>
                                    <option value="ADVANCE">سلفة</option>
                                    <option value="BONUS">مكافأة</option>
                                    <option value="PENALTY">جزاء</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setPayModal(null)} className="btn-secondary" >إلغاء</button>
                                <button type="submit" className="btn-success" >{isPaying ? 'جاري...' : 'تأكيد العملية'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdd && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 >{form.id ? '📝 تعديل بيانات موظف' : '➕ إضافة موظف جديد'}</h2>
                            <button onClick={() => setShowAdd(false)} className="btn-action btn-danger" >✕</button>
                        </div>
                        <form onSubmit={handleAdd} className="field-group">
                            <div className="field-grid">
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_name">الاسم الكامل</label>
                                    <input id="emp_name" required className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_title">المسمى الوظيفي</label>
                                    <input id="emp_title" required className="input-glass" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_dept">القسم / الورشة</label>
                                    <input id="emp_dept" className="input-glass" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_sal">الراتب الأساسي</label>
                                    <input id="emp_sal" type="number" required className="input-glass" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_cont">نظام المحاسبة</label>
                                    <select id="emp_cont" className="input-glass" value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })} title="نظام المحاسبة">
                                        <option value="MONTHLY">راتب شهري ثابث</option>
                                        <option value="DAILY">أجر يومي / بالقطعية</option>
                                    </select>
                                </div>

                                <div className="field-group">
                                    <div >
                                        <label className="field-label">📱 أرقام الهاتف والواتساب</label>
                                        <button type="button" onClick={addPhoneField} className="btn-secondary" >+ إضافة رقم</button>
                                    </div>
                                    <div className="field-group">
                                        {form.phones.map((phi, idx) => (
                                            <div key={idx} >
                                                <div >
                                                    <input
                                                        type="text"
                                                        className="input-glass"
                                                        value={phi.phone}
                                                        onChange={e => updatePhoneField(idx, e.target.value)}
                                                        placeholder="رقم الهاتف"

                                                        required={idx === 0}
                                                        title={`رقم هاتف ${idx + 1}`}
                                                    />
                                                    <label title="واتساب أساسي" >
                                                        <input type="radio" checked={phi.isPrimaryWhatsApp} onChange={() => setPrimaryWA(idx)} />
                                                        <span >🟢</span>
                                                    </label>
                                                </div>
                                                {form.phones.length > 1 && (
                                                    <button type="button" onClick={() => removePhoneField(idx)} className="btn-danger" >×</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_addr">العنوان بالتفصيل</label>
                                    <input id="emp_addr" type="text" className="input-glass" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_natid">الرقم القومي</label>
                                    <input id="emp_natid" type="text" className="input-glass" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="emp_hdate">تاريخ التعيين</label>
                                    <input id="emp_hdate" type="date" className="input-glass" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="glass-panel" >
                                <label >
                                    <input type="checkbox" checked={form.canLogin} onChange={e => setForm({ ...form, canLogin: e.target.checked })} />
                                    🔐 منح صلاحية دخول للنظام
                                </label>

                                {form.canLogin && (
                                    <div className="field-grid" >
                                        <div className="field-group">
                                            <label className="field-label" htmlFor="sys_role">صلاحية المستخدم</label>
                                            <select id="sys_role" className="input-glass" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} title="صلاحية المستخدم">
                                                <option value="WORKER">عامل (فقط شاشة الإنتاج)</option>
                                                <option value="INVENTORY">أمين مخزن</option>
                                                <option value="SALES">مناديب مبيعات وعملاء</option>
                                                <option value="ACCOUNTANT">محاسب نظام</option>
                                                <option value="ADMIN">مدير نظام كامل</option>
                                            </select>
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label" htmlFor="sys_user">اسم المستخدم</label>
                                            <input id="sys_user" type="text" className="input-glass" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required={form.canLogin} />
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label" htmlFor="sys_pass">كلمة المرور</label>
                                            <input id="sys_pass" type="password" placeholder={form.id ? "اتركه فارغاً للحفاظ على الحالي" : "مطلوب"} className="input-glass" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={form.canLogin && !form.id} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary" >إلغاء</button>
                                <button type="submit" className="btn-primary" >{isSaving ? '⏳ جاري الحفظ...' : '💾 حفظ البيانات'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewStatement && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 >📊 كشف حساب: {viewStatement.name}</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handlePrintEmployeeStatement} className="btn-modern btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>🖨️ طباعة الكشف</button>
                                <button onClick={() => { setViewStatement(null); setStatementData(null); }} className="btn-action btn-danger" >✕</button>
                            </div>
                        </div>

                        <div className="glass-panel" >
                            <div className="field-grid" >
                                <div className="field-group">
                                    <label className="field-label" htmlFor="stmt_start">من تاريخ</label>
                                    <input id="stmt_start" type="date" className="input-glass" value={statStartDate} onChange={e => setStatStartDate(e.target.value)} />
                                </div>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="stmt_end">إلى تاريخ</label>
                                    <input id="stmt_end" type="date" className="input-glass" value={statEndDate} onChange={e => setStatEndDate(e.target.value)} />
                                </div>
                                <div className="field-group">
                                    <button className="btn-primary" onClick={() => fetchStatement(viewStatement.id)} disabled={isFetchingStmt} >
                                        {isFetchingStmt ? '⏳ جارٍ الجلب...' : '🔍 جلب البيانات'}
                                    </button>
                                </div>
                            </div>


                        </div>

                        {statementData ? (
                            <div className="animate-fade-in">
                                <div >
                                    <div className="glass-panel" >
                                        <div >إجمالي المدفوعات</div>
                                        <div >{statementData.payrollRecords?.reduce((acc: number, r: any) => acc + r.amount, 0).toLocaleString('en-US')} {sym}</div>
                                    </div>
                                    <div className="glass-panel" >
                                        <div >ساعات العمل</div>
                                        <div >{statementData.attendances?.reduce((acc: number, a: any) => acc + (a.hoursWorked || 0), 0).toFixed(1)} س</div>
                                    </div>
                                    <div className="glass-panel" >
                                        <div >أيام الحضور</div>
                                        <div >{statementData.attendances?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length}</div>
                                    </div>
                                </div>

                                <div className="table-responsive-wrapper">
                                    <table className="table-glass high-density" >
                                        <thead>
                                            <tr>
                                                <th>التاريخ</th>
                                                <th>العملية</th>
                                                <th >المبلغ</th>
                                                <th>ملاحظات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statementData.payrollRecords?.map((r: any) => (
                                                <tr key={r.id}>
                                                    <td>{new Date(r.date).toLocaleDateString('ar-EG')}</td>
                                                    <td>
                                                        <span >
                                                            {r.type === 'SALARY' ? 'راتب' : r.type === 'ADVANCE' ? 'سلفة' : r.type === 'BONUS' ? 'مكافأة' : r.type === 'PENALTY' ? 'خصم' : r.type}
                                                        </span>
                                                    </td>
                                                    <td >{r.amount.toLocaleString('en-US')} {sym}</td>
                                                    <td >{r.note || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div>📋</div>
                                <p>حدد المدة واضغط على "جلب البيانات" لعرض الكشف المالي والإحصائي</p>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}

