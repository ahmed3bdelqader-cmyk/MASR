'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { Search, Building2 } from 'lucide-react';
import PrintReportBtn from '@/components/PrintReportBtn';

export default function AttendancePage() {
    const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // --- NEW: Search, Filter, Pagination State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5);

    // --- NEW: Monthly Report State ---
    const [reportModal, setReportModal] = useState<any>(null);
    const [reportStartDate, setReportStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [reportEndDate, setReportEndDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [reportData, setReportData] = useState<any>(null);
    const [fetchingReport, setFetchingReport] = useState(false);

    // --- NEW: Edit Modal for Mobile ---
    const [editModalEmpId, setEditModalEmpId] = useState<string | null>(null);
    const editEmp = records.find(r => r.id === editModalEmpId);

    useEffect(() => {
        fetchData();
        const saved = localStorage.getItem('erp_attendance_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));
    }, [dateStr]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/attendance?date=${dateStr}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRecords(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateStr, records })
            });
            if (res.ok) {
                setMsg('✅ تم حفظ يومية الحضور والانصراف بنجاح');
                setTimeout(() => setMsg(''), 3000);
            } else {
                setMsg('❌ حدث خطأ أثناء الحفظ');
            }
        } catch (e) {
            setMsg('❌ فشل الاتصال بالسيرفر');
        } finally {
            setSaving(false);
        }
    };

    const updateRecord = (empId: string, field: string, value: any) => {
        setRecords(prev => prev.map(rec => {
            if (rec.id !== empId) return rec;

            let updated = { ...rec, [field]: value };

            // تعيين وقت تلقائي عند الحضور إذا كان فارغاً + افتراض 8 ساعات عمل
            if (field === 'status' && (value === 'PRESENT' || value === 'LATE')) {
                const now = new Date();
                if (!updated.checkIn) {
                    const d = new Date(dateStr);
                    d.setHours(now.getHours(), now.getMinutes(), 0, 0);
                    updated.checkIn = d.toISOString();
                }
                if (!updated.checkOut) {
                    const start = new Date(updated.checkIn);
                    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000); // +8 hours default
                    updated.checkOut = end.toISOString();
                }
            }

            // تصفير الأوقات إذا تحول لغياب أو إجازة
            if (field === 'status' && value !== 'PRESENT' && value !== 'LATE' && value !== 'PENDING') {
                updated.checkIn = null;
                updated.checkOut = null;
                updated.hoursWorked = null;
            }

            // حساب الساعات تلقائياً عند تغيير الأوقات
            if (field === 'checkOut' || field === 'checkIn' || field === 'status') {
                if (updated.checkIn && updated.checkOut) {
                    const diffMs = new Date(updated.checkOut).getTime() - new Date(updated.checkIn).getTime();
                    updated.hoursWorked = diffMs > 0 ? (diffMs / (3600000)).toFixed(2) : "0.00";
                }
            }

            // تحديث وقت الانصراف تلقائياً عند كتابة الساعات يدوياً (بدون تدخل حسابي من المستخدم)
            if (field === 'hoursWorked') {
                if (updated.checkIn && value !== '') {
                    const start = new Date(updated.checkIn);
                    const end = new Date(start.getTime() + parseFloat(value) * 3600000);
                    updated.checkOut = end.toISOString();
                }
            }

            return updated;
        }));
    };

    const markAll = (status: string) => {
        const now = new Date();
        const d = new Date(dateStr);
        d.setHours(now.getHours(), now.getMinutes(), 0, 0);
        const startTime = d.toISOString();
        const endTime = new Date(d.getTime() + 8 * 60 * 60 * 1000).toISOString();

        setRecords(prev => prev.map(rec => {
            const matchesSearch = rec.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDept = filterDepartment === 'ALL' || rec.department === filterDepartment;
            if (!(matchesSearch && matchesDept)) return rec;

            const isPresent = (status === 'PRESENT' || status === 'LATE');
            const checkIn = isPresent ? (rec.checkIn || startTime) : null;
            const checkOut = isPresent ? (rec.checkOut || endTime) : null;
            let hoursWorked = null;

            if (checkIn && checkOut) {
                const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
                hoursWorked = diffMs > 0 ? (diffMs / 3600000).toFixed(2) : "0.00";
            }

            return { ...rec, status, checkIn, checkOut, hoursWorked };
        }));
    };

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_attendance_pageSize', val);
        setCurrentPage(1);
    };

    const fetchMonthlyReport = async (empId: string) => {
        setFetchingReport(true);
        try {
            const res = await fetch(`/api/attendance?date=report&reportType=MONTHLY&employeeId=${empId}&startDate=${reportStartDate}&endDate=${reportEndDate}`);
            const data = await res.json();
            setReportData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingReport(false);
        }
    };

    // Derived state for Filtering & Pagination
    const uniqueDepartments = Array.from(new Set(records.map(r => r.department).filter(Boolean)));
    const filteredRecords = records.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDepartment === 'ALL' || emp.department === filterDepartment;
        return matchesSearch && matchesDept;
    });
    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredRecords.length / (pageSize as number)) || 1;
    let validCurrentPage = currentPage;
    if (currentPage > totalPages) validCurrentPage = totalPages;
    const paginatedRecords = React.useMemo(() => {
        if (pageSize === 'ALL') return filteredRecords;
        const start = (validCurrentPage - 1) * (pageSize as number);
        return filteredRecords.slice(start, start + (pageSize as number));
    }, [filteredRecords, validCurrentPage, pageSize]);

    return (
        <div className="unified-container animate-fade-in" style={{ padding: '0 1rem' }}>
            {/* --- Top Actions & Header --- */}
            <header className="flex-between mb-6 bg-black/20 border border-white/10 rounded-2xl p-4 lg:p-6 shadow-lg shadow-black/20 mt-4">
                <div>
                    <h1 className="text-primary m-0 text-2xl lg:text-3xl font-bold flex items-center gap-2">
                        ⏱️ الحضور والانصراف
                    </h1>
                    <p className="text-muted mt-2 mb-0 text-sm">تسجيل يومية الموظفين ومعدل الساعات</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/employees">
                        <button className="btn-modern btn-secondary">👥 شؤون العاملين</button>
                    </Link>
                    <button onClick={handleSave} disabled={saving} className="btn-modern btn-primary text-lg px-6 font-bold shadow-lg shadow-primary/20">
                        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ اليومية'}
                    </button>
                </div>
            </header>

            <div className="flex flex-col gap-6">

                {/* --- Controls Bar & Filters --- */}
                <div className="glass-panel p-4 bg-gradient-to-r from-black/40 to-black/20 flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-4 flex-wrap items-center w-full lg:w-auto">
                        <div className="flex flex-col">
                            <label className="text-xs text-muted mb-1" htmlFor="attendance-date">تاريخ اليومية</label>
                            <input
                                id="attendance-date"
                                type="date"
                                className="input-glass text-lg py-2 text-white font-bold"
                                value={dateStr}
                                onChange={e => { setDateStr(e.target.value); setCurrentPage(1); }}
                                style={{ width: '160px' }}
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-[150px]">
                            <label className="text-xs text-muted mb-1" htmlFor="search-emp" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Search size={14} /> بحث باسم الموظف
                            </label>
                            <input
                                id="search-emp"
                                type="text"
                                className="input-glass text-lg py-3 w-full text-white"
                                placeholder="اكتب اسم الموظف..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                style={{ borderRadius: '8px' }}
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-[150px] max-w-[200px]">
                            <label className="text-xs text-muted mb-1" htmlFor="filter-dept" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building2 size={14} /> القسم / الإدارة
                            </label>
                            <select
                                id="filter-dept"
                                className="input-glass text-lg py-3 w-full cursor-pointer text-white"
                                value={filterDepartment}
                                onChange={e => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
                                style={{ borderRadius: '8px' }}
                            >
                                <option value="ALL">الكل</option>
                                {uniqueDepartments.map((dept: any) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 justify-end" style={{ flexWrap: 'wrap' }}>
                        <button onClick={() => markAll('PRESENT')} className="btn-modern" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399', padding: '10px 20px', fontSize: '1.1rem', fontWeight: 'bold', flex: '1 1 auto', textAlign: 'center' }}>✅ تحضير الكل</button>
                        <button onClick={() => markAll('ABSENT')} className="btn-modern" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 20px', fontSize: '1.1rem', fontWeight: 'bold', flex: '1 1 auto', textAlign: 'center' }}>❌ تغيب الكل</button>
                    </div>
                </div>

                {msg && (
                    <div className="animate-fade-in" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', textAlign: 'center', fontWeight: 600 }}>
                        {msg}
                    </div>
                )}

                {/* --- Attendance Table / Grid --- */}
                <div className="glass-panel p-2 sm:p-4 mb-6">
                    {loading ? (
                        <p className="text-center text-muted p-8 text-lg">⏳ جاري تحميل الكشوف...</p>
                    ) : (
                        <div className="smart-table-container">
                            <table className="smart-table w-full">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th className="text-center" style={{ width: '230px' }}>الحالة</th>
                                        <th className="text-center" style={{ width: '130px' }}>الحضور</th>
                                        <th className="text-center" style={{ width: '180px' }}>الانصراف</th>
                                        <th className="text-center" style={{ width: '90px' }}>ساعات</th>
                                        <th className="hide-on-tablet">ملاحظات</th>
                                        <th className="text-center" style={{ width: '60px' }}>تقارير</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRecords.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center p-8 text-muted text-lg">لا يوجد موظفين يطابقون شروط البحث</td></tr>
                                    ) : paginatedRecords.map(emp => (
                                        <tr key={emp.id} style={{
                                            borderRight: emp.status === 'PRESENT' ? '4px solid #10b981' : emp.status === 'ABSENT' ? '4px solid #ef4444' : '4px solid transparent',
                                            backgroundColor: emp.status === 'PRESENT' ? 'rgba(16,185,129,0.02)' : emp.status === 'ABSENT' ? 'rgba(239,68,68,0.02)' : 'transparent',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <td data-label="الموظف">
                                                <div className="mobile-card-title">{emp.name}</div>
                                                <div className="text-muted text-xs mt-1">{emp.title} | {emp.department || 'عام'}</div>
                                            </td>
                                            <td className="text-center" data-label="الحالة">
                                                <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => updateRecord(emp.id, 'status', 'PRESENT')}
                                                        className="btn-modern"
                                                        style={{
                                                            flex: 1, padding: '10px 4px', minHeight: '44px', fontSize: '1rem',
                                                            transition: 'all 0.3s ease',
                                                            ...(emp.status === 'PRESENT'
                                                                ? { background: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.5)', color: '#34d399', fontWeight: 'bold', transform: 'scale(1.05)' }
                                                                : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.02)', color: '#919398' }
                                                            )
                                                        }}>حاضر</button>
                                                    <button
                                                        onClick={() => updateRecord(emp.id, 'status', 'ABSENT')}
                                                        className="btn-modern"
                                                        style={{
                                                            flex: 1, padding: '10px 4px', minHeight: '44px', fontSize: '1rem',
                                                            transition: 'all 0.3s ease',
                                                            ...(emp.status === 'ABSENT'
                                                                ? { background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.5)', color: '#f87171', fontWeight: 'bold', transform: 'scale(1.05)' }
                                                                : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.02)', color: '#919398' }
                                                            )
                                                        }}>غائب</button>
                                                    <select
                                                        className="input-glass"
                                                        style={{ width: '54px', padding: '0', textAlign: 'center', appearance: 'none', fontSize: '1.4rem', minHeight: '44px', cursor: 'pointer', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                        value={emp.status}
                                                        onChange={e => updateRecord(emp.id, 'status', e.target.value)}
                                                        title="حالات أخرى (إجازة، تأخير، الخ..)">
                                                        <option value="PRESENT">✅</option>
                                                        <option value="ABSENT">❌</option>
                                                        <option value="LATE">⏱️</option>
                                                        <option value="LEAVE">🏖️</option>
                                                        <option value="LEAVE_SICK">عِ</option>
                                                        <option value="LEAVE_UNPAID">⛔</option>
                                                        <option value="OTHER">📌</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="text-center" data-label="الحضور">
                                                {(emp.status === 'PRESENT' || emp.status === 'LATE') ? (
                                                    <input
                                                        type="time"
                                                        className="input-glass w-full text-center text-white"
                                                        value={emp.checkIn ? new Date(new Date(emp.checkIn).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) : ''}
                                                        onChange={e => {
                                                            const d = new Date(dateStr);
                                                            const [h, m] = e.target.value.split(':');
                                                            d.setHours(parseInt(h), parseInt(m));
                                                            updateRecord(emp.id, 'checkIn', d.toISOString());
                                                        }}
                                                        style={{ minHeight: '48px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                                        aria-label={`وقت حضور ${emp.name}`}
                                                    />
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            <td className="text-center" data-label="الانصراف">
                                                {(emp.status === 'PRESENT' || emp.status === 'LATE') ? (
                                                    <div className="flex gap-2 w-full">
                                                        <input
                                                            type="time"
                                                            className="input-glass flex-1 text-center text-white"
                                                            value={emp.checkOut ? new Date(new Date(emp.checkOut).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) : ''}
                                                            onChange={e => {
                                                                if (!e.target.value) { updateRecord(emp.id, 'checkOut', null); return; }
                                                                const d = new Date(dateStr);
                                                                const [h, m] = e.target.value.split(':');
                                                                d.setHours(parseInt(h), parseInt(m));
                                                                updateRecord(emp.id, 'checkOut', d.toISOString());
                                                            }}
                                                            style={{ minHeight: '48px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                                            title="وقت الانصراف"
                                                            aria-label={`وقت انصراف ${emp.name}`}
                                                        />
                                                        {!emp.checkOut && (
                                                            <button
                                                                onClick={() => updateRecord(emp.id, 'checkOut', new Date().toISOString())}
                                                                className="btn-modern"
                                                                style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 10px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                                                            >الآن</button>
                                                        )}
                                                    </div>
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            <td className="text-center" data-label="ساعات">
                                                {(emp.status === 'PRESENT' || emp.status === 'LATE') ? (
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="input-glass text-center font-bold text-primary"
                                                        value={emp.hoursWorked || ''}
                                                        onChange={e => updateRecord(emp.id, 'hoursWorked', e.target.value)}
                                                        style={{ width: '90px', minHeight: '48px', fontSize: '1.4rem' }}
                                                        title="ساعات العمل"
                                                        aria-label={`ساعات عمل ${emp.name}`}
                                                    />
                                                ) : <span className="text-muted">-</span>}
                                            </td>
                                            <td className="hide-on-tablet" data-label="ملاحظات">
                                                <input
                                                    type="text"
                                                    className="input-glass w-full"
                                                    placeholder="ملاحظات..."
                                                    value={emp.note || ''}
                                                    onChange={e => updateRecord(emp.id, 'note', e.target.value)}
                                                    style={{ minHeight: '42px' }}
                                                    title="ملاحظات"
                                                    aria-label={`ملاحظات ${emp.name}`}
                                                />
                                            </td>
                                            <td data-label="تقارير" className="text-center">
                                                <div className="mobile-card-actions justify-center">
                                                    <button onClick={() => { setReportModal(emp); setReportData(null); }} className="btn-modern bg-blue-500/10 text-blue-400 border border-blue-500/30 p-2 rounded-xl hover:bg-blue-500/20 w-10 h-10 flex-center" title="التقرير الشهري">📊</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* --- Pagination Controls --- */}
                    {!loading && filteredRecords.length > 0 && (
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
                                    <option style={{ color: '#000' }} value={100}>100</option>
                                    <option style={{ color: '#000' }} value="ALL">الكل</option>
                                </select>
                            </div>

                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flex: '1 1 auto', maxWidth: '350px' }}>
                                    <button disabled={validCurrentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary" style={{ opacity: validCurrentPage === 1 ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>&rarr; السابق</button>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', background: 'rgba(227,94,53,0.1)', color: 'var(--primary-color)', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr', whiteSpace: 'nowrap', border: '1px solid rgba(227,94,53,0.2)' }}>
                                        {validCurrentPage} / {totalPages}
                                    </div>
                                    <button disabled={validCurrentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary" style={{ opacity: validCurrentPage === totalPages ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>التالي &larr;</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Monthly Report Modal --- */}
            {reportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>📊 تقرير حضور: {reportModal.name}</h3>
                            <button onClick={() => setReportModal(null)} className="btn-danger" style={{ width: '40px', height: '40px' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <label className="field-label" htmlFor="rep_start">من تاريخ</label>
                                <input id="rep_start" type="date" className="input-glass" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="field-label" htmlFor="rep_end">إلى تاريخ</label>
                                <input id="rep_end" type="date" className="input-glass" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                                <button className="btn-primary" onClick={() => fetchMonthlyReport(reportModal.id)} disabled={fetchingReport} style={{ height: '45px', flex: 1 }}>
                                    {fetchingReport ? '⏳ جاري...' : '🔍 عرض التقرير'}
                                </button>
                                <PrintReportBtn label="🖨️ طباعة التقرير" className="btn-modern btn-secondary" style={{ padding: '6px 15px', height: '45px', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        {reportData ? (
                            <div className="animate-fade-in">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#34d399' }}>أيام الحضور</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportData.attendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length}</div>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '15px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>أيام الغياب</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportData.attendance.filter((a: any) => a.status === 'ABSENT').length}</div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #444', borderRadius: '15px', color: '#777' }}>
                                حدد الفترة واضغط "عرض التقرير"
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}
