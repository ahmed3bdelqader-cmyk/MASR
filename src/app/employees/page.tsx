'use client';
import React, { useEffect, useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type PayrollRecord = {
    id: string; type: string; amount: number; date: string; month?: number; year?: number; note?: string;
};

type Employee = {
    id: string; employeeId: number; name: string; title: string; contact?: string;
    contractType: string; baseSalary: number; hireDate: string; nationalId?: string;
    qualification?: string; contact2?: string; role?: string; canLogin?: boolean;
    department?: string; address?: string; payrollRecords: PayrollRecord[];
};

const SYM = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } });

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [sym, setSym] = useState('ج.م');

    // Form states
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        id: '', name: '', title: '', age: '', contact: '', contact2: '', address: '', nationalId: '', qualification: '', department: '', hireDate: new Date().toISOString().split('T')[0],
        contractType: 'MONTHLY', baseSalary: '', canLogin: false, role: 'WORKER', username: '', password: ''
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
            setIsAdmin(u.role === 'ADMIN' || !u.role);
        } catch { }
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            if (Array.isArray(data)) setEmployees(data);
            else setEmployees([]);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
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
                setForm({ id: '', name: '', title: '', age: '', contact: '', contact2: '', address: '', nationalId: '', qualification: '', department: '', hireDate: new Date().toISOString().split('T')[0], contractType: 'MONTHLY', baseSalary: '', canLogin: false, role: 'WORKER', username: '', password: '' });
                fetchEmployees();
            }
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
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

    const printStatement = () => {
        if (!statementData) return;
        const emp = statementData;
        const payroll = emp.payrollRecords || [];
        const attendances = emp.attendances || [];
        const accent = s.primaryColor || '#E35E35';

        const win = window.open('', '_blank');
        if (!win) return;

        const payrollRows = payroll.map((r: any) => `
            <tr>
                <td>${new Date(r.date).toLocaleDateString('ar-EG')}</td>
                <td>${r.type === 'SALARY' ? 'راتب' : r.type === 'ADVANCE' ? 'سلفة' : r.type === 'BONUS' ? 'مكافأة' : r.type === 'PENALTY' ? 'خصم' : r.type}</td>
                <td style="font-weight:bold;color:${r.type === 'PENALTY' ? '#ef4444' : '#10b981'}">${r.amount} ${sym}</td>
                <td>${r.note || '-'}</td>
            </tr>
        `).join('');

        const attendanceRows = attendances.map((a: any) => `
            <tr>
                <td>${a.dateStr}</td>
                <td>${a.status === 'PRESENT' ? 'حاضر' : a.status === 'ABSENT' ? 'غائب' : a.status === 'LATE' ? 'متأخر' : a.status}</td>
                <td>${a.checkIn ? new Date(a.checkIn).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>${a.checkOut ? new Date(a.checkOut).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>${a.hoursWorked || 0} س</td>
            </tr>
        `).join('');

        const totalPayroll = payroll.reduce((acc: number, r: any) => acc + r.amount, 0);
        const totalHours = attendances.reduce((acc: number, a: any) => acc + (a.hoursWorked || 0), 0);

        win.document.write(`
            <html dir="rtl">
            <head>
                <title>كشف حساب - ${emp.name}</title>
                <style>
                    body { font-family: Tahoma, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { display: flex; justify-content: space-between; border-bottom: 3px solid ${accent}; padding-bottom: 20px; margin-bottom: 30px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-radius: 10px; }
                    .section-title { color: ${accent}; border-right: 5px solid ${accent}; padding-right: 15px; margin: 30px 0 15px; font-size: 1.2rem; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
                    th { background: #eee; color: #000; }
                    .summary-box { background: ${accent}; color: white; padding: 20px; border-radius: 10px; display: flex; justify-content: space-around; font-size: 1.1rem; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body onload="window.print()">
                <div class="header">
                    <div>
                        <h1 style="margin:0; color:${accent}">${s.appName || 'نظام إدارة المصنع'}</h1>
                        <p style="margin:5px 0">كشف حساب موظف وافٍ (مالي + حضور)</p>
                        <p>من: ${statStartDate} | إلى: ${statEndDate}</p>
                    </div>
                </div>

                <div class="info-grid">
                    <div><strong>الاسم:</strong> ${emp.name}</div>
                    <div><strong>كود الموظف:</strong> ${emp.employeeId}</div>
                    <div><strong>المسمى الوظيفي:</strong> ${emp.title}</div>
                    <div><strong>القسم:</strong> ${emp.department || '-'}</div>
                    <div><strong>الراتب الأساسي:</strong> ${emp.baseSalary} ${sym}</div>
                </div>

                <div class="section-title">📊 الملخص المالي والعام</div>
                <div class="summary-box">
                    <div>إجمالي الحركات المالية: <strong>${totalPayroll.toFixed(2)} ${sym}</strong></div>
                    <div>إجمالي ساعات العمل: <strong>${totalHours.toFixed(1)} س</strong></div>
                    <div>أيام الحضور: <strong>${attendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length}</strong></div>
                </div>

                <div class="section-title">💸 السجل المالي (صرف، سلف، جزاءات)</div>
                <table>
                    <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th></tr></thead>
                    <tbody>${payrollRows || '<tr><td colspan="4" style="text-align:center">لا توجد حركات</td></tr>'}</tbody>
                </table>

                <div class="section-title">⏱️ سجل الحضور والانصراف</div>
                <table>
                    <thead><tr><th>التاريخ</th><th>الحالة</th><th>حضور</th><th>انصراف</th><th>الساعات</th></tr></thead>
                    <tbody>${attendanceRows || '<tr><td colspan="5" style="text-align:center">لا يوجد سجل حضور</td></tr>'}</tbody>
                </table>

                <div style="margin-top:50px; text-align:left; font-size:0.8rem; color:#999;">
                    تم استخراج هذا التقرير بتاريخ: ${new Date().toLocaleString('ar-EG')}
                </div>
            </body>
            </html>
        `);
        win.document.close();
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
            contact: emp.contact || '', contact2: emp.contact2 || '', address: emp.address || '',
            nationalId: emp.nationalId || '', qualification: emp.qualification || '', department: emp.department || '',
            hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            contractType: emp.contractType || 'MONTHLY', baseSalary: emp.baseSalary ? emp.baseSalary.toString() : '',
            canLogin: emp.canLogin || false, role: emp.role || 'WORKER', username: emp.username || '', password: '',
        });
        setShowAdd(true);
    };

    // ── Filtering and Pagination ──────────────────────────────────────────────
    const filtered = useMemo(() => {
        return employees.filter(e =>
            e.name.includes(searchTerm) || e.title.includes(searchTerm) || e.employeeId.toString().includes(searchTerm)
        );
    }, [employees, searchTerm]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // ── CSV Export/Import ────────────────────────────────────────────────────
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
                if (parts.length >= 2) items.push({ name: parts[1], title: parts[2], baseSalary: parts[4], hireDate: parts[3], department: parts[5] });
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
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0f1115', color: '#e2e8f0', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#29b6f6' }}>👥 شؤون العاملين</h1>
                    <p style={{ color: '#919398' }}>إدارة {employees.length} موظف</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={exportCSV} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', gap: '8px' }}>
                        📥 تصدير
                    </button>
                    {isAdmin && (
                        <label className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', gap: '8px', cursor: 'pointer', margin: 0 }}>
                            📤 استيراد <input type="file" hidden onChange={importCSV} />
                        </label>
                    )}
                    <button onClick={() => window.location.href = '/employees/attendance'} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)', gap: '8px' }}>
                        ⏱️ الحضور
                    </button>
                    {isAdmin && (
                        <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: '8px 20px' }}>
                            + إضافة موظف
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem' }}>
                <label htmlFor="emp_search" className="sr-only">ابحث عن موظف</label>
                <input id="emp_search" type="text" placeholder="🔍 ابحث عن اسم أو وظيفة أو كود..." className="input-glass" style={{ flex: 1 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} title="البحث في قائمة الموظفين" />
            </div>

            {loading ? <p>جاري التحميل...</p> : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table-glass" style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ textAlign: 'right' }}>
                                <th style={{ padding: '15px' }}>#</th>
                                <th>الموظف</th>
                                <th>الوظيفة</th>
                                <th>الراتب</th>
                                <th style={{ width: '280px' }}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(emp => (
                                <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px' }}>{emp.employeeId}</td>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>{emp.department}</div>
                                    </td>
                                    <td>{emp.title}</td>
                                    <td style={{ fontWeight: 800, color: '#29b6f6' }}>{emp.baseSalary} {sym}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => { setPayModal(emp); setPayAction(p => ({ ...p, type: 'SALARY', amount: emp.baseSalary.toString() })) }}
                                                className="btn-primary btn-sm"
                                            >
                                                💵 صرف
                                            </button>
                                            <button
                                                onClick={() => setViewStatement(emp)}
                                                className="btn-secondary btn-sm"
                                            >
                                                📄 كشف
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleEditClick(emp)}
                                                    className="btn-secondary btn-sm"
                                                    style={{ color: '#ffa726', borderColor: 'rgba(255, 167, 38, 0.2)' }}
                                                    title="تعديل"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                                    className="btn-danger btn-sm"
                                                    title="حذف"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 15px', opacity: currentPage === 1 ? 0.3 : 1 }}>
                            السابق
                        </button>
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>صفحة {currentPage} من {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 15px', opacity: currentPage === totalPages ? 0.3 : 1 }}>
                            التالي
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}
            {payModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#1c1e24', padding: '2rem', borderRadius: '15px', width: '400px', border: '1px solid #333' }}>
                        <h3>تسجيل مالي: {payModal.name}</h3>
                        {payMsg && <p style={{ color: '#66bb6a' }}>{payMsg}</p>}
                        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label htmlFor="pay_amt">المبلغ</label>
                            <input id="pay_amt" type="number" className="input-glass" value={payAction.amount} onChange={e => setPayAction({ ...payAction, amount: e.target.value })} required title="المبلغ المصروف" />
                            <label htmlFor="pay_type">النوع</label>
                            <select id="pay_type" className="input-glass" value={payAction.type} onChange={e => setPayAction({ ...payAction, type: e.target.value })} title="نوع العملية المالية">
                                <option value="SALARY">راتب كامل</option>
                                <option value="ADVANCE">سلفة</option>
                                <option value="BONUS">مكافأة</option>
                                <option value="PENALTY">جزاء</option>
                            </select>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                <button type="button" onClick={() => setPayModal(null)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>تأكيد</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#1c1e24', padding: '2rem', borderRadius: '15px', width: '500px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>{form.id ? 'تعديل موظف' : 'إضافة موظف'}</h3>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                                <div style={{ gridColumn: '1 / -1' }}><label htmlFor="emp_name">الاسم الكامل</label><input id="emp_name" required className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم الموظف" title="الاسم الكامل" /></div>
                                <div><label htmlFor="emp_title">المسمى الوظيفي</label><input id="emp_title" required className="input-glass" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: فني لحام" title="المسمى الوظيفي" /></div>
                                <div><label htmlFor="emp_dept">القسم الاختياري</label><input id="emp_dept" className="input-glass" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="مثال: الدهانات" title="القسم" /></div>
                                <div><label htmlFor="emp_sal">الراتب الأساسي</label><input id="emp_sal" type="number" required className="input-glass" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} placeholder="قيمة الراتب أو اليومية" title="الراتب الأساسي" /></div>
                                <div><label htmlFor="emp_cont">نوع التعاقد</label><select id="emp_cont" className="input-glass" value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })} title="نوع التعاقد"><option value="MONTHLY">راتب شهري</option><option value="DAILY">أجر يومي</option></select></div>
                                <div><label htmlFor="emp_ph1">الهاتف (1)</label><input id="emp_ph1" type="text" className="input-glass" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} title="رقم الهاتف الأول" /></div>
                                <div><label htmlFor="emp_ph2">الهاتف (2)</label><input id="emp_ph2" type="text" className="input-glass" value={form.contact2} onChange={e => setForm({ ...form, contact2: e.target.value })} title="رقم الهاتف الثاني" /></div>
                                <div style={{ gridColumn: '1 / -1' }}><label htmlFor="emp_addr">العنوان المؤكد</label><input id="emp_addr" type="text" className="input-glass" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} title="العنوان" /></div>
                                <div><label htmlFor="emp_natid">الرقم القومي (14 رقم)</label><input id="emp_natid" type="text" className="input-glass" value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} title="الرقم القومي" /></div>
                                <div><label htmlFor="emp_hdate">تاريخ التعيين</label><input id="emp_hdate" type="date" className="input-glass" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} title="تاريخ التعيين" /></div>
                            </div>

                            <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                <input type="checkbox" checked={form.canLogin} onChange={e => setForm({ ...form, canLogin: e.target.checked })} style={{ accentColor: '#29b6f6', width: '20px', height: '20px' }} />
                                منح المستخدم صلاحية الدخول للنظام (تسجيل دخول)
                            </label>

                            {form.canLogin && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '5px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label htmlFor="sys_role">صلاحية النظام (Role)</label>
                                        <select id="sys_role" className="input-glass" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} title="اختر الصلاحية">
                                            <option value="WORKER">عامل (WORKER) - صالحة للعمال وشاشات الإنتاج فقط</option>
                                            <option value="INVENTORY">مخازن (INVENTORY) - إدارة واستلام وتسليم وصرف</option>
                                            <option value="SALES">مبيعات (SALES) - إصدار الفواتير وعروض الأسعار والعملاء</option>
                                            <option value="ACCOUNTANT">محاسب (ACCOUNTANT) - خزينة ورواتب وفواتير</option>
                                            <option value="ADMIN">مدير نظام (ADMIN) - كامل الصلاحيات</option>
                                        </select>
                                    </div>
                                    <div><label htmlFor="sys_user">اسم المستخدم (يجب أن يكون فريد)</label><input id="sys_user" type="text" className="input-glass" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required={form.canLogin} title="اسم المستخدم" /></div>
                                    <div><label htmlFor="sys_pass">كلمة المرور</label><input id="sys_pass" type="text" placeholder={form.id ? "اتركه فارغاً للحفاظ على القديم" : "مطلوب"} className="input-glass" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={form.canLogin && !form.id} title="كلمة المرور" /></div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{isSaving ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewStatement && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#1c1e24', padding: '2rem', borderRadius: '15px', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #2d2f36' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #2d2f36', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: s.primaryColor || '#E35E35' }}>📄 كشف حساب الموظف: {viewStatement.name}</h3>
                            <button onClick={() => { setViewStatement(null); setStatementData(null); }} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="stmt_start" style={{ display: 'block', fontSize: '0.8rem', color: '#999', marginBottom: '5px' }}>من تاريخ</label>
                                <input id="stmt_start" type="date" className="input-glass" value={statStartDate} onChange={e => setStatStartDate(e.target.value)} title="تاريخ البداية" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="stmt_end" style={{ display: 'block', fontSize: '0.8rem', color: '#999', marginBottom: '5px' }}>إلى تاريخ</label>
                                <input id="stmt_end" type="date" className="input-glass" value={statEndDate} onChange={e => setStatEndDate(e.target.value)} title="تاريخ النهاية" />
                            </div>
                            <button className="btn-primary" onClick={() => fetchStatement(viewStatement.id)} disabled={isFetchingStmt} style={{ background: s.primaryColor || '#E35E35', height: '42px', padding: '0 25px' }}>
                                {isFetchingStmt ? 'جاري التحميل...' : '🔍 عرض الكشف وافٍ'}
                            </button>
                            {statementData && (
                                <button className="btn-secondary" onClick={printStatement} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', height: '42px', padding: '0 25px' }}>
                                    🖨️ طباعة PDF
                                </button>
                            )}
                        </div>

                        {statementData ? (
                            <div className="animate-fade-in">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                                    <div style={{ background: 'rgba(52,211,153,0.1)', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #10b981' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#10b981' }}>إجمالي المسحوبات/الرواتب</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statementData.payrollRecords?.reduce((acc: number, r: any) => acc + r.amount, 0).toFixed(2)} {sym}</div>
                                    </div>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #3b82f6' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>ساعات العمل بالمدة</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statementData.attendances?.reduce((acc: number, a: any) => acc + (a.hoursWorked || 0), 0).toFixed(1)} س</div>
                                    </div>
                                    <div style={{ background: 'rgba(245,158,11,0.1)', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f59e0b' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>أيام الحضور</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statementData.attendances?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length}</div>
                                    </div>
                                </div>

                                <h4 style={{ color: '#fff', borderRight: `4px solid ${s.primaryColor || '#E35E35'}`, paddingRight: '10px', marginBottom: '10px' }}>💸 الحركات المالية</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #444', textAlign: 'right', background: 'rgba(255,255,255,0.03)' }}>
                                            <th style={{ padding: '12px' }}>التاريخ</th>
                                            <th>النوع</th>
                                            <th>المبلغ</th>
                                            <th>ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statementData.payrollRecords?.map((r: any) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #222' }} className="table-row-hover">
                                                <td style={{ padding: '12px' }}>{new Date(r.date).toLocaleDateString('ar-EG')}</td>
                                                <td>
                                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
                                                        {r.type === 'SALARY' ? 'راتب' : r.type === 'ADVANCE' ? 'سلفة' : r.type === 'BONUS' ? 'مكافأة' : r.type === 'PENALTY' ? 'خصم' : r.type}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 800, color: r.type === 'PENALTY' ? '#ef4444' : '#10b981' }}>{r.amount} {sym}</td>
                                                <td style={{ fontSize: '0.8rem', color: '#919398' }}>{r.note || '-'}</td>
                                            </tr>
                                        ))}
                                        {statementData.payrollRecords?.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#555' }}>لا توجد حركات مالية في هذه الفترة</td></tr>}
                                    </tbody>
                                </table>

                                <h4 style={{ color: '#fff', borderRight: `4px solid ${s.primaryColor || '#E35E35'}`, paddingRight: '10px', marginBottom: '10px' }}>⏱️ سجل الحضور</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #444', textAlign: 'right', background: 'rgba(255,255,255,0.03)' }}>
                                            <th style={{ padding: '12px' }}>اليوم</th>
                                            <th>الحالة</th>
                                            <th>حضور/انصراف</th>
                                            <th>ساعات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statementData.attendances?.map((a: any) => (
                                            <tr key={a.id} style={{ borderBottom: '1px solid #222' }} className="table-row-hover">
                                                <td style={{ padding: '12px' }}>{a.dateStr}</td>
                                                <td>
                                                    <span style={{ color: a.status === 'ABSENT' ? '#ef4444' : '#34d399', fontSize: '0.8rem' }}>
                                                        {a.status === 'PRESENT' ? 'حاضر' : a.status === 'ABSENT' ? 'غائب' : a.status === 'LATE' ? 'متأخر' : a.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>
                                                    {a.checkIn ? new Date(a.checkIn).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--:--'} /
                                                    {a.checkOut ? new Date(a.checkOut).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </td>
                                                <td style={{ fontWeight: 'bold' }}>{a.hoursWorked || 0} س</td>
                                            </tr>
                                        ))}
                                        {statementData.attendances?.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#555' }}>لا يوجد سجل حضور في هذه الفترة</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#919398', border: '1px dashed #333', borderRadius: '15px' }}>
                                {isFetchingStmt ? 'جاري جلب البيانات من السجلات...' : 'الرجاء تحديد المدة والضغط على "عرض" لجلب كافة تفاصيل الموظف'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
