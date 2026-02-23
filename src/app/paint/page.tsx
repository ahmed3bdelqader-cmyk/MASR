'use client';
import React, { useEffect, useState } from 'react';

export default function PaintDepartmentPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ description: '', amount: 0 });

    const [clientFilter, setClientFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/paint');
            const data = await res.json();
            setExpenses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const SYM = () => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } };
    const sym = SYM();

    const handleEditClick = (exp: any) => {
        setEditMode(exp.id);
        setEditForm({ description: exp.description, amount: exp.amount });
    };

    const handleSaveEdit = async (id: string) => {
        try {
            const res = await fetch('/api/paint', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            });
            if (res.ok) {
                setEditMode(null);
                fetchExpenses();
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف حساب الدهان "${name}" نهائياً من تكلفة التصنيع؟`)) return;
        try {
            const res = await fetch('/api/paint', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                fetchExpenses();
            }
        } catch (err) { console.error(err); }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchClient = !clientFilter || exp.job?.invoice?.client?.name === clientFilter;
        const expMonth = new Date(exp.date).toISOString().slice(0, 7);
        const matchMonth = !monthFilter || expMonth === monthFilter;
        return matchClient && matchMonth;
    });

    const uniqueClients = Array.from(new Set(expenses.map(e => e.job?.invoice?.client?.name).filter(Boolean)));
    const uniqueMonths = Array.from(new Set(expenses.map(e => new Date(e.date).toISOString().slice(0, 7)))).sort().reverse();

    const handlePrint = () => {
        const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
        const t = JSON.parse(localStorage.getItem('erp_print_template') || '{}');
        const logo = t.printLogoCustom || s.appLogo || '';
        const accentColor = t.accentColor || s.primaryColor || '#26c6da';
        const coName = t.companyName || s.appName || 'Stand Masr';
        const shapeMap: Record<string, string> = { circle: '50%', square: '0', rect: '6px', rounded: '10px' };
        const logoRadius = shapeMap[s.logoShape || 'rounded'] || '10px';
        const logoSizePx = t.printLogoSize || '70';

        const logoImg = logo && t.showLogo !== false
            ? `<img src="${logo}" style="width:${logoSizePx}px;height:${logoSizePx}px;object-fit:contain;border-radius:${logoRadius};display:block" />`
            : '';

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
                    <h2 style="margin:0 0 5px;color:${accentColor};font-size:1.15rem">تقرير مصروفات دهان مجمع</h2>
                    <p style="margin:2px 0;font-size:0.83rem"><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
            </div>
        `;

        const trs = filteredExpenses.map((exp, idx) => {
            let desc = exp.description;
            let qty = 1;
            let up = exp.amount;
            const match = desc.match(/^(.*?)\s*×\s*([\d.]+)\s*قطعة$/);
            if (match) {
                desc = match[1];
                qty = parseFloat(match[2]);
                up = exp.amount / qty;
            } else if (desc.startsWith('دهان:')) {
                desc = desc.substring(5).trim();
            }

            return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td>${desc}</td>
                    <td style="text-align:center;">${exp.job?.invoice?.client?.name || '-'} <br><small style="color:#777">${exp.job?.invoice?.invoiceNo || ''}</small></td>
                    <td style="text-align:center;">${qty}</td>
                    <td style="text-align:center;">${up.toFixed(0)}</td>
                    <td style="text-align:center;font-weight:bold;color:${accentColor}">${exp.amount.toFixed(0)}</td>
                </tr>
            `;
        }).join('');

        const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير قسم الدهان</title>
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; margin: 30px; font-size: 0.95rem; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9rem; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background-color: ${accentColor}; color: #fff; text-align: center; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .total { font-weight: bold; font-size: 1.2rem; text-align: left; padding: 15px; margin-top: 15px; background: #fdfdfd; border: 2px solid ${accentColor}; border-radius: 8px; color: ${accentColor} }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body onload="window.print()">
                ${headerHTML}
                
                <table>
                    <thead>
                        <tr>
                            <th style="width:40px">#</th>
                            <th>البيان / توصيف الدهان</th>
                            <th>العميل والفاتورة</th>
                            <th>العدد</th>
                            <th>سعر القطعة</th>
                            <th>الإجمالي (${sym})</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trs}
                    </tbody>
                </table>
                <div class="total">إجمالي مصاريف الدهان بالتقرير: ${total.toFixed(0)} ${sym}</div>
                
                <div style="margin-top:30px;text-align:center;color:#888;font-size:0.8rem;border-top:1px solid #eee;padding-top:10px">
                    ${t.footerText || 'تم إصدار التقرير بواسطة نظام Stand Masr ERP'}
                </div>
            </body>
            </html>
        `);
        win.document.close();
    };

    const handlePrintSingle = (exp: any) => {
        const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
        const t = JSON.parse(localStorage.getItem('erp_print_template') || '{}');
        const logo = t.printLogoCustom || s.appLogo || '';
        const accentColor = t.accentColor || s.primaryColor || '#26c6da';
        const coName = t.companyName || s.appName || 'Stand Masr';
        const shapeMap: Record<string, string> = { circle: '50%', square: '0', rect: '6px', rounded: '10px' };
        const logoRadius = shapeMap[s.logoShape || 'rounded'] || '10px';
        const logoSizePx = t.printLogoSize || '70';

        const logoImg = logo && t.showLogo !== false
            ? `<img src="${logo}" style="width:${logoSizePx}px;height:${logoSizePx}px;object-fit:contain;border-radius:${logoRadius};display:block" />`
            : '';

        let desc = exp.description;
        let qty = 1;
        let up = exp.amount;
        const match = desc.match(/^(.*?)\s*×\s*([\d.]+)\s*قطعة$/);
        if (match) {
            desc = match[1];
            qty = parseFloat(match[2]);
            up = exp.amount / qty;
        } else if (desc.startsWith('دهان:')) {
            desc = desc.substring(5).trim();
        }

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html dir="rtl">
            <head>
                <title>إيصال دهان - ${exp.job?.invoice?.invoiceNo || 'عملية'}</title>
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; margin: 30px; line-height: 1.6; }
                    .wrapper { border: 2px solid ${accentColor}; padding: 25px; border-radius: 12px; max-width: 800px; margin: 0 auto; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dotted #ccc; padding-bottom: 8px; }
                    .label { color: #555; font-weight: bold; width: 140px; }
                    .val { font-size: 1.1rem; flex: 1; }
                    .total { font-size: 1.5rem; color: ${accentColor}; font-weight: bold; text-align: center; margin-top: 25px; padding: 15px; background: #fdfdfd; border: 2px dashed ${accentColor}; border-radius: 8px; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body onload="window.print()">
                <div class="wrapper">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;border-bottom:3px solid ${accentColor};padding-bottom:15px">
                        <div style="display:flex;gap:15px">
                            ${logoImg}
                            <div>
                                <h1 style="margin:0 0 3px;font-size:1.35rem;color:${accentColor}">${coName}</h1>
                                ${t.companyPhone ? `<p style="margin:2px 0;font-size:0.8rem">📞 ${t.companyPhone}</p>` : ''}
                            </div>
                        </div>
                        <div style="text-align:left">
                            <h2 style="margin:0 0 5px;color:${accentColor};font-size:1.2rem">🧾 إيصال تفاصيل دهان</h2>
                            <p style="margin:2px 0;font-size:0.85rem"><strong>تاريخ:</strong> ${new Date(exp.date).toLocaleDateString('ar-EG')}</p>
                            <p style="margin:2px 0;font-size:0.85rem"><strong>رقم الفاتورة الأصلية:</strong> ${exp.job?.invoice?.invoiceNo || '-'}</p>
                        </div>
                    </div>

                    <div class="row"><span class="label">العميل والمحل:</span> <span class="val">${exp.job?.invoice?.client?.name || '-'}</span></div>
                    <div class="row"><span class="label">أمر التصنيع:</span> <span class="val">${exp.job?.name || '-'}</span></div>
                    <div class="row" style="margin-top:25px"><span class="label">الوصف الفني:</span> <span class="val" style="font-weight:bold;color:#333">${desc}</span></div>
                    <div class="row"><span class="label">العدد (قطعة):</span> <span class="val">${qty}</span></div>
                    <div class="row"><span class="label">تكلفة القطعة:</span> <span class="val">${up.toFixed(0)} ${sym}</span></div>
                    
                    <div class="total">الإجمالي المدفوع: ${exp.amount.toFixed(0)} ${sym}</div>
                    
                    <div style="margin-top:30px;text-align:center;color:#888;font-size:0.8rem;">
                        ${t.footerText || 'تم إصدار التقرير بواسطة نظام Stand Masr ERP'}
                    </div>
                </div>
            </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1>🎨 قسم الدهان الشامل</h1>
                    <p>إدارة وتجميع كل تكاليف ومصروفات الدهان الخاصة بطلبيات التصنيع، وفلترتها وتسعيرها.</p>
                </div>
                <button onClick={handlePrint} className="btn-primary" style={{ padding: '10px 20px', background: '#26c6da', border: 'none', color: '#000', fontWeight: 'bold' }}>
                    🖨️ طباعة تقرير قسم الدهان / حفظ كـ PDF
                </button>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <label htmlFor="f_month" className="sr-only">تصفية حسب الشهر</label>
                    <select id="f_month" className="input-glass" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} title="اختر الشهر">
                        <option value="">كل الشهور</option>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <label htmlFor="f_client" className="sr-only">تصفية حسب العميل</label>
                    <select id="f_client" className="input-glass" value={clientFilter} onChange={e => setClientFilter(e.target.value)} title="اختر العميل">
                        <option value="">كل العملاء</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {loading ? <p>جاري تحميل عمليات الدهان...</p> : expenses.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>لا توجد مصاريف دهان معتمدة في أوامر التصنيع حتى الآن.</p>
                ) : filteredExpenses.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>لا توجد نتائج مطابقة للفلتر المحدد.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center' }}>التاريخ</th>
                                    <th>الوصف والتفاصيل</th>
                                    <th style={{ textAlign: 'center' }}>التكلفة</th>
                                    <th>تابع لأمر تصنيع</th>
                                    <th>رقم الفاتورة</th>
                                    <th>اسم العميل</th>
                                    <th style={{ textAlign: 'center' }}>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id}>
                                        <td style={{ textAlign: 'center', color: '#919398', fontSize: '0.85rem' }}>
                                            {new Date(exp.date).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td>
                                            {editMode === exp.id ? (
                                                <input type="text" className="input-glass" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ width: '100%', minWidth: '300px' }} />
                                            ) : (
                                                <div style={{ fontWeight: 600, color: '#26c6da' }}>{exp.description}</div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#66bb6a' }}>
                                            {editMode === exp.id ? (
                                                <input type="number" step="any" className="input-glass" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} style={{ width: '100px', textAlign: 'center' }} />
                                            ) : (
                                                <>{exp.amount.toFixed(0)} {sym}</>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{exp.job?.name || <span style={{ color: '#666' }}>-</span>}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {exp.job?.invoice ? (
                                                <span style={{ background: 'rgba(41,182,246,0.1)', padding: '3px 8px', borderRadius: '4px', color: '#29b6f6' }}>{exp.job.invoice.invoiceNo}</span>
                                            ) : '-'}
                                        </td>
                                        <td style={{ fontSize: '0.9rem', color: '#bbb' }}>{exp.job?.invoice?.client?.name || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {editMode === exp.id ? (
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleSaveEdit(exp.id)} style={{ padding: '6px 12px', background: 'rgba(102,187,106,0.2)', border: '1px solid #66bb6a', color: '#66bb6a', borderRadius: '6px', cursor: 'pointer' }}>حفظ</button>
                                                    <button onClick={() => setEditMode(null)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleEditClick(exp)} style={{ padding: '6px 12px', background: 'rgba(255,167,38,0.15)', border: '1px solid #ffa726', color: '#ffa726', borderRadius: '6px', cursor: 'pointer' }}>✏️</button>
                                                    <button onClick={() => handleDelete(exp.id, exp.description)} style={{ padding: '6px 12px', background: 'rgba(227,94,53,0.15)', border: '1px solid #E35E35', color: '#E35E35', borderRadius: '6px', cursor: 'pointer' }}>🗑</button>
                                                    <button onClick={() => handlePrintSingle(exp)} style={{ padding: '6px 12px', background: 'rgba(38,198,218,0.15)', border: '1px solid #26c6da', color: '#26c6da', borderRadius: '6px', cursor: 'pointer' }} title="تصدير كـ PDF للإيصال">🖨️ PDF</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ background: 'rgba(38,198,218,0.1)' }}>
                                    <td colSpan={2} style={{ textAlign: 'left', fontWeight: 'bold', color: '#26c6da', fontSize: '1.1rem' }}>الإجمالي الكلي لمصاريف الدهان:</td>
                                    <td colSpan={5} style={{ textAlign: 'left', fontWeight: 'bold', color: '#fff', fontSize: '1.2rem' }}>
                                        {filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(0)} {sym}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
