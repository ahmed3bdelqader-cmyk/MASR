'use client';
import React, { useState, useEffect } from 'react';

export default function ExpensesView({ sym, isAdmin }: { sym: string, isAdmin: boolean }) {
    const [categories, setCategories] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ categoryId: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    const [success, setSuccess] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        try {
            const res = await fetch('/api/expenses');
            const data = await res.json();
            setCategories(data.categories || []);
            setExpenses(data.expenses || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(''); setErrorMsg('');
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('تم تسجيل المصروف وخصمه من الخزينة ينجاح!');
                setForm({ ...form, amount: '', description: '' });
                fetchData();
                // trigger treasury reload on parent if possible
                window.dispatchEvent(new Event('reloadTreasury'));
            } else {
                setErrorMsg(data.error || 'حدث خطأ غير معروف');
            }
        } catch (e) { setErrorMsg('خطأ في الاتصال'); }
    }

    return (
        <div className="reports-grid animate-fade-in" style={{ alignItems: 'start' }}>
            <form onSubmit={handleSubmit} className="glass-panel report-sidebar-menu" style={{ alignSelf: 'start', width: '100%', position: 'sticky', top: '24px' }}>
                <h3 className="settings-section-label">تسجيل مصروف جديد</h3>
                {success && <div className="sh-badge paid" style={{ marginBottom: '1rem', display: 'block', textAlign: 'center' }}>{success}</div>}
                {errorMsg && <div className="sh-badge unpaid" style={{ marginBottom: '1rem', display: 'block', textAlign: 'center' }}>{errorMsg}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label>بند المصروف</label>
                        <select className="input-glass" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                            <option value="">-- اختر البند --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>المبلغ (يخصم من الخزينة الرئيسية)</label>
                        <input type="number" step="0.01" className="input-glass" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0.01" />
                    </div>
                    <div>
                        <label>البيان / الوصف</label>
                        <input type="text" className="input-glass" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                    </div>
                    <div>
                        <label>التاريخ</label>
                        <input type="date" className="input-glass" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn-modern btn-primary" style={{ marginTop: '0.5rem', background: '#E35E35', borderColor: 'rgba(227,94,53,0.3)', width: '100%' }}>
                        ⬇ إثبات مصروف وخصم
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0, textAlign: 'center' }}> يتم الخصم من الخزينة الرئيسية مباشرة</p>
                </div>
            </form>

            <div className="glass-panel">
                <h3 style={{ marginBottom: '1.25rem' }}>سجل المصروفات المباشرة</h3>
                {loading ? <p>جاري التحميل...</p> : (
                    <div className="table-container" style={{ maxHeight: '500px' }}>
                        <table className="table-glass high-density responsive-cards">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>البند</th>
                                    <th>البيان</th>
                                    <th style={{ textAlign: 'center' }}>القيمة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((ex: any) => (
                                    <tr key={ex.id}>
                                        <td data-label="التاريخ" style={{ fontSize: '0.85rem' }}>{new Date(ex.date).toLocaleDateString('ar-EG')}</td>
                                        <td data-label="البند"><span className="sh-badge warning" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>{ex.category?.name}</span></td>
                                        <td data-label="البيان" style={{ fontSize: '0.85rem' }}>{ex.description}</td>
                                        <td data-label="القيمة" style={{ textAlign: 'center', fontWeight: 'bold', color: '#E35E35', fontSize: '1rem' }}>{Number(ex.amount).toLocaleString('en-US')} {sym}</td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>لا توجد مصروفات مسجلة</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
} 
