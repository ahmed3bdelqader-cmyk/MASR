'use client';
import React, { useEffect, useState, useRef } from 'react';

const KEY = 'erp_settings';
const load = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } };
const save = (s: any) => localStorage.setItem(KEY, JSON.stringify(s));

const CURRENCIES = [
    { code: 'EGP', label: 'جنيه مصري (ج.م)', symbol: 'ج.م' },
    { code: 'USD', label: 'دولار أمريكي ($)', symbol: '$' },
    { code: 'SAR', label: 'ريال سعودي (ر.س)', symbol: 'ر.س' },
    { code: 'AED', label: 'درهم إماراتي (د.إ)', symbol: 'د.إ' },
    { code: 'EUR', label: 'يورو (€)', symbol: '€' },
    { code: 'GBP', label: 'جنيه إسترليني (£)', symbol: '£' },
];

const COLOR_PRESETS = [
    // --- DARK THEMES ---
    { label: 'Ember (Dark)', primary: '#E35E35', bg: '#0e0f11', sidebar: 'rgba(20,22,28,0.95)', card: 'rgba(30,32,38,0.7)', text: '#ffffff', muted: '#919398', btn: '#ffffff' },
    { label: 'Ocean (Dark)', primary: '#0088ff', bg: '#050a14', sidebar: 'rgba(10,20,40,0.98)', card: 'rgba(20,35,60,0.8)', text: '#ffffff', muted: '#a0b0d0', btn: '#ffffff' },
    { label: 'Forest (Dark)', primary: '#00c853', bg: '#051005', sidebar: 'rgba(10,30,15,0.98)', card: 'rgba(20,50,30,0.8)', text: '#ffffff', muted: '#a0d0a0', btn: '#ffffff' },
    { label: 'Royal (Dark)', primary: '#BF5AF2', bg: '#0d0714', sidebar: 'rgba(20,10,35,0.98)', card: 'rgba(40,20,60,0.8)', text: '#ffffff', muted: '#c0a0d0', btn: '#ffffff' },
    { label: 'Neon (Dark)', primary: '#00f2ff', bg: '#020a10', sidebar: 'rgba(5,15,25,0.98)', card: 'rgba(10,30,45,0.7)', text: '#ffffff', muted: '#80d0d0', btn: '#000000' },
    { label: 'Midnight (Dark)', primary: '#5ac8fa', bg: '#000000', sidebar: '#0a0a0a', card: '#111111', text: '#ffffff', muted: '#666666', btn: '#ffffff' },

    // --- LIGHT THEMES ---
    { label: 'Snow (Light)', primary: '#E35E35', bg: '#f8f9fa', sidebar: '#ffffff', card: '#ffffff', text: '#1a1c24', muted: '#6c757d', btn: '#ffffff' },
    { label: 'Sky (Light)', primary: '#007AFF', bg: '#f0f4f8', sidebar: '#ffffff', card: '#ffffff', text: '#1c1c1e', muted: '#5c6c7c', btn: '#ffffff' },
    { label: 'Clean (Light)', primary: '#8E8E93', bg: '#ffffff', sidebar: '#f5f5f7', card: '#ffffff', text: '#000000', muted: '#555555', btn: '#ffffff' },

    // --- SPECIAL THEMES ---
    { label: 'Cyber Industrial', primary: '#FF7D00', bg: '#0b0c10', sidebar: 'rgba(15, 17, 26, 0.98)', card: 'rgba(30, 31, 38, 0.4)', text: '#ffffff', muted: '#888888', btn: '#ffffff' },
];

const FONTS = [
    { label: 'Cairo (افتراضي)', value: "'Cairo', sans-serif" },
    { label: 'Tajawal (ناعم)', value: "'Tajawal', sans-serif" },
    { label: 'Almarai (عصري)', value: "'Almarai', sans-serif" },
    { label: 'Outfit (فاخر)', value: "'Outfit', sans-serif" },
    { label: 'Inter (تقني)', value: "'Inter', sans-serif" },
];

const THEMES = COLOR_PRESETS.map((p, i) => ({ id: i + 1, name: p.label, colors: p }));

