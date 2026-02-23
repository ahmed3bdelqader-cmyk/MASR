'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AttendancePage() {
    const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

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

    useEffect(() => {
        fetchData();
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

    const printMonthlyReport = () => {
        if (!reportData) return;
        const win = window.open('', '_blank');
        if (!win) return;

        const { employee, attendance } = reportData;
        const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
        const t = JSON.parse(localStorage.getItem('erp_print_template') || '{}');
        const accentColor = t.accentColor || s.primaryColor || '#f59e0b';

        const stats = {
            present: attendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length,
            absent: attendance.filter((a: any) => a.status === 'ABSENT').length,
            leaves: attendance.filter((a: any) => a.status.startsWith('LEAVE')).length,
            totalHours: attendance.reduce((s: number, a: any) => s + (a.hoursWorked || 0), 0)
        };

        const rows = attendance.map((a: any) => {
            const statusMap: any = { PRESENT: 'حاضر', ABSENT: 'غائب', LATE: 'متأخر', LEAVE: 'إجازة', LEAVE_SICK: 'مرضي', LEAVE_UNPAID: 'بدون أجر' };
            return `
                <tr>
                    <td style="text-align:center">${a.dateStr}</td>
                    <td style="text-align:center">${statusMap[a.status] || a.status}</td>
                    <td style="text-align:center">${a.checkIn ? new Date(a.checkIn).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style="text-align:center">${a.checkOut ? new Date(a.checkOut).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style="text-align:center">${a.hoursWorked || '-'}</td>
                    <td>${a.note || ''}</td>
                </tr>
            `;
        }).join('');

        win.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير حضور وانصراف - ${employee.name}</title>
                <style>
                    body { font-family: Tahoma, sans-serif; padding: 30px; font-size: 0.9rem; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${accentColor}; padding-bottom: 15px; margin-bottom: 20px; }
                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .stat-card { border: 1px solid #ddd; padding: 10px; text-align: center; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-block: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background: #f5f5f5; color: #333; }
                </style>
            </head>
            <body onload="window.print()">
                <div class="header">
                    <div>
                        <h2 style="color:${accentColor};margin:0">${s.appName || 'نظام إدارة المصنع'}</h2>
                        <h3 style="margin:5px 0">تقرير الحضور والانصراف</h3>
                        <p>من: ${reportStartDate} إلى: ${reportEndDate}</p>
                    </div>
                    <div style="text-align:left">
                        <p><strong>الموظف:</strong> ${employee.name}</p>
                        <p><strong>كود:</strong> ${employee.employeeId}</p>
                        <p><strong>الإدارة:</strong> ${employee.department || '-'}</p>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card"><div>أيام الحضور</div><strong>${stats.present}</strong></div>
                    <div class="stat-card"><div>أيام الغياب</div><strong>${stats.absent}</strong></div>
                    <div class="stat-card"><div>أيام الإجازات</div><strong>${stats.leaves}</strong></div>
                    <div class="stat-card"><div>إجمالي الساعات</div><strong>${stats.totalHours.toFixed(1)} س</strong></div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>الحضور</th>
                            <th>الانصراف</th>
                            <th>ساعات العمل</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#0f1115', color: '#e2e8f0', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#f59e0b' }}>⏱️ جدول الحضور والانصراف</h1>
                    <p style={{ color: '#919398', margin: '5px 0' }}>تسجيل يوميات وحضور الموظفين لليوم المحدد</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/employees">
                        <button className="btn-secondary" style={{ padding: '8px 16px' }}>
                            العودة لشؤون العاملين
                        </button>
                    </Link>
                    <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '8px 20px' }}>
                        {saving ? 'جاري الحفظ...' : '💾 حفظ يومية الحضور'}
                    </button>
                </div>
            </div>

            <div style={{ background: '#1a1c22', padding: '15px 25px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid #2d2f36' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#919398', marginBottom: '5px' }}>تاريخ اليومية</label>
                    <input
                        type="date"
                        className="input-glass"
                        value={dateStr}
                        onChange={e => setDateStr(e.target.value)}
                        style={{ maxWidth: '250px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => markAll('PRESENT')} className="btn-secondary" style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>✅ تحضير الكل حاضراً</button>
                    <button onClick={() => markAll('ABSENT')} className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>❌ تغيب الكل</button>
                </div>
            </div>

            {msg && <div style={{ padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', background: msg.includes('✅') ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: msg.includes('✅') ? '#34d399' : '#ef4444', textAlign: 'center', border: `1px solid ${msg.includes('✅') ? '#34d399' : '#ef4444'}` }}>{msg}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>جاري تحميل كشوف الحضور...</div>
            ) : (
                <div className="table-container-glass">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'right', borderBottom: '1px solid #2d2f36' }}>
                                <th style={{ padding: '15px' }}>الموظف</th>
                                <th>الإدارة / القسم</th>
                                <th>حالة الحضور</th>
                                <th>الحضور</th>
                                <th>الانصراف</th>
                                <th>عدد الساعات</th>
                                <th>ملاحظات</th>
                                <th>تقارير</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(emp => (
                                <tr key={emp.id} style={{ borderBottom: '1px solid #2d2f36', background: emp.status === 'ABSENT' ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#919398' }}>{emp.title} | #{emp.employeeId}</div>
                                    </td>
                                    <td>{emp.department || '-'}</td>
                                    <td>
                                        <select
                                            className="input-glass"
                                            value={emp.status}
                                            onChange={e => updateRecord(emp.id, 'status', e.target.value)}
                                            style={{
                                                color: emp.status === 'PRESENT' ? '#34d399' : emp.status === 'ABSENT' ? '#ef4444' : emp.status === 'LATE' ? '#f59e0b' : emp.status.startsWith('LEAVE') ? '#60a5fa' : '#919398',
                                                borderColor: emp.status === 'PRESENT' ? '#34d399' : emp.status === 'ABSENT' ? '#ef4444' : emp.status === 'LATE' ? '#f59e0b' : emp.status.startsWith('LEAVE') ? '#60a5fa' : '#2d2f36'
                                            }}
                                        >
                                            <option value="PENDING" style={{ color: '#000' }}>-- لم يُسجل --</option>
                                            <option value="PRESENT" style={{ color: '#000' }}>✅ حاضر</option>
                                            <option value="ABSENT" style={{ color: '#000' }}>❌ غائب</option>
                                            <option value="LATE" style={{ color: '#000' }}>⏱️ متأخر</option>
                                            <option value="LEAVE" style={{ color: '#000' }}>🏖️ إجازة اعتيادية</option>
                                            <option value="LEAVE_SICK" style={{ color: '#000' }}>عِ إجازة مرضية</option>
                                            <option value="LEAVE_UNPAID" style={{ color: '#000' }}>⛔ إجازة بدون أجر</option>
                                            <option value="OTHER" style={{ color: '#000' }}>📌 أخرى (اكتب ملاحظة)</option>
                                        </select>
                                    </td>
                                    <td>
                                        {(emp.status === 'PRESENT' || emp.status === 'LATE') ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                <input
                                                    type="time"
                                                    className="input-glass"
                                                    value={emp.checkIn ? new Date(new Date(emp.checkIn).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) : ''}
                                                    onChange={e => {
                                                        const d = new Date(dateStr);
                                                        const [h, m] = e.target.value.split(':');
                                                        d.setHours(parseInt(h), parseInt(m));
                                                        updateRecord(emp.id, 'checkIn', d.toISOString());
                                                    }}
                                                />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {(emp.status === 'PRESENT' || emp.status === 'LATE') ? (
                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                <input
                                                    type="time"
                                                    className="input-glass"
                                                    value={emp.checkOut ? new Date(new Date(emp.checkOut).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(11, 16) : ''}
                                                    onChange={e => {
                                                        if (!e.target.value) { updateRecord(emp.id, 'checkOut', null); return; }
                                                        const d = new Date(dateStr);
                                                        const [h, m] = e.target.value.split(':');
                                                        d.setHours(parseInt(h), parseInt(m));
                                                        updateRecord(emp.id, 'checkOut', d.toISOString());
                                                    }}
                                                />
                                                {!emp.checkOut && (
                                                    <button onClick={() => updateRecord(emp.id, 'checkOut', new Date().toISOString())} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer', fontSize: '0.7rem' }}>الآن</button>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {(emp.status === 'PRESENT' || emp.status === 'LATE') ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    title="ساعات العمل"
                                                    placeholder="0.0"
                                                    className="input-glass"
                                                    value={emp.hoursWorked || ''}
                                                    onChange={e => updateRecord(emp.id, 'hoursWorked', e.target.value)}
                                                    style={{ width: '70px', textAlign: 'center', color: '#f59e0b', fontWeight: 'bold' }}
                                                />
                                                <span style={{ fontSize: '0.8rem', color: '#888' }}>س</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="input-glass"
                                            placeholder="ملاحظات أو سبب الغياب"
                                            value={emp.note || ''}
                                            onChange={e => updateRecord(emp.id, 'note', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => { setReportModal(emp); setReportData(null); }}
                                            className="btn-secondary btn-sm"
                                            style={{ color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.2)', background: 'rgba(41, 182, 246, 0.05)' }}
                                            title="تقرير شهري"
                                        >
                                            📊 تقرير شهري
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- Monthly Report Modal --- */}
            {reportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1c22', padding: '2rem', borderRadius: '18px', width: '100%', maxWidth: '600px', border: '1px solid #2d2f36' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#f59e0b' }}>📊 تقارير الحضور الشهرية</h3>
                            <button onClick={() => setReportModal(null)} style={{ background: 'transparent', border: 'none', color: '#ff5252', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <p style={{ color: '#919398', marginBottom: '1rem' }}>الموظف: <strong>{reportModal.name}</strong></p>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>من تاريخ</label>
                                <input type="date" className="input-glass" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>إلى تاريخ</label>
                                <input type="date" className="input-glass" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            <button className="btn-primary"
                                style={{ alignSelf: 'flex-end', minHeight: '42px' }}
                                onClick={() => fetchMonthlyReport(reportModal.id)}
                                disabled={fetchingReport}
                            >
                                {fetchingReport ? 'جاري التحميل...' : '🔍 عرض التقرير'}
                            </button>
                        </div>

                        {reportData && (
                            <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid #2d2f36' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem' }}>أيام الحضور: <span style={{ color: '#34d399', fontWeight: 'bold' }}>{reportData.attendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length}</span></div>
                                    <div style={{ fontSize: '0.9rem' }}>أيام الغياب: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{reportData.attendance.filter((a: any) => a.status === 'ABSENT').length}</span></div>
                                </div>
                                <button className="btn-primary" onClick={printMonthlyReport} style={{ width: '100%' }}>
                                    🖨️ طباعة تقرير PDF احترافي
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
