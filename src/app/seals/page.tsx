'use client';
import React, { useEffect, useState, useRef } from 'react';

type Seal = {
    id: string;
    name: string;
    type: string;
    fileUrl?: string;
    notes?: string;
    createdAt: string;
};

const SEAL_TYPES = [
    { value: 'official', label: '🔏 ختم رسمي', color: '#E35E35' },
    { value: 'commercial', label: '📋 ختم تجاري', color: '#29b6f6' },
    { value: 'personal', label: '👤 توقيع شخصي', color: '#66bb6a' },
    { value: 'authority', label: '🏛️ ختم جهة حكومية', color: '#ab47bc' },
    { value: 'digital', label: '💻 توقيع رقمي', color: '#ffa726' },
    { value: 'other', label: '📌 أخرى', color: '#8d6e63' },
];

const KEY = 'erp_seals';
const load = (): Seal[] => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch { return []; } };
const saveAll = (s: Seal[]) => localStorage.setItem(KEY, JSON.stringify(s));

export default function SealsPage() {
    const [seals, setSeals] = useState<Seal[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [viewSeal, setViewSeal] = useState<Seal | null>(null);
    const [form, setForm] = useState({ name: '', type: 'official', notes: '', fileUrl: '' });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const fileRef = useRef<HTMLInputElement>(null);
    const footerFileRef = useRef<HTMLInputElement>(null);

    // Footer Seal Settings
    const [footerSealImage, setFooterSealImage] = useState('');
    const [footerSealAlign, setFooterSealAlign] = useState('center');
    const [savingFooter, setSavingFooter] = useState(false);

    useEffect(() => {
        setSeals(load());
        fetch('/api/settings').then(r => r.json()).then(data => {
            if (data.footerSealImage) setFooterSealImage(data.footerSealImage);
            if (data.footerSealAlign) setFooterSealAlign(data.footerSealAlign);
        }).catch(() => { });
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setForm(f => ({ ...f, fileUrl: ev.target?.result as string }));
        reader.readAsDataURL(file);
    };

    const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setFooterSealImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const saveFooterSettings = async () => {
        setSavingFooter(true);
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ footerSealImage, footerSealAlign })
            });
            alert('✅ تم حفظ إعدادات الختم بنجاح');
        } catch (e) {
            alert('❌ حدث خطأ أثناء الحفظ');
        }
        setSavingFooter(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return alert('يرجى إدخال اسم السيم / الختم');
        const newSeal: Seal = {
            id: Date.now().toString(),
            name: form.name,
            type: form.type,
            fileUrl: form.fileUrl || undefined,
            notes: form.notes || undefined,
            createdAt: new Date().toISOString(),
        };
        const updated = [newSeal, ...seals];
        setSeals(updated);
        saveAll(updated);
        setForm({ name: '', type: 'official', notes: '', fileUrl: '' });
        setShowAdd(false);
    };

    const handleDelete = (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السيم / الختم؟')) return;
        const updated = seals.filter(s => s.id !== id);
        setSeals(updated);
        saveAll(updated);
    };

    const filtered = seals.filter(s => {
        const matchSearch = !search || s.name.includes(search) || (s.notes || '').includes(search);
        const matchType = typeFilter === 'ALL' || s.type === typeFilter;
        return matchSearch && matchType;
    });

    const getTypeInfo = (typeVal: string) => SEAL_TYPES.find(t => t.value === typeVal) || SEAL_TYPES[SEAL_TYPES.length - 1];

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>🔏 السيمزات والأختام</h1>
                    <p>إدارة الأختام والتوقيعات الرسمية وحفظها بشكل آمن ومنظم</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: '10px 22px' }}>
                    ➕ إضافة سيم / ختم
                </button>
            </header>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                {[
                    { label: 'إجمالي الأختام', value: seals.length, color: 'var(--primary-color)' },
                    ...SEAL_TYPES.slice(0, 3).map(t => ({
                        label: t.label,
                        value: seals.filter(s => s.type === t.value).length,
                        color: t.color
                    }))
                ].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.78rem', color: '#919398', marginTop: '4px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" className="input-glass" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث في الأختام.." style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }} />
                <button onClick={() => setTypeFilter('ALL')} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: typeFilter === 'ALL' ? 'var(--primary-color)' : 'transparent', color: typeFilter === 'ALL' ? '#fff' : '#919398', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>الكل ({seals.length})</button>
                {SEAL_TYPES.map(t => (
                    <button key={t.value} onClick={() => setTypeFilter(t.value)}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${t.color}55`, background: typeFilter === t.value ? `${t.color}22` : 'transparent', color: typeFilter === t.value ? t.color : '#919398', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔏</div>
                    <p>لا توجد أختام أو سيمزات محفوظة بعد</p>
                    <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ marginTop: '1rem' }}>➕ إضافة أول ختم</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1rem' }}>
                    {filtered.map(seal => {
                        const typeInfo = getTypeInfo(seal.type);
                        return (
                            <div key={seal.id} className="glass-panel hover-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', transition: 'all 0.3s' }}>
                                {/* Type badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: `${typeInfo.color}22`, color: typeInfo.color, border: `1px solid ${typeInfo.color}33` }}>
                                        {typeInfo.label}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#666' }}>{new Date(seal.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>

                                {/* Image/Icon Preview */}
                                <div style={{ width: '100%', height: '120px', borderRadius: '12px', background: seal.fileUrl ? 'transparent' : `${typeInfo.color}11`, border: `1px dashed ${typeInfo.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {seal.fileUrl ? (
                                        <img src={seal.fileUrl} alt={seal.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                                    ) : (
                                        <span style={{ fontSize: '3rem' }}>{typeInfo.label.split(' ')[0]}</span>
                                    )}
                                </div>

                                {/* Name */}
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>{seal.name}</h3>
                                    {seal.notes && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#919398', lineHeight: 1.4 }}>{seal.notes}</p>}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setViewSeal(seal)} style={{ flex: 1, padding: '8px', background: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}44`, color: typeInfo.color, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem' }}>
                                        👁 عرض
                                    </button>
                                    <button onClick={() => handleDelete(seal.id)} style={{ padding: '8px 12px', background: 'rgba(227,94,53,0.1)', border: '1px solid rgba(227,94,53,0.3)', color: '#E35E35', borderRadius: '8px', cursor: 'pointer' }}>
                                        🗑
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ ADD MODAL ═══ */}
            {showAdd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowAdd(false)}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>🔏 إضافة سيم / ختم جديد</h3>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Name */}
                            <div>
                                <label htmlFor="seal_name">اسم السيم / الختم *</label>
                                <input id="seal_name" type="text" className="input-glass" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="ختم الشركة الرسمي، توقيع مدير العمليات.." title="اسم السيم أو الختم" />
                            </div>

                            {/* Type */}
                            <div>
                                <label>نوع السيم / الختم *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '8px' }}>
                                    {SEAL_TYPES.map(t => (
                                        <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                                            style={{ padding: '10px 8px', borderRadius: '10px', border: `2px solid ${form.type === t.value ? t.color : 'rgba(255,255,255,0.1)'}`, background: form.type === t.value ? `${t.color}22` : 'rgba(255,255,255,0.02)', color: form.type === t.value ? t.color : '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', textAlign: 'center', transition: 'all 0.2s' }}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label htmlFor="seal_file">رفع صورة السيم / الختم (اختياري)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                                    <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }} title="اختيار ملف صورة">
                                        📁 اختر صورة
                                    </button>
                                    <input id="seal_file" ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    {form.fileUrl && <span style={{ fontSize: '0.82rem', color: '#66bb6a' }}>✅ تم رفع الملف</span>}
                                </div>
                                {form.fileUrl && (
                                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                                        <img src={form.fileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '8px' }} />
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="seal_notes">ملاحظات إضافية (اختياري)</label>
                                <textarea id="seal_notes" className="input-glass" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات عن الاستخدام، تاريخ الإصدار، الجهة المُصدِرة.." rows={3} style={{ resize: 'vertical' }} title="ملاحظات إضافية" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#ccc', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 28px' }}>💾 حفظ السيم</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ VIEW MODAL ═══ */}
            {viewSeal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setViewSeal(null)}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, color: getTypeInfo(viewSeal.type).color }}>{viewSeal.name}</h3>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>{getTypeInfo(viewSeal.type).label}</span>
                            </div>
                            <button onClick={() => setViewSeal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        {viewSeal.fileUrl ? (
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <img src={viewSeal.fileUrl} alt={viewSeal.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '4rem' }}>
                                {getTypeInfo(viewSeal.type).label.split(' ')[0]}
                            </div>
                        )}
                        {viewSeal.notes && (
                            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>الملاحظات:</div>
                                <div style={{ color: '#ccc', lineHeight: 1.6 }}>{viewSeal.notes}</div>
                            </div>
                        )}
                        <div style={{ fontSize: '0.78rem', color: '#666', textAlign: 'left' }}>تاريخ الإضافة: {new Date(viewSeal.createdAt).toLocaleDateString('ar-EG')}</div>
                    </div>
                </div>
            )}

            {/* ════ FOOTER SEAL SETTINGS ════ */}
            <div className="glass-panel" style={{ marginTop: '2rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#f59e0b', margin: '0 0 5px 0' }}>📄 ختم أسفل التقارير (Footer Seal)</h2>
                <p style={{ color: '#919398', marginBottom: '1.5rem', fontSize: '0.9rem' }}>أضف صورة ليتم طباعتها تلقائياً أسفل الفواتير والتقارير مع تحديد مكان المحاذاة.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }} className="sales-search-grid">
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: '#ccc', marginBottom: '8px', display: 'block' }}>رافع الصورة (يفضل PNG شفاف)</label>
                            <input ref={footerFileRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleFooterImageUpload} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => footerFileRef.current?.click()} className="btn-secondary" style={{ flex: 1 }}>📁 اختيار صورة للختم</button>
                                {footerSealImage && <button onClick={() => setFooterSealImage('')} className="btn-danger">🗑 إزالة</button>}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: '#ccc', marginBottom: '8px', display: 'block' }}>موضع المحاذاة</label>
                            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '10px' }}>
                                <button onClick={() => setFooterSealAlign('right')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: footerSealAlign === 'right' ? 'var(--primary-color)' : 'transparent', color: footerSealAlign === 'right' ? '#fff' : '#aaa', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>➡️ اليمين</button>
                                <button onClick={() => setFooterSealAlign('center')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: footerSealAlign === 'center' ? 'var(--primary-color)' : 'transparent', color: footerSealAlign === 'center' ? '#fff' : '#aaa', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>⏺️ المنتصف</button>
                                <button onClick={() => setFooterSealAlign('left')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: footerSealAlign === 'left' ? 'var(--primary-color)' : 'transparent', color: footerSealAlign === 'left' ? '#fff' : '#aaa', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>⬅️ اليسار</button>
                            </div>
                        </div>

                        <button onClick={saveFooterSettings} disabled={savingFooter} className="btn-modern btn-primary" style={{ width: '100%', padding: '0 1rem' }}>
                            {savingFooter ? '⏳ جاري الحفظ...' : '💾 حفظ إعدادات الختم'}
                        </button>
                    </div>

                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', color: '#000', minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#111' }}>نموذج أسفل التقرير</h4>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>إجمالي الفاتورة المتبقي: 0 ج.م</p>
                            <p style={{ margin: '5px 0 0 0', color: '#444', fontSize: '0.8rem' }}>نشكركم على ثقتكم فينا.</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: footerSealAlign === 'right' ? 'flex-start' : footerSealAlign === 'left' ? 'flex-end' : 'center', minHeight: '80px' }}>
                            {footerSealImage ? (
                                <img src={footerSealImage} alt="Footer Seal" style={{ maxWidth: '150px', maxHeight: '80px', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ width: '150px', height: '80px', border: '2px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>بدون ختم</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