function DashboardPreview({ settings }: { settings: any }) {
    const pc = settings.primaryColor;
    return (
        <div style={{
            background: settings.bgColor,
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '16/10',
            display: 'flex',
            flexDirection: 'column',
            direction: 'rtl',
            fontFamily: settings.fontFamily,
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📊</div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🔔</div>
                </div>
                <div style={{ display: 'flex', gap: '15px', fontSize: '10px', color: '#888' }}>
                    <span>المبيعات</span>
                    <span>المخزون</span>
                    <span>الموظفين</span>
                    <span style={{ color: pc, fontWeight: 'bold' }}>الرئيسية</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, gap: '15px', zIndex: 2 }}>
                {/* Right Sidebar Mock */}
                <div style={{ width: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '15px 0' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: pc + '44', border: `1px solid ${pc}` }}></div>
                    <div style={{ width: '20px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ width: '25px', height: '25px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div style={{ width: '25px', height: '25px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}></div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Header Heading */}
                    <div style={{ marginBottom: '5px' }}>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>نظام تخطيط موارد المؤسسات</h4>
                        <p style={{ margin: 0, color: pc, fontSize: '10px', fontWeight: 'bold' }}>لمصنع الأثاث المعدني</p>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ background: settings.cardBg, borderRadius: '15px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '9px', color: '#888', marginBottom: '8px' }}>حالة الإنتاج</div>
                            <div style={{ height: '40px', background: `linear-gradient(90deg, transparent, ${pc}22, transparent)`, position: 'relative' }}>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: pc }}></div>
                            </div>
                        </div>
                        <div style={{ background: settings.cardBg, borderRadius: '15px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '9px', color: '#888', marginBottom: '8px' }}>المخزون الحالي</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: `3px solid ${pc}`, borderRightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>85%</div>
                                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>2,450 كجم</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Feature */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Background Lines */}
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: `repeating-linear-gradient(45deg, transparent, transparent 20px, ${pc} 20px, ${pc} 21px), repeating-linear-gradient(-45deg, transparent, transparent 20px, ${pc} 20px, ${pc} 21px)` }}></div>
                        <div style={{ fontSize: '40px' }}>🪑</div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '9px', color: pc, background: pc + '22', padding: '2px 8px', borderRadius: '10px', border: `1px solid ${pc}44` }}>نموذج صناعي ذكي</div>
                    </div>
                </div>
            </div>

            {/* Glowing Accent */}
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', background: pc, filter: 'blur(80px)', opacity: 0.2 }}></div>
        </div>
    );
}

