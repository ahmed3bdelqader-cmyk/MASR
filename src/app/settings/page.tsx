'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const KEY = 'erp_settings';
const loadLS = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } };
const saveLS = (s: any) => localStorage.setItem(KEY, JSON.stringify(s));

// Persist to DB ─ fire-and-forget
const persistDB = async (patch: Record<string, string>) => {
    try { await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); } catch { }
};

const CURRENCIES = [
    { code: 'EGP', label: 'جنيه مصري (ج.م)', symbol: 'ج.م' },
    { code: 'USD', label: 'دولار أمريكي ($)', symbol: '$' },
    { code: 'SAR', label: 'ريال سعودي (ر.س)', symbol: 'ر.س' },
    { code: 'AED', label: 'درهم إماراتي (د.إ)', symbol: 'د.إ' },
    { code: 'EUR', label: 'يورو (€)', symbol: '€' },
    { code: 'GBP', label: 'جنيه إسترليني (£)', symbol: '£' },
];

const COLOR_PRESETS = [
    // ─── 10 DAY THEMES (LIGHT/VIBRANT) ───
    { label: 'الأبيض النقي (Arctic White)', primary: '#007AFF', bg: '#fbfbfb', sidebar: '#ffffff', card: '#ffffff', text: '#1d1d1f', muted: '#6e6e73', btn: '#ffffff', radius: '12', shadow: '0 2px 10px rgba(0,0,0,0.05)', hoverShadow: '0 8px 30px rgba(0,0,0,0.1)', glassBg: '100', type: 'day' },
    { label: 'الوردي اللطيف (Soft Sakura)', primary: '#ff69b4', bg: '#fff5f7', sidebar: '#ffffff', card: '#ffffff', text: '#4a154b', muted: '#9b7b9b', btn: '#ffffff', radius: '20', shadow: '0 4px 15px rgba(255,105,180,0.1)', hoverShadow: '0 10px 25px rgba(255,105,180,0.2)', glassBg: '90', type: 'day' },
    { label: 'السماء الزرقاء (Azure Day)', primary: '#00a8ff', bg: '#f0f9ff', sidebar: '#ffffff', card: '#ffffff', text: '#002f4d', muted: '#5c7a99', btn: '#ffffff', radius: '10', shadow: '0 4px 12px rgba(0,168,255,0.1)', hoverShadow: '0 8px 24px rgba(0,168,255,0.2)', glassBg: '95', type: 'day' },
    { label: 'الزمردي المنعش (Mint Fresh)', primary: '#2ecc71', bg: '#f9fffb', sidebar: '#ffffff', card: '#ffffff', text: '#145a32', muted: '#27ae60', btn: '#ffffff', radius: '8', shadow: '0 4px 10px rgba(46,204,113,0.1)', hoverShadow: '0 8px 20px rgba(46,204,113,0.2)', glassBg: '95', type: 'day' },
    { label: 'البرتقالي المشمس (Sunny Orange)', primary: '#e67e22', bg: '#fffaf5', sidebar: '#ffffff', card: '#ffffff', text: '#6e2c00', muted: '#d35400', btn: '#ffffff', radius: '12', shadow: '0 4px 10px rgba(230,126,34,0.1)', hoverShadow: '0 10px 20px rgba(230,126,34,0.2)', glassBg: '95', type: 'day' },
    { label: 'الأرجواني الملكي (Lavender Day)', primary: '#9b59b6', bg: '#fbf5ff', sidebar: '#ffffff', card: '#ffffff', text: '#4a235a', muted: '#8e44ad', btn: '#ffffff', radius: '15', shadow: '0 4px 12px rgba(155,89,182,0.1)', hoverShadow: '0 10px 25px rgba(155,89,182,0.2)', glassBg: '90', type: 'day' },
    { label: 'القهوة والصباح (Morning Coffee)', primary: '#6f4e37', bg: '#faf7f5', sidebar: '#ffffff', card: '#ffffff', text: '#3c2a21', muted: '#8b4513', btn: '#ffffff', radius: '6', shadow: '0 2px 8px rgba(111,78,55,0.1)', hoverShadow: '0 6px 18px rgba(111,78,55,0.2)', glassBg: '100', type: 'day' },
    { label: 'رمال الساحل (Coastal Sand)', primary: '#c2a385', bg: '#fdfbf9', sidebar: '#ffffff', card: '#ffffff', text: '#5d4037', muted: '#8d6e63', btn: '#ffffff', radius: '10', shadow: '0 2px 10px rgba(194,163,133,0.1)', hoverShadow: '0 8px 20px rgba(194,163,133,0.2)', glassBg: '95', type: 'day' },
    { label: 'النبات الغض (Succulent Green)', primary: '#78ab46', bg: '#fcfdfa', sidebar: '#ffffff', card: '#ffffff', text: '#3e4e2c', muted: '#5b7a3a', btn: '#ffffff', radius: '14', shadow: '0 4px 12px rgba(120,171,70,0.1)', hoverShadow: '0 10px 20px rgba(120,171,70,0.2)', glassBg: '90', type: 'day' },
    { label: 'اللؤلؤي الناعم (Soft Pearl)', primary: '#cdb4db', bg: '#fdfcfd', sidebar: '#ffffff', card: '#ffffff', text: '#22223b', muted: '#4a4e69', btn: '#ffffff', radius: '25', shadow: '0 4px 12px rgba(205,180,219,0.1)', hoverShadow: '0 12px 30px rgba(205,180,219,0.2)', glassBg: '80', type: 'day' },

    // ─── 10 NIGHT THEMES (DARK/DYNAMIC) ───
    { label: 'الأسود والذهبي (Midnight Gold)', primary: '#d4af37', bg: '#080808', sidebar: 'rgba(12, 12, 12, 0.95)', card: 'rgba(20, 20, 20, 0.85)', text: '#ffffff', muted: '#9a812e', btn: '#ffffff', radius: '12', shadow: '0 0 20px rgba(212,175,55,0.1)', hoverShadow: '0 8px 32px rgba(212, 175, 55, 0.15)', glassBg: '85', type: 'night' },

    // --- RGB Themes ---
    { label: 'ألوان RGB المتحركة (Neon Flow)', primary: '#00ffcc', bg: '#050505', sidebar: 'rgba(10, 10, 10, 0.9)', card: 'rgba(15, 15, 15, 0.8)', text: '#ffffff', muted: '#00ffcc', btn: '#000000', radius: '16', shadow: '0 0 15px rgba(0,255,204,0.3)', hoverShadow: '0 0 30px rgba(0,255,204,0.5)', glassBg: '80', type: 'rgb' },
    { label: 'RGB برتقالي (Neon Orange)', primary: '#ff6600', bg: '#050200', sidebar: 'rgba(10, 5, 2, 0.9)', card: 'rgba(15, 8, 4, 0.8)', text: '#ffffff', muted: '#ff6600', btn: '#000000', radius: '16', shadow: '0 0 15px rgba(255,102,0,0.3)', hoverShadow: '0 0 30px rgba(255,102,0,0.5)', glassBg: '80', type: 'rgb-orange' },
    { label: 'RGB أحمر (Neon Red)', primary: '#ff0033', bg: '#050002', sidebar: 'rgba(10, 2, 4, 0.9)', card: 'rgba(15, 4, 6, 0.8)', text: '#ffffff', muted: '#ff0033', btn: '#000000', radius: '16', shadow: '0 0 15px rgba(255,0,51,0.3)', hoverShadow: '0 0 30px rgba(255,0,51,0.5)', glassBg: '80', type: 'rgb-red' },
    { label: 'RGB أزرق (Neon Blue)', primary: '#0066ff', bg: '#000205', sidebar: 'rgba(2, 5, 10, 0.9)', card: 'rgba(4, 8, 15, 0.8)', text: '#ffffff', muted: '#0066ff', btn: '#ffffff', radius: '16', shadow: '0 0 15px rgba(0,102,255,0.3)', hoverShadow: '0 0 30px rgba(0,102,255,0.5)', glassBg: '80', type: 'rgb-blue' },
    { label: 'RGB أخضر (Neon Green)', primary: '#33ff00', bg: '#000501', sidebar: 'rgba(2, 10, 4, 0.9)', card: 'rgba(4, 15, 6, 0.8)', text: '#ffffff', muted: '#33ff00', btn: '#000000', radius: '16', shadow: '0 0 15px rgba(51,255,0,0.3)', hoverShadow: '0 0 30px rgba(51,255,0,0.5)', glassBg: '80', type: 'rgb-green' },
    // --- End RGB ---

    { label: 'الفضاء العميق (Deep Space)', primary: '#bb86fc', bg: '#0b0b1a', sidebar: 'rgba(15, 15, 30, 0.95)', card: 'rgba(20, 20, 40, 0.85)', text: '#e0e0e0', muted: '#bb86fc', btn: '#000000', radius: '12', shadow: '0 0 15px rgba(187,134,252,0.2)', hoverShadow: '0 4px 25px rgba(187,134,252,0.4)', glassBg: '85', type: 'night' },
    { label: 'الزمرد الليلي (Night Emerald)', primary: '#10b981', bg: '#05120d', sidebar: 'rgba(5, 20, 15, 0.95)', card: 'rgba(10, 30, 25, 0.85)', text: '#d1fae5', muted: '#10b981', btn: '#000000', radius: '10', shadow: '0 0 15px rgba(16,185,129,0.2)', hoverShadow: '0 10px 25px rgba(16,185,129,0.3)', glassBg: '85', type: 'night' },
    { label: 'السايبر بانك (Cyberpunk)', primary: '#f300ff', bg: '#0d0221', sidebar: 'rgba(18, 5, 45, 0.95)', card: 'rgba(25, 8, 60, 0.8)', text: '#00ccff', muted: '#f300ff', btn: '#ffffff', radius: '0', shadow: '3px 3px 0px #00ccff', hoverShadow: '6px 6px 0px #f300ff', glassBg: '80', type: 'night' },
    { label: 'الروبوت الذكي (Tech Iron)', primary: '#e0e0e0', bg: '#1a1a1a', sidebar: 'rgba(35, 35, 35, 0.95)', card: 'rgba(45, 45, 45, 0.85)', text: '#ffffff', muted: '#757575', btn: '#000000', radius: '6', shadow: '0 4px 10px rgba(0,0,0,0.5)', hoverShadow: '0 10px 20px rgba(0,0,0,0.8)', glassBg: '85', type: 'night' },
    { label: 'المحيط العميق (Abyssal Blue)', primary: '#0070f3', bg: '#000510', sidebar: 'rgba(0, 10, 25, 0.95)', card: 'rgba(0, 15, 35, 0.85)', text: '#8ab4f8', muted: '#0070f3', btn: '#ffffff', radius: '14', shadow: '0 0 20px rgba(0,112,243,0.15)', hoverShadow: '0 8px 30px rgba(0,112,243,0.3)', glassBg: '85', type: 'night' },
    { label: 'البركان الإحترافي (Volcano Pro)', primary: '#ff3d00', bg: '#120a08', sidebar: 'rgba(20, 10, 8, 0.95)', card: 'rgba(30, 15, 12, 0.85)', text: '#ffccbc', muted: '#ff3d00', btn: '#000000', radius: '8', shadow: '0 0 15px rgba(255,61,0,0.2)', hoverShadow: '0 10px 25px rgba(255,61,0,0.4)', glassBg: '85', type: 'night' },
    { label: 'الماس البنفسجي (Violet Diamond)', primary: '#d500f9', bg: '#0a000d', sidebar: 'rgba(15, 0, 20, 0.95)', card: 'rgba(25, 0, 35, 0.85)', text: '#f3e5f5', muted: '#d500f9', btn: '#ffffff', radius: '20', shadow: '0 0 20px rgba(213,0,249,0.15)', hoverShadow: '0 12px 35px rgba(213,0,249,0.3)', glassBg: '85', type: 'night' },
    { label: 'فروست نايت (Frosty Night)', primary: '#e1f5fe', bg: '#010f14', sidebar: 'rgba(2, 24, 32, 0.95)', card: 'rgba(3, 35, 45, 0.85)', text: '#ffffff', muted: '#4fc3f7', btn: '#000000', radius: '15', shadow: '0 0 15px rgba(79,195,247,0.1)', hoverShadow: '0 0 30px rgba(79,195,247,0.3)', glassBg: '85', type: 'night' },

    // ─── SPECIAL THEME ───
    { label: 'فانوس رمضان (Ramadan Spirit)', primary: '#ffd700', bg: '#0a101a', sidebar: 'rgba(15, 25, 45, 0.95)', card: 'rgba(20, 35, 60, 0.8)', text: '#fff9c4', muted: '#ffd700', btn: '#1b5e20', radius: '30', shadow: '0 0 25px rgba(255,215,0,0.2)', hoverShadow: '0 0 45px rgba(255,215,0,0.4)', glassBg: '80', type: 'ramadan' },
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
                    <div style={{ marginBottom: '5px' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px' }}>نظام تخطيط موارد المؤسسات</h4>
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
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: `3px solid ${pc}`, borderRightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'var(--text-primary)' }}>85%</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>2,450 كجم</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Feature */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Background Lines */}
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: `repeating-linear-gradient(45deg, transparent, transparent 20px, ${pc} 20px, ${pc} 21px), repeating-linear-gradient(-45deg, transparent, transparent 20px, ${pc} 20px, ${pc} 21px)` }}></div>
                        <div style={{ fontSize: '40px' }}>🪑</div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '9px', color: pc, background: pc + '22', padding: '2px 8px', borderRadius: '10px', border: `1px solid ${pc}44`, zIndex: 3 }}>نموذج صناعي ذكي</div>
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
    const DEFAULTS = {
        appName: 'Stand Masr ERP', appLogo: '', logoSize: '56',
        primaryColor: '#E35E35', bgColor: '#0e0f11', sidebarBg: 'rgba(20,22,28,0.95)',
        sidebarText: '#919398', sidebarActive: '#E35E35', cardBg: 'rgba(30,32,38,0.7)',
        textColor: '#ffffff', btnText: '#ffffff',
        borderRadius: '16', glassBg: '70', cardShadow: 'none', cardHoverShadow: '0 8px 32px rgba(212, 175, 55, 0.15)',
        currency: 'EGP', currencySymbol: 'ج.م',
        invoicePrefix: 'PUR', purchaseCounter: '1',
        salesPrefix: 'INV', salesCounter: '1',
        loginUsername: 'admin', loginPassword: '1234',
        logoShape: 'rounded', appVersionText: 'ERP System v2.0',
        showLogoInUI: true,
        printLogo: '', sealLogo: '', sealOpacity: '50', sealPosition: 'center',
        fontFamily: "'Cairo', sans-serif", textMuted: '#919398', fontSize: '100',
        uiScale: '100', uiLayout: 'fluid', uiSidebarCollapsed: 'false', uiForceDesktop: 'false',
        themeType: 'day',
    };
    const [s, setS] = useState(DEFAULTS);
    const set = (k: string, v: any) => setS(prev => ({ ...prev, [k]: v }));
    const [success, setSuccess] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [tab, setTab] = useState<'identity' | 'logos' | 'colors' | 'invoices' | 'stock' | 'danger' | 'ai' | 'display'>('identity');
    const [aiApiKey, setAiApiKey] = useState('');
    const [showAiKey, setShowAiKey] = useState(false);
    const [showLogoSettings, setShowLogoSettings] = useState(false);
    const [showAddCurrency, setShowAddCurrency] = useState(false);
    const [currencies, setCurrencies] = useState<{ code: string, label: string, symbol: string }[]>([]);
    const [newCurrency, setNewCurrency] = useState({ code: '', label: '', symbol: '' });
    const [stockAlerts, setStockAlerts] = useState<Record<string, number>>({});
    const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; stock: number; unit: string }[]>([]);
    const [dbCounters, setDbCounters] = useState<any>({});
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        themes: true,
        colors: false,
        fonts: false,
        layout: false
    });

    const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    const [syncing, setSyncing] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        desc: string;
        action: string;
        confirmWord: string;
        puzzle?: string;
        puzzleAnswer?: string;
        onConfirm: () => void;
    }>({ open: false, title: '', desc: '', action: '', confirmWord: '', onConfirm: () => { } });
    const [confirmInput, setConfirmInput] = useState('');

    // Fetch DB counters for invoice numbering preview
    const fetchDbCounters = useCallback(async () => {
        try {
            const [s2, p2] = await Promise.all([
                fetch('/api/settings/counters?type=sales').then(r => r.json()),
                fetch('/api/settings/counters?type=purchase').then(r => r.json()),
            ]);
            setDbCounters({ salesNext: s2.invoiceNo || '', purchaseNext: p2.invoiceNo || '' });
        } catch { }
    }, []);

    useEffect(() => {
        const saved = loadLS();
        if (Object.keys(saved).length) setS(prev => ({ ...prev, ...saved }));
        try { const a = localStorage.getItem('erp_stock_alerts'); if (a) setStockAlerts(JSON.parse(a)); } catch { }
        try {
            const sc = localStorage.getItem('erp_currencies');
            setCurrencies(sc ? JSON.parse(sc) : CURRENCIES);
        } catch { setCurrencies(CURRENCIES); }
        fetch('/api/inventory').then(r => r.json()).then(data => setInventoryItems(data.filter((i: any) => i.category !== 'MANUFACTURED_PRICING'))).catch(() => { });
        fetch('/api/settings/ai').then(r => r.json()).then(data => {
            if (data.success && data.ai_api_key) setAiApiKey(data.ai_api_key);
        }).catch(() => { });
        fetchDbCounters();
    }, [fetchDbCounters]);



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
        root.style.setProperty('--border-radius', settings.borderRadius + 'px');
        root.style.setProperty('--card-shadow', settings.cardShadow || 'none');
        root.style.setProperty('--card-hover-shadow', settings.cardHoverShadow || '0 8px 32px rgba(0,0,0,0.4)');
        document.body.style.backgroundColor = settings.bgColor;
        document.body.style.fontSize = (Number(settings.fontSize) / 100) * 16 + 'px';
        document.title = settings.appName + ' | ERP';
        const radius = SHAPE_RADIUS[settings.logoShape || 'rounded'] || '12px';
        root.style.setProperty('--logo-radius', radius);
        root.style.setProperty('--logo-size', `${settings.logoSize}px`);
        root.style.setProperty('--font-main', settings.fontFamily);

        // Dynamic secondary background and button colors
        const isLight = settings.bgColor === '#fbfbfb' || settings.bgColor.includes('255, 255, 255') || settings.bgColor === '#ffffff';
        root.style.setProperty('--btn-secondary-bg', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)');
        root.style.setProperty('--btn-secondary-text', isLight ? '#333' : '#ffffff');
        root.style.setProperty('--input-bg-glass', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)');
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

    // Open confirm modal helper
    const openConfirm = (title: string, desc: string, onConfirm: () => void, word = 'تأكيد', withPuzzle = false) => {
        setConfirmInput('');
        let puzzle, puzzleAnswer;
        if (withPuzzle) {
            const a = Math.floor(Math.random() * 9) + 1;
            const b = Math.floor(Math.random() * 9) + 1;
            puzzle = `${a} + ${b} = ?`;
            puzzleAnswer = String(a + b);
        }
        setConfirmModal({ open: true, title, desc, action: word, confirmWord: word, puzzle, puzzleAnswer, onConfirm });
    };
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, open: false }));
    const runConfirm = () => {
        const expected = confirmModal.puzzleAnswer || confirmModal.confirmWord;
        if (confirmInput.trim() !== expected) return;
        confirmModal.onConfirm();
        closeConfirm();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        saveLS(s);
        localStorage.setItem('erp_currencies', JSON.stringify(currencies));
        applyToDOM(s);
        // Persist key settings to DB
        setSyncing(true);
        await persistDB({
            invoicePrefix: s.salesPrefix,
            purchasePrefix: s.invoicePrefix,
            salesInvoiceCounter: String(parseInt(s.salesCounter) - 1),
            purchaseInvoiceCounter: String(parseInt(s.purchaseCounter) - 1),
            currency: s.currency,
            currencySymbol: s.currencySymbol,
            primaryColor: s.primaryColor,
            bgColor: s.bgColor,
            appName: s.appName,
            fontFamily: s.fontFamily,
            borderRadius: s.borderRadius,
            glassBg: s.glassBg,
            cardShadow: s.cardShadow,
            cardHoverShadow: s.cardHoverShadow,
        });
        setSyncing(false);
        await fetchDbCounters();
        await fetch('/api/settings/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ai_api_key: aiApiKey }) }).catch(() => console.error("Failed to save AI settings"));
        setSuccess('✅ تم حفظ الإعدادات وتزامنها مع قاعدة البيانات!');
        setTimeout(() => setSuccess(''), 4000);
    };

    const applyPreset = (p: any) => {
        setS(prev => ({
            ...prev,
            primaryColor: p.primary,
            bgColor: p.bg,
            sidebarBg: p.sidebar,
            sidebarActive: p.primary,
            sidebarText: p.text || (p.type === 'day' ? '#333' : '#fff'),
            cardBg: p.card || prev.cardBg,
            textColor: p.text || prev.textColor,
            textMuted: p.muted || prev.textMuted,
            btnText: p.btn || prev.btnText,
            borderRadius: p.radius || prev.borderRadius,
            glassBg: p.glassBg || prev.glassBg,
            cardShadow: p.shadow || 'none',
            cardHoverShadow: p.hoverShadow || '0 8px 32px rgba(0,0,0,0.4)',
            themeType: p.type,
        }));
        const root = document.documentElement;
        root.style.setProperty('--primary-color', p.primary);
        root.style.setProperty('--bg-color', p.bg);
        root.style.setProperty('--sidebar-bg', p.sidebar);
        root.style.setProperty('--sidebar-text', p.text || (p.type === 'day' ? '#333' : '#fff'));
        root.style.setProperty('--sidebar-active', p.primary);
        root.style.setProperty('--card-bg', p.card);
        root.style.setProperty('--text-primary', p.text);
        root.style.setProperty('--text-muted', p.muted);
        root.style.setProperty('--btn-text', p.btn);
        root.style.setProperty('--border-radius', (p.radius || '12') + 'px');
        root.style.setProperty('--card-shadow', p.shadow || 'none');
        root.style.setProperty('--card-hover-shadow', p.hoverShadow || '0 8px 32px rgba(0,0,0,0.4)');

        // Dynamic secondary background and button colors
        const isLight = p.bg === '#fbfbfb' || p.bg === '#ffffff' || p.type === 'day';
        root.style.setProperty('--btn-secondary-bg', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)');
        root.style.setProperty('--btn-secondary-text', isLight ? '#333' : '#ffffff');
        root.style.setProperty('--input-bg-glass', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)');

        // Handle Special Classes
        document.body.className = document.body.className.replace(/rgb-[a-z-]+|ramadan-theme/g, '').trim();
        if (p.type && p.type.startsWith('rgb')) document.body.classList.add(p.type === 'rgb' ? 'rgb-theme' : p.type);
        if (p.type === 'ramadan') document.body.classList.add('ramadan-theme');

        document.body.style.backgroundColor = p.bg;
        const panels = document.querySelectorAll('.glass-panel');
        panels.forEach((el: any) => el.style.background = p.card);

        // Update preference
        const uiprefs = JSON.parse(localStorage.getItem('erp_ui_prefs') || '{}');
        localStorage.setItem('erp_ui_prefs', JSON.stringify({ ...uiprefs, isRGB: p.type === 'rgb', isRamadan: p.type === 'ramadan' }));
    };
    // ─── Colors Section (redesigned) ────────────────────────────────────────────
    const ColorsSection = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* ── Section: Themes ── */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <button type="button" onClick={() => toggleSection('themes')}
                    style={{ width: '100%', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--btn-secondary-bg)', border: 'none', cursor: 'pointer', transition: '0.2s' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>🎭 مكتبة السيمزات (25 طابع)</h4>
                    <span style={{ transform: openSections.themes ? 'rotate(180deg)' : '0', transition: '0.3s', color: 'var(--text-primary)' }}>▼</span>
                </button>
                {openSections.themes && (
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                            {COLOR_PRESETS.map((p, i) => (
                                <button key={i} type="button" onClick={() => applyPreset(p)}
                                    style={{
                                        padding: '12px 10px',
                                        borderRadius: '14px',
                                        border: `2px solid ${s.themeType === p.type && s.primaryColor === p.primary ? p.primary : 'rgba(255,255,255,0.08)'}`,
                                        background: p.bg,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: s.themeType === p.type && s.primaryColor === p.primary ? `0 0 20px ${p.primary}33` : 'none',
                                        transform: s.themeType === p.type && s.primaryColor === p.primary ? 'scale(1.05)' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    title={`تطبيق سيما ${p.label}`}>
                                    {p.type.startsWith('rgb') && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000)', backgroundSize: '200% 100%', animation: 'rgb-line 2s linear infinite' }} />}
                                    {p.type === 'ramadan' && <div style={{ position: 'absolute', top: '2px', right: '4px', fontSize: '0.8rem' }}>🌙</div>}
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: p.primary, border: '2px solid rgba(255,255,255,0.2)' }} />
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: p.card || '#333', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </div>
                                    <span style={{ color: p.text || 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Section: Colors ── */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <button type="button" onClick={() => toggleSection('colors')}
                    style={{ width: '100%', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--btn-secondary-bg)', border: 'none', cursor: 'pointer' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>🎨 الألوان المتقدمة</h4>
                    <span style={{ transform: openSections.colors ? 'rotate(180deg)' : '0', transition: '0.3s', color: 'var(--text-primary)' }}>▼</span>
                </button>
                {openSections.colors && (
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="settings-grid-2">
                            {/* Primary Color Picker */}
                            <div className="color-control-group">
                                <label>🎨 اللون الأساسي للمنصة</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="color" className="color-dot" value={s.primaryColor} onChange={e => set('primaryColor', e.target.value)} />
                                    <input type="text" className="input-glass" value={s.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                                </div>
                            </div>
                            {/* Background Color Picker */}
                            <div className="color-control-group">
                                <label>🖼️ لون الخلفية العام</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="color" className="color-dot" value={s.bgColor} onChange={e => set('bgColor', e.target.value)} />
                                    <input type="text" className="input-glass" value={s.bgColor} onChange={e => set('bgColor', e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                                </div>
                            </div>
                            {/* Sidebar Background */}
                            <div className="color-control-group">
                                <label>📁 خلفية القائمة الجانبية</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="color" className="color-dot" value={s.sidebarBg.startsWith('rgb') ? '#111111' : s.sidebarBg} onChange={e => set('sidebarBg', e.target.value)} />
                                    <input type="text" className="input-glass" value={s.sidebarBg} onChange={e => set('sidebarBg', e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                                </div>
                            </div>
                            {/* Sidebar Text */}
                            <div className="color-control-group">
                                <label>✍️ لون نص القائمة</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="color" className="color-dot" value={s.sidebarText || 'var(--text-primary)'} onChange={e => set('sidebarText', e.target.value)} />
                                    <input type="text" className="input-glass" value={s.sidebarText || 'var(--text-primary)'} onChange={e => set('sidebarText', e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Section: Fonts ── */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <button type="button" onClick={() => toggleSection('fonts')}
                    style={{ width: '100%', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--btn-secondary-bg)', border: 'none', cursor: 'pointer' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>✒️ الخط والحجم</h4>
                    <span style={{ transform: openSections.fonts ? 'rotate(180deg)' : '0', transition: '0.3s', color: 'var(--text-primary)' }}>▼</span>
                </button>
                {openSections.fonts && (
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="settings-grid-2">
                            {/* Font Select */}
                            <div className="color-control-group">
                                <label>🔤 اختيار الخط (Font Family)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                                    {FONTS.map(f => (
                                        <button key={f.value} type="button" onClick={() => set('fontFamily', f.value)}
                                            style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${s.fontFamily === f.value ? s.primaryColor : 'var(--border-color)'}`, background: s.fontFamily === f.value ? s.primaryColor + '22' : 'var(--btn-secondary-bg)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: f.value }}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Font Size Slider */}
                            <div className="color-control-group">
                                <label>📏 حجم الكتابة الكلي: <span style={{ color: s.primaryColor }}>{s.fontSize}px</span></label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input type="range" min="12" max="22" value={s.fontSize} onChange={e => set('fontSize', e.target.value)} style={{ flex: 1, accentColor: s.primaryColor }} />
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => set('fontSize', '14')} className="btn-sm">صغير</button>
                                        <button type="button" onClick={() => set('fontSize', '16')} className="btn-sm">متوسط</button>
                                        <button type="button" onClick={() => set('fontSize', '18')} className="btn-sm">كبير</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Section: Layout ── */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <button type="button" onClick={() => toggleSection('layout')}
                    style={{ width: '100%', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--btn-secondary-bg)', border: 'none', cursor: 'pointer' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>⬡ التخطيط والحواف</h4>
                    <span style={{ transform: openSections.layout ? 'rotate(180deg)' : '0', transition: '0.3s', color: 'var(--text-primary)' }}>▼</span>
                </button>
                {openSections.layout && (
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="settings-grid-2">
                            {/* Border Radius */}
                            <div className="color-control-group">
                                <label>📐 زوايا الصناديق: <span style={{ color: s.primaryColor }}>{s.borderRadius}px</span></label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input type="range" min="0" max="40" value={s.borderRadius} onChange={e => set('borderRadius', e.target.value)} style={{ flex: 1, accentColor: s.primaryColor }} />
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => set('borderRadius', '0')} className="btn-sm">حاد</button>
                                        <button type="button" onClick={() => set('borderRadius', '12')} className="btn-sm">ناعم</button>
                                        <button type="button" onClick={() => set('borderRadius', '30')} className="btn-sm">دائري</button>
                                    </div>
                                </div>
                            </div>
                            {/* Glassmorphism Opacity */}
                            <div className="color-control-group">
                                <label>🧊 كثافة المظهر الزجاجي: <span style={{ color: s.primaryColor }}>{s.glassBg}%</span></label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input type="range" min="5" max="100" value={s.glassBg} onChange={e => set('glassBg', e.target.value)} style={{ flex: 1, accentColor: s.primaryColor }} />
                                    <div style={{ padding: '4px 10px', background: s.primaryColor + '33', borderRadius: '8px', fontSize: '0.8rem', color: s.primaryColor, fontWeight: 'bold' }}>شفافية</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes rgb-line {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 200% 0%; }
                }
                .color-control-group {
                    background: rgba(255,255,255,0.02);
                    padding: 15px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .color-control-group label {
                    display: block;
                    font-size: 0.85rem;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                    font-weight: 600;
                }
                .color-dot {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    border: 2px solid rgba(255,255,255,0.2);
                    cursor: pointer;
                    background: transparent;
                }
                .btn-sm {
                    padding: 5px 10px;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: var(--text-primary);
                    font-size: 0.7rem;
                    cursor: pointer;
                }
                .btn-sm:hover {
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );

    const tabStyle = (t: string) => ({
        padding: '8px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 as const, fontSize: '0.75rem',
        background: tab === t ? 'linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color), transparent 40%) 100%)' : 'transparent',
        color: tab === t ? 'var(--text-primary)' : '#919398',
        border: `1px solid ${tab === t ? 'transparent' : 'rgba(255,255,255,0.05)'}`,
        fontFamily: 'inherit',
        textAlign: 'right' as const,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        boxShadow: tab === t ? '0 4px 12px rgba(227, 94, 53, 0.2)' : 'none'
    });

    return (
        <div className="unified-container animate-fade-in">
            {/* ── Confirmation Modal ── */}
            {confirmModal.open && (
                <div className="confirm-overlay" role="dialog" aria-modal="true">
                    <div className="confirm-modal">
                        <h3>⚠️ {confirmModal.title}</h3>
                        <p>{confirmModal.desc}</p>
                        {confirmModal.puzzle ? (
                            <p style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center' }}>
                                <span style={{ color: '#aaa', display: 'block', fontSize: '0.8rem', marginBottom: '5px' }}>للمتابعة، حل المسألة الرقمية:</span>
                                <strong style={{ fontSize: '1.4rem', color: 'var(--primary-color)' }}>{confirmModal.puzzle}</strong>
                            </p>
                        ) : (
                            <p>اكتب كلمة <strong style={{ color: '#ff5252' }}>«{confirmModal.confirmWord}»</strong> لتأكيد العملية:</p>
                        )}
                        <input
                            id="confirm-word"
                            className="confirm-input"
                            type="text"
                            value={confirmInput}
                            onChange={e => setConfirmInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && runConfirm()}
                            placeholder={confirmModal.puzzle ? 'اكتب الإجابة هنا' : confirmModal.confirmWord}
                            autoFocus
                            title="اكتب كلمة التأكيد"
                            style={{ textAlign: 'center', fontSize: confirmModal.puzzle ? '1.5rem' : '1rem' }}
                        />
                        <div className="confirm-modal-actions">
                            <button type="button" className="btn-ghost" onClick={closeConfirm}>❌ إلغاء</button>
                            <button
                                type="button"
                                className="btn-nuclear"
                                onClick={runConfirm}
                                disabled={confirmInput.trim() !== (confirmModal.puzzleAnswer || confirmModal.confirmWord)}
                                style={{ flex: 1, opacity: confirmInput.trim() !== (confirmModal.puzzleAnswer || confirmModal.confirmWord) ? 0.4 : 1 }}
                            >
                                {confirmModal.action} • تأكيد نهائي
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="page-header">
                <div>
                    <h1 className="page-title">⚙️ الإعدادات والمظهر</h1>
                    <p className="page-subtitle">تخصيص هوية البرنامج وألوانه وترقيم الفواتير والعملة</p>
                </div>
            </header>

            {success && <div style={{ background: 'rgba(102,187,106,0.2)', color: '#66bb6a', padding: '14px', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1rem' }}>{success}</div>}

            <div className="reports-grid" style={{ alignItems: 'start', marginTop: '1rem' }}>
                <div className="glass-panel report-sidebar-menu" style={{ position: 'sticky', top: '10px', maxHeight: 'calc(100dvh - 100px)', overflowY: 'auto', flexBasis: '210px' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#919398', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>أقسام الإعدادات</h4>
                    <div className="report-sidebar-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button style={tabStyle('identity')} onClick={() => setTab('identity')}>🏭 هوية المؤسسة</button>
                        <button style={tabStyle('logos')} onClick={() => setTab('logos')}>🖼️ إدارة الشعارات والأختام</button>
                        <button style={tabStyle('colors')} onClick={() => setTab('colors')}>🎨 الألوان والمظهر</button>
                        <button style={tabStyle('invoices')} onClick={() => setTab('invoices')}>🧾 الفواتير والعملة</button>
                        <button onClick={() => setTab('stock')} type="button" style={{ ...tabStyle('stock'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>⚠️ تنبيهات المخزون</span>
                            {inventoryItems.filter(i => i.stock <= (stockAlerts[i.id] ?? 5)).length > 0 && (
                                <span style={{ background: '#E35E35', color: 'var(--text-primary)', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', display: 'inline-block' }}>
                                    {inventoryItems.filter(i => i.stock <= (stockAlerts[i.id] ?? 5)).length}
                                </span>
                            )}
                        </button>
                        <button style={tabStyle('display')} onClick={() => setTab('display')}>🖥️ تهيئة الواجهة</button>
                        <button style={tabStyle('ai')} onClick={() => setTab('ai')}>🤖 الربط الذكي</button>
                        <button style={tabStyle('danger')} onClick={() => setTab('danger')}>⚠️ متفرقات</button>
                    </div>
                </div>

                <div style={{ minWidth: 0 }}>
                    <form onSubmit={handleSave}>
                        {/* TAB: تهيئة الواجهة */}
                        {tab === 'display' && (
                            <div className="glass-panel" style={{ maxWidth: '1000px' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: s.primaryColor }}>🖥️ تهيئة الواجهة</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                    {/* Zoom */}
                                    <div className="glass-panel">
                                        <h4 style={{ margin: '0 0 12px', color: '#919398', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>1. مقياس الواجهة (Zoom)</h4>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {[80, 90, 100, 110].map(sc => (
                                                <button key={sc} type="button"
                                                    onClick={() => {
                                                        set('uiScale', String(sc));
                                                        document.documentElement.style.fontSize = `${sc}%`;
                                                        const p = JSON.parse(localStorage.getItem('erp_ui_prefs') || '{}');
                                                        localStorage.setItem('erp_ui_prefs', JSON.stringify({ ...p, scale: sc }));
                                                    }}
                                                    className={`btn-modern ${s.uiScale === String(sc) ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{ flex: 1, minWidth: '80px', padding: '8px 0', fontSize: '0.85rem' }}
                                                >
                                                    {sc === 110 && '🔍 مكبر'}{sc === 100 && '🎯 طبيعي'}{sc === 90 && '📉 مصغر'}{sc === 80 && '👓 محاسب'} ({sc}%)
                                                </button>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>تصغير الواجهة (90% أو 80%) يعطي مساحة هائلة على اللابتوب لعرض الجداول الكبيرة.</p>
                                    </div>

                                    {/* Layout */}
                                    <div className="glass-panel">
                                        <h4 style={{ margin: '0 0 12px', color: '#919398', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>2. نمط عرض المحتوى (Layout)</h4>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {[{ val: 'fluid', label: '↔️ كامل (Fluid)' }, { val: 'boxed', label: '🔲 محدود (Boxed)' }].map(l => (
                                                <button key={l.val} type="button"
                                                    onClick={() => {
                                                        set('uiLayout', l.val);
                                                        const p = JSON.parse(localStorage.getItem('erp_ui_prefs') || '{}');
                                                        localStorage.setItem('erp_ui_prefs', JSON.stringify({ ...p, layoutMode: l.val }));
                                                    }}
                                                    className={`btn-modern ${s.uiLayout === l.val ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{ flex: 1, padding: '10px 0' }}
                                                >{l.label}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="glass-panel">
                                        <h4 style={{ margin: '0 0 12px', color: '#919398', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>3. القائمة الجانبية (Sidebar)</h4>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {[{ val: 'false', label: '📌 تثبيت دائم' }, { val: 'true', label: '◀️ طي مصغر' }].map(opt => (
                                                <button key={opt.val} type="button"
                                                    onClick={() => {
                                                        set('uiSidebarCollapsed', opt.val);
                                                        const p = JSON.parse(localStorage.getItem('erp_ui_prefs') || '{}');
                                                        localStorage.setItem('erp_ui_prefs', JSON.stringify({ ...p, sidebarCollapsed: opt.val === 'true' }));
                                                    }}
                                                    className={`btn-modern ${s.uiSidebarCollapsed === opt.val ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{ flex: 1, padding: '10px 0' }}
                                                >{opt.label}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Force Desktop */}
                                    <div className="glass-panel">
                                        <h4 style={{ margin: '0 0 12px', color: '#919398', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>4. وضع سطح المكتب (للتابلت)</h4>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px' }}>
                                            <input type="checkbox"
                                                checked={s.uiForceDesktop === 'true'}
                                                onChange={e => {
                                                    set('uiForceDesktop', e.target.checked ? 'true' : 'false');
                                                    const p = JSON.parse(localStorage.getItem('erp_ui_prefs') || '{}');
                                                    localStorage.setItem('erp_ui_prefs', JSON.stringify({ ...p, forceDesktop: e.target.checked }));
                                                }}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                            />
                                            <div>
                                                <span style={{ fontWeight: 'bold', display: 'block' }}>إجبار العرض العريض (Force Desktop)</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>يجعل التابلت يعرض نسخة الكمبيوتر بدلاً من الجوال</span>
                                            </div>
                                        </label>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* TAB: الهوية */}
                        {tab === 'identity' && (
                            <div className="glass-panel" style={{ maxWidth: '1000px' }}>
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
                                        <label style={{ margin: 0, cursor: 'pointer', fontSize: '1rem', color: showLogoSettings ? s.primaryColor : 'var(--text-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                                        <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
                                                            📁 رفع صورة من الجهاز
                                                        </button>
                                                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} title="رفع صورة الشعار" aria-label="رفع صورة الشعار" />
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
                                                                color: s.logoShape === shape.key ? 'var(--text-primary)' : '#aaa',
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

                        {/* TAB: الربط والذكاء الاصطناعي */}
                        {tab === 'ai' && (
                            <div className="glass-panel" style={{ maxWidth: '1000px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '2.5rem' }}>🤖</div>
                                    <div>
                                        <h3 style={{ margin: '0', color: s.primaryColor }}>الربط والذكاء الاصطناعي</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#919398' }}>تكوين نموذج Gemini AI الذكي لقراءة الفواتير وتخصيص الربط.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label htmlFor="ai_api_key" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>مفتاح التطوير السري (Google Gemini API Key)</label>
                                        <div style={{ display: 'flex', position: 'relative' }}>
                                            <input
                                                id="ai_api_key"
                                                type={showAiKey ? 'text' : 'password'}
                                                className="input-glass"
                                                style={{ width: '100%', paddingRight: '45px', letterSpacing: !showAiKey && aiApiKey.length > 0 ? '3px' : 'normal' }}
                                                value={aiApiKey}
                                                onChange={e => setAiApiKey(e.target.value)}
                                                placeholder="AIzaSyAXXXXXXX_XXXXXXXXXX"
                                                title="أدخل مفتاح جوجل السري"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAiKey(!showAiKey)}
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '1.2rem' }}
                                                title={showAiKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                                            >
                                                {showAiKey ? '🙈' : '👁'}
                                            </button>
                                        </div>
                                        <p style={{ marginTop: '8px', fontSize: '0.75rem', color: '#ffb74d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>🔒</span> سيتم تشفير هذا المفتاح تلقائياً بمجرد ضغط (حفظ) ولن يظهر أو يُحفظ في سجلات التصفح.
                                        </p>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', fontSize: '0.85rem', color: '#ccc', lineHeight: 1.6 }}>
                                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>🚀 لماذا نحتاج المفتاح؟</strong>
                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                            <li>يُستخدم المفتاح لقراءة بيانات الفواتير والموردين والعموميات في ميزة "المدخل الذكي" عبر الكاميرا.</li>
                                            <li>الخدمة مدعومة من نماذج <span style={{ color: '#8ab4f8' }}>Google Gemini 2.5 Flash</span> للتعرف على النصوص (OCR) والصور بدقة 99%.</li>
                                            <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: s.primaryColor, textDecoration: 'underline' }}>اضغط هنا للحصول على مفتاح حسابك المجاني من Google AI Studio</a>.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: إدارة الشعارات والأختام */}
                        {tab === 'logos' && (
                            <div className="glass-panel" style={{ maxWidth: '1000px' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: s.primaryColor }}>🖼️ إدارة الشعارات والأختام</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                                    {/* Sidebar Logo */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ color: s.primaryColor, marginBottom: '10px', fontSize: '1.2rem' }}>1. لوجو الشريط الجانبي (Sidebar Logo)</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>هذا الشعار يظهر في القائمة الجانبية أعلى الشاشة.</p>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                            {s.appLogo ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={s.appLogo} alt="Logo" style={{ width: s.logoSize + 'px', height: s.logoSize + 'px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', borderRadius: s.logoShape === 'rounded' ? '12px' : s.logoShape === 'circle' ? '50%' : '0', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                    <button type="button" onClick={() => set('appLogo', '')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>✖</button>
                                                </div>
                                            ) : (
                                                <div style={{ width: s.logoSize + 'px', height: s.logoSize + 'px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#666' }}>🏭</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <input type="file" accept="image/*" title="اختر صورة الشعار" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (e) => set('appLogo', e.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} style={{ display: 'none' }} id="app-logo-upload" />
                                                <button type="button" onClick={() => document.getElementById('app-logo-upload')?.click()} className="btn-modern w-full py-2" style={{ background: s.primaryColor + '22', color: s.primaryColor, border: `1px solid ${s.primaryColor}44`, fontWeight: 'bold' }}>اختر صورة الشعار</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Print Logo */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ color: s.primaryColor, marginBottom: '10px', fontSize: '1.2rem' }}>2. لوجو الفواتير المطبوعة (Print Logo)</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>هذا الشعار يظهر في طباعة الفواتير والتقارير في القسم العلوي.</p>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                            {s.printLogo ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={s.printLogo} alt="Print Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                    <button type="button" onClick={() => set('printLogo', '')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>✖</button>
                                                </div>
                                            ) : (
                                                <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#666' }}>📄</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <input type="file" accept="image/*" title="رفع لوجو الطباعة" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (e) => set('printLogo', e.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} style={{ display: 'none' }} id="print-logo-upload" />
                                                <button type="button" onClick={() => document.getElementById('print-logo-upload')?.click()} className="btn-modern w-full py-2" style={{ background: s.primaryColor + '22', color: s.primaryColor, border: `1px solid ${s.primaryColor}44`, fontWeight: 'bold' }}>رفع لوجو الطباعة</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seal / Stamp Logo */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ color: s.primaryColor, marginBottom: '10px', fontSize: '1.2rem' }}>3. الختم الدائري (Seal / Stamp)</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>الختم المائي أو الدائري الذي يطبع في تذييل الفواتير.</p>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                            {s.sealLogo ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={s.sealLogo} alt="Seal" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.3)', opacity: parseInt(s.sealOpacity || '50') / 100 }} />
                                                    <button type="button" onClick={() => set('sealLogo', '')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>✖</button>
                                                </div>
                                            ) : (
                                                <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#666' }}>💮</div>
                                            )}

                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div>
                                                    <input type="file" accept="image/*" title="رفع صورة الختم" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (e) => set('sealLogo', e.target?.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} style={{ display: 'none' }} id="seal-logo-upload" />
                                                    <button type="button" onClick={() => document.getElementById('seal-logo-upload')?.click()} className="btn-modern w-full py-2" style={{ background: s.primaryColor + '22', color: s.primaryColor, border: `1px solid ${s.primaryColor}44`, fontWeight: 'bold' }}>رفع صورة الختم</button>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <label htmlFor="sealOpacity" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                        <span>شفافية الختم:</span>
                                                        <span style={{ color: s.primaryColor }}>{s.sealOpacity || '50'}%</span>
                                                    </label>
                                                    <input type="range" id="sealOpacity" min="10" max="100" step="5" value={s.sealOpacity || '50'} onChange={e => set('sealOpacity', e.target.value)} style={{ width: '100%', accentColor: s.primaryColor }} />
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <label htmlFor="sealPosition" style={{ fontSize: '0.9rem' }}>موضع الختم في الفاتورة</label>
                                                    <select id="sealPosition" className="input-glass w-full py-2 text-white" value={s.sealPosition || 'center'} onChange={e => set('sealPosition', e.target.value)}>
                                                        <option value="right">يمين (أسفل التوقيعات)</option>
                                                        <option value="center">الوسط (كعلامة مائية)</option>
                                                        <option value="left">يسار الفاتورة</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                        {tab === 'colors' && <ColorsSection />}

                        {/* TAB: الفواتير والعملة */}
                        {tab === 'invoices' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>

                                {/* ── Invoice Numbering ── */}
                                <div className="settings-grid-2" style={{ gap: '1.2rem' }}>
                                    {/* Purchases */}
                                    <div className="glass-panel">
                                        <h4 style={{ margin: '0 0 14px', color: '#29b6f6', fontSize: '0.85rem', fontWeight: 700 }}>🧾 ترقيم المشتريات</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>البادئة (Prefix)</label>
                                                <input id="pur_prefix" type="text" className="input-glass" value={s.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} placeholder="PUR" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>العداد الحالي</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input id="pur_count" type="number" className="input-glass" value={s.purchaseCounter} onChange={e => set('purchaseCounter', e.target.value)} min="1" title="الرقم التالي لفواتير المشتريات" placeholder="1" />
                                                    <button type="button" className="btn-danger btn-sm" onClick={() => set('purchaseCounter', '1')} title="تصفير العداد">↺</button>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(41,182,246,0.08)', border: '1px solid rgba(41,182,246,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#919398', marginBottom: '2px' }}>الفاتورة القادمة</div>
                                                <div style={{ color: '#29b6f6', fontWeight: 800, fontSize: '1rem' }}>{s.invoicePrefix}-{String(parseInt(s.purchaseCounter || '1')).padStart(4, '0')}</div>
                                                {dbCounters.purchaseNext && <div style={{ fontSize: '0.68rem', color: '#666', marginTop: '2px' }}>DB: {dbCounters.purchaseNext}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sales */}
                                    <div className="glass-panel">
                                        <h4 style={{ margin: '0 0 14px', color: '#66bb6a', fontSize: '0.85rem', fontWeight: 700 }}>🧾 ترقيم المبيعات</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>البادئة (Prefix)</label>
                                                <input id="sal_prefix" type="text" className="input-glass" value={s.salesPrefix} onChange={e => set('salesPrefix', e.target.value)} placeholder="INV" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>العداد الحالي</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input id="sal_count" type="number" className="input-glass" value={s.salesCounter} onChange={e => set('salesCounter', e.target.value)} min="1" title="الرقم التالي لفواتير المبيعات" placeholder="1" />
                                                    <button type="button" className="btn-danger btn-sm" onClick={() => set('salesCounter', '1')} title="تصفير العداد">↺</button>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(102,187,106,0.08)', border: '1px solid rgba(102,187,106,0.2)', borderRadius: '8px', padding: '8px 12px' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#919398', marginBottom: '2px' }}>الفاتورة القادمة</div>
                                                <div style={{ color: '#66bb6a', fontWeight: 800, fontSize: '1rem' }}>{s.salesPrefix}-{String(parseInt(s.salesCounter || '1')).padStart(4, '0')}</div>
                                                {dbCounters.salesNext && <div style={{ fontSize: '0.68rem', color: '#666', marginTop: '2px' }}>DB: {dbCounters.salesNext}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Currency ── */}
                                <div className="glass-panel">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <h4 style={{ margin: 0, color: '#ffa726', fontSize: '0.85rem', fontWeight: 700 }}>💱 العملة الافتراضية</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ background: 'var(--primary-color)', color: 'var(--text-primary)', borderRadius: '20px', padding: '3px 12px', fontWeight: 800, fontSize: '0.85rem' }}>{s.currencySymbol}</span>
                                            <span style={{ color: '#666', fontSize: '0.8rem' }}>{s.currency}</span>
                                        </div>
                                    </div>

                                    {/* Radio list */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                                        {currencies.map((c, i) => (
                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: s.currency === c.code ? 'rgba(var(--primary-rgb,227,94,53),0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.currency === c.code ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <input type="radio" name="currency" value={c.code} checked={s.currency === c.code} onChange={() => setS(prev => ({ ...prev, currency: c.code, currencySymbol: c.symbol }))} style={{ accentColor: 'var(--primary-color)', flexShrink: 0 }} />
                                                <span style={{ flex: 1, color: '#ccc', fontSize: '0.82rem' }}>{c.label}</span>
                                                {!CURRENCIES.find(b => b.code === c.code) && (
                                                    <button type="button" onClick={e => { e.preventDefault(); setCurrencies(prev => prev.filter(cur => cur.code !== c.code)); }} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: '0.75rem', padding: '0 2px' }} title="حذف">✕</button>
                                                )}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Add custom currency — collapsible */}
                                    <button type="button" onClick={() => setShowAddCurrency(v => !v)}
                                        style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.15)', color: '#666', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem', width: '100%', transition: 'all 0.2s' }}>
                                        {showAddCurrency ? '▲ إغلاق' : '➕ إضافة عملة مخصصة'}
                                    </button>
                                    {showAddCurrency && (
                                        <div className="settings-grid-currency">
                                            <div>
                                                <label style={{ fontSize: '0.72rem', color: '#919398', display: 'block', marginBottom: '4px' }}>الرمز</label>
                                                <input className="input-glass" value={newCurrency.code} onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })} placeholder="DZD" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.72rem', color: '#919398', display: 'block', marginBottom: '4px' }}>الاسم</label>
                                                <input className="input-glass" value={newCurrency.label} onChange={e => setNewCurrency({ ...newCurrency, label: e.target.value })} placeholder="دينار جزائري" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.72rem', color: '#919398', display: 'block', marginBottom: '4px' }}>العلامة</label>
                                                <input className="input-glass" value={newCurrency.symbol} onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })} placeholder="د.ج" />
                                            </div>
                                            <button type="button" className="btn-primary" onClick={() => { if (newCurrency.code && newCurrency.label && newCurrency.symbol) { setCurrencies(prev => [...prev, { ...newCurrency }]); setNewCurrency({ code: '', label: '', symbol: '' }); setShowAddCurrency(false); } }}>➕</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: متفرقات */}
                        {tab === 'danger' && (
                            <div className="misc-grid">

                                {/* ── Card 1: بيانات تسجيل الدخول ── */}
                                <div className="glass-panel">
                                    <h4 className="settings-section-label">🔑 بيانات تسجيل الدخول</h4>
                                    <div className="credentials-grid">
                                        <div>
                                            <label htmlFor="st_user" className="field-label">اسم المستخدم</label>
                                            <input id="st_user" type="text" className="input-glass" value={s.loginUsername} onChange={e => set('loginUsername', e.target.value)} placeholder="admin" title="اسم مستخدم المدير" />
                                        </div>
                                        <div>
                                            <label htmlFor="st_pass" className="field-label">كلمة المرور</label>
                                            <div className="pass-field-wrap">
                                                <input
                                                    id="st_pass"
                                                    type={showPass ? 'text' : 'password'}
                                                    className="input-glass"
                                                    value={s.loginPassword}
                                                    onChange={e => set('loginPassword', e.target.value)}
                                                    placeholder="••••••"
                                                    title="كلمة مرور المدير"
                                                />
                                                <button type="button" className="pass-eye-btn" onClick={() => setShowPass(!showPass)} title={showPass ? 'إخفاء' : 'إظهار'}>
                                                    {showPass ? '🙈' : '👁'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="field-hint">⚠️ اضغط على زر حفظ لتفعيل بيانات الدخول الجديدة</p>

                                    {/* ─ Logout */}
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                                        <p className="field-hint" style={{ marginBottom: '8px' }}>تسجيل الخروج يمسح الجلسة فقط — البيانات تبقى محفوظة.</p>
                                        <button type="button" className="logout-btn" onClick={() => {
                                            localStorage.removeItem('erp_logged_in');
                                            localStorage.removeItem('erp_login_time');
                                            window.location.href = '/login';
                                        }}>🚪 تسجيل الخروج الآن</button>
                                        <button type="button" className="btn-ghost" style={{ marginTop: '8px' }} onClick={() => {
                                            localStorage.removeItem(KEY);
                                            window.location.reload();
                                        }}>🔄 إعادة تعيين المظهر الافتراضي</button>
                                    </div>
                                </div>

                                {/* ── Danger Zone Card in Misc ── */}
                                <div className="glass-panel">
                                    <div className="danger-zone-header">
                                        <span>🔥</span>
                                        <h4>منطقة الحذف النهائي</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className="btn-outline-danger"
                                            onClick={() => openConfirm(
                                                'حذف بيانات العملاء',
                                                'سيتم حذف جميع بيانات العملاء وحركاتهم المالية نهائياً ولا يمكن التراجع عنه.',
                                                () => handleMaintenance('clients')
                                            )}
                                        >
                                            🗑️ حذف جميع بيانات العملاء
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-outline-danger"
                                            onClick={() => openConfirm(
                                                'حذف المنتجات',
                                                'سيتم حذف جميع المنتجات والموديلات من الكتالوج نهائياً.',
                                                () => handleMaintenance('products')
                                            )}
                                        >
                                            🗑️ حذف جميع المنتجات والموديلات
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-nuclear"
                                            onClick={() => openConfirm(
                                                'تصفير قاعدة البيانات بالكامل',
                                                'سيتم حذف كافة البيانات (عملاء، منتجات، مخزن، فواتير، خزينة) وإعادة ضبط المصنع. لا يمكن التراجع عن هذه العملية.',
                                                () => handleMaintenance('all'),
                                                'تصفير',
                                                true
                                            )}
                                        >
                                            🔥 تصفير قاعدة البيانات (إعادة ضبط المصنع)
                                        </button>
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
                                                                style={{ width: '90px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${isLow ? '#E35E35' : 'rgba(255,255,255,0.15)'}`, color: 'var(--text-primary)', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', background: isLow ? 'rgba(227,94,53,0.2)' : 'rgba(102,187,106,0.15)', color: isLow ? '#E35E35' : '#66bb6a' }}>
                                                                {isLow ? <><AlertTriangle size={14} /> منخفض</> : <><CheckCircle size={14} /> طبيعي</>}
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

                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1rem', minWidth: '250px' }} disabled={syncing}>
                                {syncing ? '🔄 جاري التزامن مع قاعدة البيانات...' : '💾 حفظ جميع الإعدادات وتطبيقها'}
                            </button>
                            {dbCounters.salesNext && <span style={{ fontSize: '0.78rem', color: '#555' }}>آخر تزامن: DB ✅</span>}
                        </div>
                    </form>
                </div>
            </div>
            <style jsx>{`
                @media (max-width: 900px) {
                    .reports-grid {
                        flex-direction: column !important;
                    }
                    .report-sidebar-menu {
                        flex: none !important;
                        width: 100% !important;
                        position: relative !important;
                        top: 0 !important;
                        margin-bottom: 1rem;
                    }
                    .report-sidebar-list {
                        display: grid !important;
                        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                        gap: 10px !important;
                    }
                }
                .settings-grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .settings-grid-currency {
                    display: grid;
                    grid-template-columns: 1fr 2fr 1fr auto;
                    gap: 8px;
                    margin-top: 10px;
                    align-items: end;
                }
                @media (max-width: 768px) {
                    .settings-grid-2 {
                        grid-template-columns: 1fr !important;
                    }
                    .settings-grid-currency {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }
                @media (max-width: 480px) {
                    .settings-grid-currency {
                        grid-template-columns: 1fr !important;
                        align-items: stretch !important;
                    }
                }
            `}</style>

            <style jsx global>{`
                /* ─── RGB Neom Theme Animation ─── */
                .rgb-theme :root {
                    --primary-color: #00ffcc;
                }
                .rgb-theme {
                    background: #050505 !important;
                }
                .rgb-theme .glass-panel, .rgb-theme .unified-container {
                    border-color: rgba(0, 255, 204, 0.2) !important;
                    box-shadow: 0 0 15px rgba(0, 255, 204, 0.1);
                    animation: border-rgb-pulse 5s infinite alternate;
                }
                @keyframes border-rgb-pulse {
                    0% { border-color: rgba(0, 255, 204, 0.2); box-shadow: 0 0 10px rgba(0,255,204,0.1); }
                    50% { border-color: rgba(243, 0, 255, 0.4); box-shadow: 0 0 20px rgba(243,0,255,0.2); }
                    100% { border-color: rgba(0, 112, 243, 0.2); box-shadow: 0 0 10px rgba(0,112,243,0.1); }
                }

                /* ─── Ramadan Theme ─── */
                .ramadan-theme::before {
                    content: '🌙 ✨ 🕌 ✨ ⭐️';
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 2rem;
                    z-index: 10000;
                    opacity: 0.8;
                    pointer-events: none;
                    text-shadow: 0 0 10px orange;
                    animation: ramadan-float 3s ease-in-out infinite;
                }
                @keyframes ramadan-float {
                    0%, 100% { transform: translate(-50%, 0); }
                    50% { transform: translate(-50%, -10px); }
                }
                .ramadan-theme {
                    background-image: 
                        radial-gradient(circle at 10% 20%, rgba(255,215,0,0.05) 0%, transparent 10%),
                        radial-gradient(circle at 90% 80%, rgba(255,215,0,0.05) 0%, transparent 10%) !important;
                }
                .ramadan-theme .page-title::after {
                    content: ' 🌙';
                    color: #ffd700;
                }
                .ramadan-theme .glass-panel {
                    border: 1px solid rgba(255, 215, 0, 0.2) !important;
                    background: rgba(15, 25, 45, 0.8) !important;
                }
                .ramadan-theme .btn-primary {
                    background: linear-gradient(135deg, #ffd700, #b8860b) !important;
                    color: #0d0d0d !important;
                    font-weight: 800;
                }
            `}</style>
        </div>
    );
}