export default function SettingsPage() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [s, setS] = useState({
        appName: 'Stand Masr ERP',
        appLogo: '',
        logoSize: '56',
        primaryColor: '#E35E35',
        bgColor: '#0e0f11',
        sidebarBg: 'rgba(20,22,28,0.95)',
        sidebarText: '#919398',
        sidebarActive: '#E35E35',
        cardBg: 'rgba(30,32,38,0.7)',
        textColor: '#ffffff',
        btnText: '#ffffff',
        currency: 'EGP',
        currencySymbol: 'ج.م',
        invoicePrefix: 'PUR',
        purchaseCounter: '1',
        salesPrefix: 'INV',
        salesCounter: '1',
        loginUsername: 'admin',
        loginPassword: '1234',
        logoShape: 'rounded',
        appVersionText: 'ERP System v2.0',
        menuFontSize: '0.85',
        sidebarOpenWidth: '250',
        sidebarClosedWidth: '80',
        showLogoInUI: true,
        sidebarTogglePos: 'top',
        sidebarToggleSize: 'medium',
        sidebarToggleStyle: 'floating',
        sidebarAutoHideToggle: true,
        fontFamily: "'Cairo', sans-serif",
        textMuted: '#919398',
        fontSize: '100',
    });
    const [success, setSuccess] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [tab, setTab] = useState<'identity' | 'sidebar' | 'colors' | 'invoices' | 'stock' | 'danger'>('identity');
    const [showExtraPalettes, setShowExtraPalettes] = useState(false);
    const [showLogoSettings, setShowLogoSettings] = useState(false);
    const [currencies, setCurrencies] = useState<{ code: string, label: string, symbol: string }[]>([]);
    const [newCurrency, setNewCurrency] = useState({ code: '', label: '', symbol: '' });
    const [stockAlerts, setStockAlerts] = useState<Record<string, number>>({});
    const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; stock: number; unit: string }[]>([]);

    useEffect(() => {
        const saved = load();
        if (Object.keys(saved).length) setS(prev => ({ ...prev, ...saved }));
        // Load stock alerts
        try { const a = localStorage.getItem('erp_stock_alerts'); if (a) setStockAlerts(JSON.parse(a)); } catch { }

        // Load custom currencies
        try {
            const savedCurrencies = localStorage.getItem('erp_currencies');
            if (savedCurrencies) setCurrencies(JSON.parse(savedCurrencies));
            else setCurrencies(CURRENCIES);
        } catch { setCurrencies(CURRENCIES); }

        // Load inventory items for alert config
        fetch('/api/inventory').then(r => r.json()).then(data => setInventoryItems(data.filter((i: any) => i.category !== 'MANUFACTURED_PRICING'))).catch(() => { });
    }, []);

    const set = (k: string, v: string) => setS(prev => ({ ...prev, [k]: v }));

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => set('appLogo', ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const SHAPE_RADIUS: Record<string, string> = { square: '0px', rounded: '12px', circle: '50%', rect: '8px' };
    const logoRadius = (shape?: string) => SHAPE_RADIUS[shape || s.logoShape || 'rounded'] || '12px';

    const applyToDOM = (settings: typeof s) => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', settings.primaryColor);
        root.style.setProperty('--bg-color', settings.bgColor);
        root.style.setProperty('--sidebar-bg', settings.sidebarBg);
        root.style.setProperty('--sidebar-text', settings.sidebarText);
        root.style.setProperty('--sidebar-active', settings.sidebarActive);
        root.style.setProperty('--card-bg', settings.cardBg);
        root.style.setProperty('--text-primary', settings.textColor);
        root.style.setProperty('--text-muted', settings.textMuted);
        root.style.setProperty('--btn-text', settings.btnText);
        document.body.style.backgroundColor = settings.bgColor;
        document.body.style.fontSize = (Number(settings.fontSize) / 100) * 16 + 'px';
        document.title = settings.appName + ' | ERP';
        const radius = SHAPE_RADIUS[settings.logoShape || 'rounded'] || '12px';
        root.style.setProperty('--logo-radius', radius);
        root.style.setProperty('--logo-size', `${settings.logoSize}px`);
        root.style.setProperty('--font-main', settings.fontFamily);
        // Force refresh for glass panels
        const panels = document.querySelectorAll('.glass-panel');
        panels.forEach((p: any) => p.style.background = settings.cardBg);
    };

    const handleMaintenance = async (target: string) => {
        const msg = target === 'all'
            ? '⚠️ تحذير شديد: سيتم مسح كافة البيانات (عملاء، منتجات، مخزن، رواتب، خزينة) والعودة لضبط المصنع. هل تود الاستمرار؟'
            : target === 'clients'
                ? 'هل أنت متأكد من حذف كافة بيانات العملاء وحركاتهم المالية؟'
                : 'هل أنت متأكد من حذف كافة المنتجات والموديلات من النظام؟';

        if (!confirm(msg)) return;
        if (target === 'all' && !confirm('تأكيد نهائي: بمجرد الحذف لا يمكن استرجاع البيانات. استمرار؟')) return;

        try {
            const res = await fetch(`/api/maintenance?target=${target}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                alert('✅ ' + data.message);
                if (target === 'all') window.location.reload();
            } else {
                alert('❌ ' + data.error);
            }
        } catch (err) {
            alert('❌ حدث خطأ في الاتصال بالسيرفر');
        }
    };

    const handleBackup = async () => {
        try {
            setSuccess('🔄 جاري تحضير النسخة الاحتياطية...');
            const res = await fetch('/api/maintenance/backup');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `نسخة_احتياطية_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setSuccess('✅ تم تحميل النسخة الاحتياطية بنجاح!');
            } else {
                alert('❌ فشل إنشاء النسخة الاحتياطية');
            }
        } catch (err) {
            alert('❌ حدث خطأ أثناء التحميل');
        } finally {
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('⚠️ تحذير: استرجاع النسخة الاحتياطية سيمسح البيانات الحالية تماماً ويستبدلها ببيانات الملف. هل أنت متأكد؟')) return;

        try {
            setSuccess('🔄 جاري استرجاع البيانات... يرجى الانتظار');
            const text = await file.text();
            const backup = JSON.parse(text);

            const res = await fetch('/api/maintenance/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backup)
            });

            const data = await res.json();
            if (res.ok) {
                alert('✅ ' + data.message);
                window.location.reload();
            } else {
                alert('❌ ' + data.error);
            }
        } catch (err) {
            alert('❌ فشل قراءة الملف أو استرجاع النسخة');
        } finally {
            setSuccess('');
            if (e.target) e.target.value = '';
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        save(s);
        localStorage.setItem('appName', s.appName);
        localStorage.setItem('primaryColor', s.primaryColor);
        localStorage.setItem('appLogo', s.appLogo);
        localStorage.setItem('invoicePrefix', s.invoicePrefix);
        localStorage.setItem('purchaseCounter', s.purchaseCounter);
        localStorage.setItem('salesPrefix', s.salesPrefix);
        localStorage.setItem('salesCounter', s.salesCounter);
        localStorage.setItem('currency', s.currency);
        localStorage.setItem('currencySymbol', s.currencySymbol);
        localStorage.setItem('appVersionText', s.appVersionText);
        localStorage.setItem('menuFontSize', s.menuFontSize);
        localStorage.setItem('sidebarOpenWidth', s.sidebarOpenWidth);
        localStorage.setItem('sidebarClosedWidth', s.sidebarClosedWidth);
        localStorage.setItem('erp_currencies', JSON.stringify(currencies));
        applyToDOM(s);
        setSuccess('✅ تم حفظ جميع الإعدادات وتطبيقها!');
        setTimeout(() => setSuccess(''), 4000);
    };

    const applyPreset = (p: any) => {
        setS(prev => ({
            ...prev,
            primaryColor: p.primary,
            bgColor: p.bg,
            sidebarBg: p.sidebar,
            sidebarActive: p.primary,
            cardBg: p.card || prev.cardBg,
            textColor: p.text || prev.textColor,
            textMuted: p.muted || prev.textMuted,
            btnText: p.btn || prev.btnText
        }));
    };
    const 集中管理_ColorsSection = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Theme Presets */}
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem', color: s.primaryColor }}>🎭 مكتبة السيمزات والقوالب</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
                        {COLOR_PRESETS.map((p, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => applyPreset(p)}
                                style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: p.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.primary }}></div>
                                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Typography Section */}
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem', color: '#29b6f6' }}>✒️ إعدادات الخطوط والطباعة</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label htmlFor="font_fam">نوع الخط (Font Family)</label>
                            <select id="font_fam" className="input-glass" value={s.fontFamily} onChange={e => set('fontFamily', e.target.value)}>
                                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label htmlFor="font_size" style={{ margin: 0 }}>حجم الخط العام ({s.fontSize}%)</label>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>{Math.round((Number(s.fontSize) / 100) * 16)}px</span>
                            </div>
                            <input id="font_size" type="range" min="80" max="150" value={s.fontSize} onChange={e => set('fontSize', e.target.value)} style={{ width: '100%', accentColor: s.primaryColor }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Color Controls */}
            <div className="glass-panel">
                <h3 style={{ marginBottom: '1.5rem', color: s.primaryColor }}>🎨 التحكم التفصيلي في الألوان</h3>

                <h4 style={{ fontSize: '0.9rem', color: '#888', margin: '0 0 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>💎 ألوان الهوية والواجهة</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
                    {[
                        { key: 'primaryColor', label: 'اللون الرئيسي' },
                        { key: 'bgColor', label: 'خلفية الصفحة' },
                        { key: 'sidebarBg', label: 'خلفية القائمة' },
                        { key: 'cardBg', label: 'لون البطاقات' },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label htmlFor={`clr_${key}`} style={{ fontSize: '0.8rem', display: 'block' }}>{label}</label>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <input id={`clr_${key}_pick`} type="color" value={(s as any)[key]} onChange={e => set(key, e.target.value)} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }} title={`اختر ${label}`} />
                                <input id={`clr_${key}`} type="text" value={(s as any)[key]} onChange={e => set(key, e.target.value)} style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '2px 6px' }} title={`كود ${label}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <h4 style={{ fontSize: '0.9rem', color: '#888', margin: '0 0 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>📝 ألوان الخطوط والنصوص</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { key: 'textColor', label: 'النص الأساسي' },
                        { key: 'textMuted', label: 'النص الثانوي' },
                        { key: 'sidebarText', label: 'نص القائمة' },
                        { key: 'btnText', label: 'نص الأزرار' },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label htmlFor={`clr_${key}`} style={{ fontSize: '0.8rem', display: 'block' }}>{label}</label>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <input id={`clr_${key}_pick`} type="color" value={(s as any)[key]} onChange={e => set(key, e.target.value)} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }} title={`اختر ${label}`} />
                                <input id={`clr_${key}`} type="text" value={(s as any)[key]} onChange={e => set(key, e.target.value)} style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '2px 6px' }} title={`كود ${label}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const tabStyle = (t: string) => ({
        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 as const, fontSize: '0.9rem',
        background: tab === t ? s.primaryColor : 'transparent',
        color: tab === t ? '#fff' : '#919398',
        border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'inherit',
    });

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1>الإعدادات والمظهر</h1>
                <p>تخصيص هوية البرنامج وألوانه وترقيم الفواتير والعملة</p>
            </header>

            {success && <div style={{ background: 'rgba(102,187,106,0.2)', color: '#66bb6a', padding: '14px', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1rem' }}>{success}</div>}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button style={tabStyle('identity')} onClick={() => setTab('identity')}>🏭 الهوية والشعار</button>
                <button style={tabStyle('sidebar')} onClick={() => setTab('sidebar')}>📌 تخصيص القائمة</button>
                <button style={tabStyle('colors')} onClick={() => setTab('colors')}>🎨 الألوان والمظهر</button>
                <button style={tabStyle('invoices')} onClick={() => setTab('invoices')}>🧾 الفواتير والعملة</button>
                <button style={tabStyle('stock')} onClick={() => setTab('stock')} type="button">
                    ⚠️ تنبيهات المخزون
                    {inventoryItems.filter(i => i.stock <= (stockAlerts[i.id] ?? 5)).length > 0 && (
                        <span style={{ marginRight: '6px', background: '#E35E35', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', display: 'inline-block' }}>
                            {inventoryItems.filter(i => i.stock <= (stockAlerts[i.id] ?? 5)).length}
                        </span>
                    )}
                </button>
                <button style={tabStyle('danger')} onClick={() => setTab('danger')}>⚠️ متفرقات</button>
            </div>

            <form onSubmit={handleSave}>
                {/* TAB: الهوية */}
                {tab === 'identity' && (
                    <div className="glass-panel" style={{ maxWidth: '680px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: s.primaryColor }}>🏭 هوية المؤسسة</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label htmlFor="app_name">اسم البرنامج / المؤسسة</label>
                                <input id="app_name" type="text" className="input-glass" value={s.appName} onChange={e => set('appName', e.target.value)} required title="اسم المؤسسة" />
                            </div>

                            <div>
                                <label htmlFor="app_desc">النص الوصفي تحت الشعار</label>
                                <input id="app_desc" type="text" className="input-glass" value={s.appVersionText} onChange={e => set('appVersionText', e.target.value)} placeholder="مثال: ERP System v2.0" title="وصف البرنامج" />
                            </div>

                            <div
                                onClick={() => setShowLogoSettings(!showLogoSettings)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${showLogoSettings ? s.primaryColor + '44' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    userSelect: 'none'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.borderColor = s.primaryColor + '88';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = showLogoSettings ? s.primaryColor + '44' : 'rgba(255,255,255,0.1)';
                                }}
                            >
                                <label style={{ margin: 0, cursor: 'pointer', fontSize: '1rem', color: showLogoSettings ? s.primaryColor : '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    🖼️ شعار المؤسسة (لوجو) وتخصيصه
                                </label>
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: showLogoSettings ? s.primaryColor : '#888',
                                    background: showLogoSettings ? s.primaryColor + '15' : 'transparent',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    transition: 'all 0.3s'
                                }}>
                                    {showLogoSettings ? 'إغفاء الخيارات ▲' : 'تخصيص الشعار ▼'}
                                </span>
                            </div>

                            {showLogoSettings && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                            <div style={{ flexShrink: 0 }}>
                                                {s.appLogo ? (
                                                    <img src={s.appLogo} alt="Logo" style={{ width: `${s.logoSize}px`, height: `${s.logoSize}px`, objectFit: 'contain', borderRadius: logoRadius(), background: 'rgba(255,255,255,0.05)', padding: s.logoShape === 'circle' ? '4px' : '6px', border: '1px solid var(--border-color)', transition: 'border-radius 0.3s' }} />
                                                ) : (
                                                    <div style={{ width: `${s.logoSize}px`, height: `${s.logoSize}px`, background: s.primaryColor + '22', borderRadius: logoRadius(), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px dashed rgba(255,255,255,0.2)', transition: 'border-radius 0.3s' }}>🏭</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
                                                    📁 رفع صورة من الجهاز
                                                </button>
                                                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                                {s.appLogo && (
                                                    <button type="button" onClick={() => set('appLogo', '')} style={{ background: 'transparent', border: '1px solid #E35E35', color: '#E35E35', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        ✕ إزالة الشعار
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="logo_size">حجم الشعار في الواجهة ({s.logoSize}px)</label>
                                        <input id="logo_size" type="range" min="40" max="150" value={s.logoSize} onChange={e => set('logoSize', e.target.value)} style={{ width: '100%', marginTop: '6px', accentColor: s.primaryColor }} title="تحكم في حجم الشعار" />
                                    </div>

                                    <div>
                                        <label>شكل الشعار</label>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                            {[
                                                { key: 'square', label: 'مربع', radius: '0px' },
                                                { key: 'rounded', label: 'دائري الأطراف', radius: '12px' },
                                                { key: 'circle', label: 'دائرة', radius: '50%' },
                                                { key: 'rect', label: 'مستطيل', radius: '8px' },
                                            ].map(shape => (
                                                <button
                                                    key={shape.key}
                                                    type="button"
                                                    onClick={() => { set('logoShape', shape.key); const r = shape.radius; document.documentElement.style.setProperty('--logoRadius', r); }}
                                                    style={{
                                                        padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px',
                                                        background: s.logoShape === shape.key ? s.primaryColor + '22' : 'rgba(255,255,255,0.04)',
                                                        border: `2px solid ${s.logoShape === shape.key ? s.primaryColor : 'rgba(255,255,255,0.1)'}`,
                                                        color: s.logoShape === shape.key ? '#fff' : '#aaa',
                                                    }}>
                                                    <div style={{ width: '28px', height: '28px', background: s.appLogo ? 'transparent' : s.primaryColor + '44', borderRadius: shape.radius, border: `2px solid ${s.primaryColor}`, overflow: 'hidden', flexShrink: 0, transition: 'border-radius 0.25s' }}>
                                                        {s.appLogo && <img src={s.appLogo} alt={shape.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    </div>
                                                    {shape.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <label htmlFor="show_logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                            <input id="show_logo" type="checkbox" checked={s.showLogoInUI !== false} onChange={e => setS(prev => ({ ...prev, showLogoInUI: e.target.checked }))} style={{ accentColor: s.primaryColor, width: '20px', height: '20px' }} />
                                            إظهار الشعار (اللوجو) في الشاشات والقوائم
                                        </label>
                                    </div>

                                    <div style={{ background: s.bgColor, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 10px' }}>معاينة الشعار في الواجهة:</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            {(s.showLogoInUI !== false) && (
                                                s.appLogo
                                                    ? <img src={s.appLogo} alt="Logo" style={{ width: `${s.logoSize}px`, height: `${s.logoSize}px`, objectFit: 'contain', borderRadius: logoRadius(), transition: 'border-radius 0.3s' }} />
                                                    : <div style={{ width: `${s.logoSize}px`, height: `${s.logoSize}px`, background: s.primaryColor, borderRadius: logoRadius(), transition: 'border-radius 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏭</div>
                                            )}
                                            <div>
                                                <h2 style={{ color: s.primaryColor, margin: 0, fontSize: '1.5rem' }}>{s.appName}</h2>
                                                <p style={{ margin: 0, fontSize: '0.8rem' }}>{s.appVersionText || 'ERP System v2.0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: تخصيص القائمة */}
                {tab === 'sidebar' && (
                    <div className="glass-panel" style={{ maxWidth: '680px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: s.primaryColor }}>📌 تخصيص القائمة الجانبية (Sidebar)</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label htmlFor="sb_open">العرض (مفتوحة)</label>
                                <input id="sb_open" type="number" className="input-glass" value={s.sidebarOpenWidth} onChange={e => set('sidebarOpenWidth', e.target.value)} title="عرض القائمة وهي مفتوحة" />
                            </div>
                            <div>
                                <label htmlFor="sb_closed">العرض (مغلقة)</label>
                                <input id="sb_closed" type="number" className="input-glass" value={s.sidebarClosedWidth} onChange={e => set('sidebarClosedWidth', e.target.value)} title="عرض القائمة وهي مغلقة" />
                            </div>

                            <hr style={{ gridColumn: 'span 2', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }} />

                            <div style={{ gridColumn: 'span 2' }}>
                                <h4 style={{ color: s.primaryColor, marginBottom: '15px' }}>🕹️ زر التحكم في القائمة (Toggle Button)</h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label htmlFor="sb_toggle_pos">الموقع الرأسي للزر</label>
                                        <select id="sb_toggle_pos" className="input-glass" value={s.sidebarTogglePos} onChange={e => set('sidebarTogglePos', e.target.value)} title="موقع زر التحكم">
                                            <option value="top">أعلى القائمة</option>
                                            <option value="middle">منتصف القائمة</option>
                                            <option value="bottom">أسفل القائمة</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="sb_toggle_sz">حجم الزر</label>
                                        <select id="sb_toggle_sz" className="input-glass" value={s.sidebarToggleSize} onChange={e => set('sidebarToggleSize', e.target.value)} title="حجم زر التحكم">
                                            <option value="small">صغير</option>
                                            <option value="medium">متوسط</option>
                                            <option value="large">كبير</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="sb_toggle_st">نمط الزر</label>
                                        <select id="sb_toggle_st" className="input-glass" value={s.sidebarToggleStyle} onChange={e => set('sidebarToggleStyle', e.target.value)} title="نمط زر التحكم">
                                            <option value="floating">زر عائم (Floating)</option>
                                            <option value="border">مدمج مع الحافة (Border)</option>
                                        </select>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <label htmlFor="sb_auto_h" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input id="sb_auto_h" type="checkbox" checked={s.sidebarAutoHideToggle} onChange={e => setS(prev => ({ ...prev, sidebarAutoHideToggle: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: s.primaryColor }} />
                                            ظهور الزر فقط عند تقريب الماوس (Hover)
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* TAB: الألوان */}
                {tab === 'colors' && <集中管理_ColorsSection />}

                {/* TAB: الفواتير والعملة */}
                {tab === 'invoices' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="glass-panel">
                            <h3 style={{ marginBottom: '1.5rem', color: '#ffa726' }}>💱 العملة الافتراضية للبرنامج</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {currencies.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: s.currency === c.code ? `${s.primaryColor}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${s.currency === c.code ? s.primaryColor : 'rgba(255,255,255,0.08)'}` }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, marginBottom: 0 }}>
                                            <input type="radio" name="currency" value={c.code} checked={s.currency === c.code} onChange={() => setS(prev => ({ ...prev, currency: c.code, currencySymbol: c.symbol }))} style={{ accentColor: s.primaryColor }} />
                                            <span style={{ flex: 1, color: '#fff', fontSize: '0.95rem' }}>{c.label}</span>
                                            <span style={{ color: s.primaryColor, fontWeight: 'bold' }}>{c.symbol}</span>
                                        </label>
                                        {!CURRENCIES.find(base => base.code === c.code) && (
                                            <button type="button" onClick={() => setCurrencies(prev => prev.filter(cur => cur.code !== c.code))} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', padding: '4px' }} title="حذف العملة المخصصة">🗑️</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p style={{ marginTop: '10px', fontSize: '0.8rem' }}>رمز العملة المختار: <strong style={{ color: s.primaryColor }}>{s.currencySymbol}</strong> - سيظهر في كل أرقام الفواتير</p>

                            <h4 style={{ color: '#ffa726', marginTop: '30px', marginBottom: '15px', fontSize: '1rem' }}>➕ إضافة عملة جديدة مخصصة</h4>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '80px' }}><label htmlFor="new_cur_code">الرمز</label><input id="new_cur_code" type="text" className="input-glass" value={newCurrency.code} onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })} placeholder="DZD" title="رمز العملة" /></div>
                                <div style={{ flex: 2, minWidth: '150px' }}><label htmlFor="new_cur_lbl">الاسم الكامل</label><input id="new_cur_lbl" type="text" className="input-glass" value={newCurrency.label} onChange={e => setNewCurrency({ ...newCurrency, label: e.target.value })} placeholder="دينار جزائري (د.ج)" title="الاسم الكامل للعملة" /></div>
                                <div style={{ flex: 1, minWidth: '60px' }}><label htmlFor="new_cur_sym">العلامة</label><input id="new_cur_sym" type="text" className="input-glass" value={newCurrency.symbol} onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })} placeholder="د.ج" title="علامة العملة" /></div>
                                <button type="button" className="btn-secondary" onClick={() => {
                                    if (newCurrency.code && newCurrency.label && newCurrency.symbol) {
                                        setCurrencies(prev => [...prev, { ...newCurrency }]);
                                        setNewCurrency({ code: '', label: '', symbol: '' });
                                    }
                                }}>إضافة</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '1.5rem', color: '#29b6f6' }}>🧾 ترقيم فواتير المشتريات</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label htmlFor="pur_prefix">البادئة (Prefix)</label>
                                        <input id="pur_prefix" type="text" className="input-glass" value={s.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} title="بادئة ترقيم المشتريات" />
                                    </div>
                                    <div>
                                        <label htmlFor="pur_count">الرقم الحالي (سيكتب على الفاتورة القادمة)</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input id="pur_count" type="number" className="input-glass" value={s.purchaseCounter} onChange={e => set('purchaseCounter', e.target.value)} min="1" style={{ flex: 1 }} title="الرقم التالي للمشتريات" />
                                            <button type="button" onClick={() => set('purchaseCounter', '1')} style={{ padding: '8px 12px', background: '#E35E35', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>تصفير</button>
                                        </div>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.85rem' }}>القادمة: <strong style={{ color: '#29b6f6' }}>{s.invoicePrefix}-{String(parseInt(s.purchaseCounter || '1')).padStart(4, '0')}</strong></p>
                                </div>
                            </div>
                            <div className="glass-panel">
                                <h3 style={{ marginBottom: '1.5rem', color: '#66bb6a' }}>🧾 ترقيم فواتير المبيعات</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label htmlFor="sal_prefix">البادئة (Prefix)</label>
                                        <input id="sal_prefix" type="text" className="input-glass" value={s.salesPrefix} onChange={e => set('salesPrefix', e.target.value)} title="بادئة ترقيم المبيعات" />
                                    </div>
                                    <div>
                                        <label htmlFor="sal_count">الرقم الحالي</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input id="sal_count" type="number" className="input-glass" value={s.salesCounter} onChange={e => set('salesCounter', e.target.value)} min="1" style={{ flex: 1 }} title="الرقم التالي للمبيعات" />
                                            <button type="button" onClick={() => set('salesCounter', '1')} style={{ padding: '8px 12px', background: '#E35E35', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>تصفير</button>
                                        </div>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.85rem' }}>القادمة: <strong style={{ color: '#66bb6a' }}>{s.salesPrefix}-{String(parseInt(s.salesCounter || '1')).padStart(4, '0')}</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: متفرقات */}
                {tab === 'danger' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Change credentials */}
                        <div className="glass-panel">
                            <h3 style={{ color: '#29b6f6', marginBottom: '1.5rem' }}>🔑 بيانات تسجيل الدخول</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label htmlFor="st_user">اسم المستخدم</label>
                                    <input id="st_user" type="text" className="input-glass" value={s.loginUsername} onChange={e => set('loginUsername', e.target.value)} placeholder="admin" title="اسم مستخدم المدير" />
                                </div>
                                <div>
                                    <label htmlFor="st_pass">كلمة المرور</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            id="st_pass"
                                            type={showPass ? 'text' : 'password'}
                                            className="input-glass"
                                            value={s.loginPassword}
                                            onChange={e => set('loginPassword', e.target.value)}
                                            placeholder="1234"
                                            style={{ paddingLeft: '3rem' }}
                                            title="كلمة مرور المدير"
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} title={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                                            {showPass ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#888' }}>⚠️ لا تنس الضغط على "حفظ" لتفعيل بيانات الدخول الجديدة</p>
                            </div>
                        </div>

                        {/* Logout & Reset */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="glass-panel">
                                <h3 style={{ color: '#E35E35', marginBottom: '1.5rem' }}>⚠️ صيانة قاعدة البيانات</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ color: '#888', fontSize: '0.85rem' }}>يُنصح دائماً بأخذ نسخة احتياطية قبل أي عملية حذف.</p>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={handleBackup}
                                            style={{ background: '#29b6f6', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
                                        >
                                            📥 تحميل النسخة (Backup)
                                        </button>

                                        <label style={{ background: 'rgba(102,187,106,0.1)', border: '1px solid #66bb6a', color: '#66bb6a', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                                            📤 استرجاع نسخة (Restore)
                                            <input type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
                                        </label>
                                    </div>

                                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }} />

                                    <p style={{ color: '#ff5252', fontSize: '0.75rem', fontWeight: 'bold' }}>منطقة الحذف النهائي:</p>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => handleMaintenance('clients')}
                                        style={{ border: '1px solid #ff5252', color: '#ff5252', padding: '10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'right' }}
                                    >
                                        🗑️ حذف جميع بيانات العملاء والعمليات المالية
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => handleMaintenance('products')}
                                        style={{ border: '1px solid #ff5252', color: '#ff5252', padding: '10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'right' }}
                                    >
                                        🗑️ حذف جميع المنتجات والموديلات من الكتالوج
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => handleMaintenance('all')}
                                        style={{ background: '#d32f2f', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        🔥 تصفير قاعدة البيانات بالكامل (اعادة ضبط المصنع)
                                    </button>
                                </div>
                            </div>

                            <div className="glass-panel">
                                <h3 style={{ color: '#E35E35', marginBottom: '1.5rem' }}>⚠️ خروج وإعادة تعيين الواجهة</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>تسجيل الخروج يمسح الجلسة فقط - الإعدادات والبيانات تبقى محفوظة.</p>
                                    <button type="button" onClick={() => {
                                        localStorage.removeItem('erp_logged_in');
                                        localStorage.removeItem('erp_login_time');
                                        window.location.href = '/login';
                                    }} style={{ background: 'rgba(227,94,53,0.1)', border: '1px solid #E35E35', color: '#E35E35', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem' }}>
                                        🚪 تسجيل الخروج الآن
                                    </button>
                                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>إعادة تعيين الإعدادات البصرية للقيم الافتراضية (لا يمسح بيانات قاعدة البيانات):</p>
                                    <button type="button" onClick={() => {
                                        localStorage.removeItem(KEY);
                                        window.location.reload();
                                    }} style={{ background: 'transparent', border: '1px solid #555', color: '#888', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        🔄 إعادة تعيين المظهر الافتراضي
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ TAB: تنبيهات المخزون ══ */}
                {tab === 'stock' && (
                    <div className="glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#ffa726' }}>⚠️ تنبيهات المخزون</h3>
                                <p style={{ margin: '4px 0 0', color: '#919398', fontSize: '0.85rem' }}>حدد الحد الأدنى لكل صنف — سيظهر تنبيه عند الانخفاض عن هذا الحد</p>
                            </div>
                            <button type="button" onClick={() => { localStorage.setItem('erp_stock_alerts', JSON.stringify(stockAlerts)); setSuccess('✅ تم حفظ إعدادات تنبيهات المخزون!'); setTimeout(() => setSuccess(''), 3000); }}
                                className="btn-primary" style={{ background: '#ffa726', padding: '10px 24px' }}>
                                💾 حفظ إعدادات التنبيهات
                            </button>
                        </div>

                        {/* Summary of low items */}
                        {inventoryItems.filter(i => i.stock <= (stockAlerts[i.id] ?? 5)).length > 0 && (
                            <div style={{ background: 'rgba(227,94,53,0.1)', border: '1px solid rgba(227,94,53,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem' }}>
                                <strong style={{ color: '#E35E35' }}>🚨 أصناف منخفضة الآن:</strong>
                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {inventoryItems.filter(i => i.stock <= (stockAlerts[i.id] ?? 5)).map(i => (
                                        <span key={i.id} style={{ background: 'rgba(227,94,53,0.2)', color: '#E35E35', padding: '4px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                                            {i.name} ({i.stock} {i.unit})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Per-item threshold table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table-glass">
                                <thead>
                                    <tr>
                                        <th>اسم الصنف</th>
                                        <th style={{ textAlign: 'center' }}>الكمية الحالية</th>
                                        <th style={{ textAlign: 'center' }}>الوحدة</th>
                                        <th style={{ textAlign: 'center', width: '160px' }}>الحد الأدنى للتنبيه</th>
                                        <th style={{ textAlign: 'center' }}>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventoryItems.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>جاري تحميل بيانات المخزن...</td></tr>
                                    ) : inventoryItems.map(item => {
                                        const threshold = stockAlerts[item.id] ?? 5;
                                        const isLow = item.stock <= threshold;
                                        return (
                                            <tr key={item.id} style={{ background: isLow ? 'rgba(227,94,53,0.06)' : 'transparent' }}>
                                                <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: isLow ? '#E35E35' : '#66bb6a' }}>
                                                    {item.stock.toFixed(0)}{isLow && ' ⚠️'}
                                                </td>
                                                <td style={{ textAlign: 'center', color: '#919398' }}>{item.unit}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input type="number" min="0" step="1" value={threshold}
                                                        onChange={e => setStockAlerts(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                                                        style={{ width: '90px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${isLow ? '#E35E35' : 'rgba(255,255,255,0.15)'}`, color: '#fff', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', background: isLow ? 'rgba(227,94,53,0.2)' : 'rgba(102,187,106,0.15)', color: isLow ? '#E35E35' : '#66bb6a' }}>
                                                        {isLow ? '🚨 منخفض' : '✅ طبيعي'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1rem', minWidth: '250px' }}>
                        💾 حفظ جميع الإعدادات وتطبيقها
                    </button>
                </div>
            </form>
        </div>
    );
}
