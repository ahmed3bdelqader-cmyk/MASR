'use client';
import React, { useEffect, useState, useRef } from 'react';

// ─── Shared Configurations ───────────────────────────────────────────────
function getSettings() {
    try { return JSON.parse(localStorage.getItem('erp_settings') || '{}'); } catch { return {}; }
}

const SOCIAL_PLATFORMS = [
    { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', defaultIcon: '📞', placeholder: 'رقم الهاتف (2010...+) أو الرابط' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2', defaultIcon: 'f', placeholder: 'اسم الصفحة (مثل: stand.masr) أو الرابط' },
    { key: 'instagram', label: 'Instagram', color: '#E4405F', defaultIcon: '📸', placeholder: 'اسم الحساب (username) أو الرابط' },
    { key: 'youtube', label: 'YouTube', color: '#FF0000', defaultIcon: '▶', placeholder: 'معرف القناة أو الرابط' },
    { key: 'tiktok', label: 'TikTok', color: '#2D2D2D', defaultIcon: '♪', placeholder: 'اسم الحساب أو الرابط' },
    { key: 'pinterest', label: 'Pinterest', color: '#E60023', defaultIcon: 'P', placeholder: 'اسم الحساب أو الرابط' },
    { key: 'website', label: 'الموقع', color: '#29b6f6', defaultIcon: '🌐', placeholder: 'example.com أو الرابط' },
] as const;

const formatSocialUrl = (key: string, value: string) => {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;

    const prefixes: Record<string, string> = {
        whatsapp: 'https://wa.me/',
        facebook: 'https://facebook.com/',
        instagram: 'https://instagram.com/',
        youtube: 'https://youtube.com/',
        tiktok: 'https://tiktok.com/@', // TikTok usually formats like /@username
        pinterest: 'https://pinterest.com/',
        website: 'https://'
    };

    if (key === 'tiktok' && value.startsWith('@')) return `https://tiktok.com/${value}`;
    if (key === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`; // clean numbers
    return (prefixes[key] || 'https://') + value;
};

const AccordionItem = ({ title, isActive, onToggle, accentColor, children }: { title: string, isActive: boolean, onToggle: () => void, accentColor: string, children: React.ReactNode }) => {
    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? accentColor : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', marginBottom: '10px', overflow: 'hidden', transition: '0.3s' }}>
            <div onClick={onToggle} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isActive ? `${accentColor}11` : 'transparent' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: isActive ? accentColor : '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem', color: isActive ? accentColor : '#888' }}>{isActive ? '📂' : '📁'}</span>
                    {title}
                </h3>
                <span style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', color: isActive ? accentColor : '#888' }}>▼</span>
            </div>
            {isActive && (
                <div className="animate-fade-in" style={{ padding: '16px', borderTop: `1px solid rgba(255,255,255,0.05)` }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default function CombinedDesignerPage() {
    const [salesData, setSalesData] = useState<any[]>([]);
    const [jobsData, setJobsData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [treasuryData, setTreasuryData] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Accordion State
    const [activeSection, setActiveSection] = useState('general');

    // Unified Configuration State
    const [config, setConfig] = useState<any>({
        reportType: 'sales',
        title: 'تقرير مبيعات',
        subtitle: '',
        orientation: 'portrait',
        fontSize: '12',
        titleFontSize: '28',
        accentColor: '#E35E35',

        // Header
        companyName: '', companySubtitle: '', companyAddress: '',
        companyPhone: '', companyPhone2: '', companyEmail: '',
        companyTax: '', companyCommercial: '',
        showLogo: true, logoPosition: 'right', printLogoSize: '70', printLogoCustom: '',
        companyNameFontSize: '24', companySubtitleFontSize: '14',

        // Settings Table & Data
        showDate: true, showTable: true,
        columns: { invoiceNo: true, client: true, date: true, total: true, status: true },

        // Client Box (Mainly for invoices)
        showClientBox: true, showClientName: true, showClientPhone: true,
        showClientPhone2: false, showClientAddress: true, showClientEmail: false, showClientStoreName: false,

        // Footer & Social
        showFooter: true, footerText: 'شكراً لتعاملكم معنا', footerAlign: 'center', socialAlign: 'center', footerFontSize: '14',
        whatsapp: '', facebook: '', instagram: '', youtube: '', tiktok: '', pinterest: '', website: '',
        customPlatforms: '[]'
    });

    const [successMsg, setSuccessMsg] = useState('');
    const iconRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const sym = (() => { try { return getSettings().currencySymbol || 'ج.م'; } catch { return 'ج.م'; } })();
    const appLogo = (() => { try { return getSettings().appLogo || ''; } catch { return ''; } })();

    useEffect(() => {
        // Load Live Data
        Promise.all([
            fetch('/api/sales').then(r => r.json()).catch(() => []),
            fetch('/api/jobs').then(r => r.json()).catch(() => []),
            fetch('/api/inventory').then(r => r.json()).catch(() => []),
            fetch('/api/treasury').then(r => r.json()).catch(() => []),
        ]).then(([s, j, inv, t]) => {
            setSalesData(Array.isArray(s) ? s.slice(0, 5) : []);
            setJobsData(Array.isArray(j) ? j.slice(0, 5) : []);
            setInventoryData(Array.isArray(inv) ? inv.filter((i: any) => i.category !== 'MANUFACTURED_PRICING').slice(0, 5) : []);
            setTreasuryData(Array.isArray(t) ? t.slice(0, 5) : []);
            setLoaded(true);
        });

        // Load Saved Configuration (Unified)
        try {
            const saved = localStorage.getItem('erp_unified_report_config');
            const s = getSettings();
            if (saved) {
                setConfig((prev: any) => ({ ...prev, ...JSON.parse(saved) }));
            } else {
                setConfig((prev: any) => ({ ...prev, companyName: s.appName || '', accentColor: s.primaryColor || '#E35E35' }));
            }
        } catch { }
    }, []);

    const setT = (k: string, v: any) => setConfig((prev: any) => ({ ...prev, [k]: v }));

    const saveConfig = () => {
        localStorage.setItem('erp_unified_report_config', JSON.stringify(config));
        setSuccessMsg('✅ تم حفظ كافة إعدادات التقارير والفواتير بنجاح!');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const loadIconFile = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = ev => setT(`${key}_icon`, ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // ─── Data Handlers ──────────────────────────────
    const getPreviewData = () => {
        if (config.reportType === 'sales') return salesData;
        if (config.reportType === 'jobs') return jobsData;
        if (config.reportType === 'inventory') return inventoryData;
        if (config.reportType === 'treasury') return treasuryData;
        return [];
    };

    const getColumns = () => {
        if (config.reportType === 'sales') return [
            { key: 'invoiceNo', label: 'الرقم', enabled: config.columns.invoiceNo !== false },
            { key: 'client', label: 'العميل', enabled: config.columns.client !== false },
            { key: 'date', label: 'التاريخ', enabled: config.columns.date !== false },
            { key: 'total', label: 'الإجمالي', enabled: config.columns.total !== false },
            { key: 'status', label: 'الحالة', enabled: config.columns.status !== false },
        ].filter(c => c.enabled);
        if (config.reportType === 'jobs') return ['اسم الشغلانة', 'العميل', 'الحالة', 'تكلفة الخامات', 'صافي الربح'].map(l => ({ key: l, label: l, enabled: true }));
        if (config.reportType === 'inventory') return ['الصنف', 'النوع', 'الكمية', 'سعر الوحدة', 'القيمة'].map(l => ({ key: l, label: l, enabled: true }));
        if (config.reportType === 'treasury') return ['البيان', 'النوع', 'المبلغ', 'التاريخ'].map(l => ({ key: l, label: l, enabled: true }));
        return [];
    };

    const getCellValue = (item: any, colKey: string) => {
        if (config.reportType === 'sales') {
            if (colKey === 'invoiceNo') return item.invoiceNo || '-';
            if (colKey === 'client') return item.client?.name || '-';
            if (colKey === 'date') return new Date(item.createdAt).toLocaleDateString('ar-EG');
            if (colKey === 'total') return `${item.total?.toFixed(0)} ${sym}`;
            if (colKey === 'status') return item.status === 'PAID' ? 'مدفوعة' : item.status === 'PARTIAL' ? 'جزئي' : 'غير مدفوعة';
        }
        if (config.reportType === 'jobs') {
            if (colKey === 'اسم الشغلانة') return item.name;
            if (colKey === 'العميل') return item.client?.name || '-';
            if (colKey === 'الحالة') return item.status === 'COMPLETED' ? 'مكتملة' : 'جارية';
            if (colKey === 'تكلفة الخامات') return `${item.totalMaterialCost?.toFixed(0)} ${sym}`;
            if (colKey === 'صافي الربح') return `${(item.netProfit || 0).toFixed(0)} ${sym}`;
        }
        if (config.reportType === 'inventory') {
            if (colKey === 'الصنف') return item.name;
            if (colKey === 'النوع') return item.type === 'MATERIAL' ? 'خامة' : 'منتج';
            if (colKey === 'الكمية') return `${item.stock.toFixed(0)} ${item.unit}`;
            if (colKey === 'سعر الوحدة') return `${item.lastPurchasedPrice?.toFixed(0)} ${sym}`;
            if (colKey === 'القيمة') return `${(item.stock * (item.lastPurchasedPrice || 0)).toFixed(0)} ${sym}`;
        }
        if (config.reportType === 'treasury') {
            if (colKey === 'البيان') return item.description;
            if (colKey === 'النوع') return item.type === 'IN' ? 'إيداع/مقبوضات' : 'سحب/مدفوعات';
            if (colKey === 'المبلغ') return `${item.amount?.toFixed(0)} ${sym}`;
            if (colKey === 'التاريخ') return new Date(item.createdAt).toLocaleDateString('ar-EG');
        }
        return '-';
    };

    // ─── Print HTML Generator ────────────────────────
    const printReport = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const data = getPreviewData();
        const cols = getColumns();
        const colsHtml = cols.map(c => `<th style="background:${config.accentColor};color:#fff;padding:8px;text-align:right">${c.label}</th>`).join('');
        const rowsHtml = data.map((item, i) =>
            `<tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
                <td style="text-align:center;padding:8px;border-bottom:1px solid #eee;color:#888">${i + 1}</td>
                ${cols.map(c => `<td style="padding:8px;border-bottom:1px solid #eee">${getCellValue(item, c.key)}</td>`).join('')}
            </tr>`
        ).join('');

        let customPlatforms: any[] = [];
        try { customPlatforms = JSON.parse(config.customPlatforms || '[]'); } catch { }
        const allPlatforms = [...SOCIAL_PLATFORMS, ...customPlatforms];
        const activePlatforms = allPlatforms.filter((p: any) => !!config[p.key] && config[`${p.key}_show`] !== false);

        const socialHtml = activePlatforms.map((p: any) => {
            const customIcon = config[`${p.key}_icon`];
            const iconContent = customIcon ? `<img src="${customIcon}" style="width:100%;height:100%;object-fit:contain" />` : `<span style="color:#fff;font-weight:bold">${p.defaultIcon}</span>`;
            const finalUrl = formatSocialUrl(p.key, config[p.key]);
            return `<a href="${finalUrl}" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;background:${customIcon ? 'transparent' : p.color};border-radius:4px;margin:0 4px;text-decoration:none">${iconContent}</a>`;
        }).join('');

        // Client Info (If enabled and applicable)
        let clientHtml = '';
        if (config.showClientBox && config.reportType === 'sales') {
            clientHtml = `
            <div style="border:1px solid #ddd;border-radius:8px;padding:12px;margin:16px 0;background:#fafafa">
                <h3 style="margin:0 0 10px;font-size:1rem;color:${config.accentColor}">بيانات العميل</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.9rem">
                    ${config.showClientName ? `<div><strong>اسم العميل:</strong> عميل افتراضي للطباعة</div>` : ''}
                    ${config.showClientStoreName ? `<div><strong>اسم الشركة/المحل:</strong> مؤسسة الأمل</div>` : ''}
                    ${config.showClientPhone ? `<div><strong>الهاتف:</strong> 01000000000</div>` : ''}
                    ${config.showClientAddress ? `<div><strong>العنوان:</strong> القاهرة، مصر</div>` : ''}
                </div>
            </div>`;
        }

        win.document.write(`<html dir="rtl"><head><title>${config.title}</title><style>
            @page{size:A4 ${config.orientation};margin:12mm}*{box-sizing:border-box}
            body{font-family:Tahoma,Arial,sans-serif;color:#222;font-size:${config.fontSize}px;margin:0}
            .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        </style></head><body onload="window.print()">
            
            <!-- HEADER -->
            <div style="border-bottom:3px solid ${config.accentColor};padding-bottom:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
                <div style="flex:1;text-align:right">
                    <h2 style="margin:0;color:${config.accentColor};font-size:${config.companyNameFontSize || 24}px">${config.companyName || 'اسم الشركة'}</h2>
                    ${config.companySubtitle ? `<p style="margin:4px 0 0;color:#666;font-size:${config.companySubtitleFontSize || 14}px">${config.companySubtitle}</p>` : ''}
                    <div style="margin-top:8px;font-size:0.85rem;color:#555">
                        ${config.companyAddress ? `<div>📍 ${config.companyAddress}</div>` : ''}
                        ${config.companyPhone ? `<div>📞 ${config.companyPhone} ${config.companyPhone2 ? ` | ${config.companyPhone2}` : ''}</div>` : ''}
                        ${config.companyTax ? `<div>📄 ضريبي: ${config.companyTax} ${config.companyCommercial ? ` | س.ت: ${config.companyCommercial}` : ''}</div>` : ''}
                    </div>
                </div>
                <div style="flex:1;text-align:center">
                    <h1 style="margin:0;font-size:${config.titleFontSize || 28}px">${config.title}</h1>
                    ${config.subtitle ? `<h3 style="margin:4px 0 0;color:#666">${config.subtitle}</h3>` : ''}
                    ${config.showDate ? `<p style="margin:8px 0 0;color:#888;font-size:0.85rem">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>` : ''}
                </div>
                <div style="flex:1;text-align:left">
                    ${config.showLogo && (config.printLogoCustom || appLogo) ? `<img src="${config.printLogoCustom || appLogo}" style="max-width:${config.printLogoSize || 70}px;max-height:${config.printLogoSize || 70}px;object-fit:contain" />` : ''}
                </div>
            </div>

            ${clientHtml}

            <!-- DATA TABLE -->
            ${config.showTable ? `
                <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:0.9rem">
                    <thead><tr><th style="background:${config.accentColor};color:#fff;padding:8px;text-align:center">#</th>${colsHtml}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            ` : ''}

            <!-- FOOTER -->
            ${config.showFooter ? `
                <div style="margin-top:30px;padding-top:16px;border-top:1px solid #ddd;text-align:${config.footerAlign};font-size:0.9rem;color:#555">
                    <div style="margin-bottom:12px;font-size:${config.footerFontSize || 14}px">${config.footerText}</div>
                    <div style="text-align:${config.socialAlign}">${socialHtml}</div>
                </div>
            ` : ''}
        </body></html>`);
        win.document.close();
    };



    return (
        <div className="animate-fade-in" style={{ margin: '-1rem', width: 'calc(100% + 2rem)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '1.6rem' }}>🎨 مصمم التقارير والقوالب الشامل</h1>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>مكان واحد للتحكم في أشكال الجداول، بيانات الشركة أعلى الطباعة، السوشيال ميديا وتذييل العقود والفواتير.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={saveConfig} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', background: '#66bb6a' }}>💾 حفظ الإعدادات</button>
                    <button onClick={printReport} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', background: '#29b6f6' }}>🖨 طباعة / تصدير PDF</button>
                </div>
            </header>

            {successMsg && <div style={{ background: 'rgba(102,187,106,0.15)', color: '#66bb6a', padding: '14px', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 'bold', border: '1px solid #66bb6a55' }}>{successMsg}</div>}

            <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0, width: '100%' }}>

                {/* ─── LEFT PANEL: SETTINGS ACCORDION ───────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: '4', overflowY: 'auto', paddingRight: '5px' }}>

                    <AccordionItem title="إعدادات التقرير الأساسية" isActive={activeSection === 'general'} onToggle={() => setActiveSection(activeSection === 'general' ? '' : 'general')} accentColor={config.accentColor}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ color: '#ccc', fontSize: '0.85rem' }}>اختر نوع التقرير / المستند</label>
                                <select className="input-glass" value={config.reportType} onChange={e => {
                                    const type = e.target.value;
                                    setT('reportType', type);
                                    if (type === 'sales') setT('title', 'فاتورة مبيعات');
                                    else if (type === 'jobs') setT('title', 'تقرير أمر تشغيل');
                                    else if (type === 'inventory') setT('title', 'جرد المخزون');
                                    else if (type === 'treasury') setT('title', 'كشف حساب خزينة');
                                }}>
                                    <option value="sales">🧾 فواتير المبيعات / كشوف حساب العملاء</option>
                                    <option value="jobs">🏭 أوامر التصنيع والتشغيل</option>
                                    <option value="inventory">📦 المخازن والمواد</option>
                                    <option value="treasury">🏦 الخزينة والمصروفات</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ color: '#ccc', fontSize: '0.85rem' }}>عنوان التقرير</label>
                                <input type="text" className="input-glass" value={config.title} onChange={e => setT('title', e.target.value)} />
                            </div>
                            <div>
                                <label style={{ color: '#ccc', fontSize: '0.85rem' }}>عنوان فرعي (اختياري)</label>
                                <input type="text" className="input-glass" value={config.subtitle} onChange={e => setT('subtitle', e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.85rem' }}>حجم خط الجدول (px)</label>
                                    <input type="number" min="8" max="18" className="input-glass" value={config.fontSize} onChange={e => setT('fontSize', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.85rem' }}>حجم خط العنوان (px)</label>
                                    <input type="number" min="14" max="48" className="input-glass" value={config.titleFontSize || '28'} onChange={e => setT('titleFontSize', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.85rem' }}>اتجاه الصفحة</label>
                                    <select className="input-glass" value={config.orientation} onChange={e => setT('orientation', e.target.value)}>
                                        <option value="portrait">عمودي</option>
                                        <option value="landscape">أفقي</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#ccc', fontSize: '0.85rem' }}>لون القالب والتمييز</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                    <input type="color" value={config.accentColor} onChange={e => setT('accentColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                                    <input type="text" className="input-glass" value={config.accentColor} onChange={e => setT('accentColor', e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                                </div>
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem title="رأس الصفحة وشعار الشركة" isActive={activeSection === 'header'} onToggle={() => setActiveSection(activeSection === 'header' ? '' : 'header')} accentColor={config.accentColor}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>اسم الشركة الرسمية</label>
                                    <input type="text" className="input-glass" style={{ width: '100%' }} value={config.companyName} onChange={e => setT('companyName', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>حجم الخط</label>
                                    <input type="number" min="14" max="48" className="input-glass" style={{ width: '100%' }} value={config.companyNameFontSize || '24'} onChange={e => setT('companyNameFontSize', e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>شعار وصفي / نشاط الشركة</label>
                                    <input type="text" className="input-glass" style={{ width: '100%' }} value={config.companySubtitle} onChange={e => setT('companySubtitle', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>حجم الخط</label>
                                    <input type="number" min="10" max="32" className="input-glass" style={{ width: '100%' }} value={config.companySubtitleFontSize || '14'} onChange={e => setT('companySubtitleFontSize', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>العنوان</label>
                                <input type="text" className="input-glass" value={config.companyAddress} onChange={e => setT('companyAddress', e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input type="text" className="input-glass" placeholder="تليفون 1" value={config.companyPhone} onChange={e => setT('companyPhone', e.target.value)} />
                                <input type="text" className="input-glass" placeholder="تليفون 2" value={config.companyPhone2} onChange={e => setT('companyPhone2', e.target.value)} />
                                <input type="text" className="input-glass" placeholder="سجل تجاري" value={config.companyCommercial} onChange={e => setT('companyCommercial', e.target.value)} />
                                <input type="text" className="input-glass" placeholder="بطاقة ضريبية" value={config.companyTax} onChange={e => setT('companyTax', e.target.value)} />
                            </div>

                            <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: config.showLogo ? '10px' : '0' }}>
                                    <input type="checkbox" checked={config.showLogo} onChange={e => setT('showLogo', e.target.checked)} style={{ accentColor: config.accentColor }} />
                                    <span>إظهار شعار الشركة في الطباعة</span>
                                </label>
                                {config.showLogo && (
                                    <>
                                        <div>
                                            <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>حجم الشعار في الطباعة (px)</label>
                                            <input type="number" min="30" max="250" className="input-glass" value={config.printLogoSize || '70'} onChange={e => setT('printLogoSize', e.target.value)} />
                                        </div>
                                        <div style={{ marginTop: '10px' }}>
                                            <label style={{ fontSize: '0.8rem', color: '#aaa' }}>شعار مخصص للطباعة (يغني عن الشعار الأساسي)</label>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                                <label style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(41,182,246,0.1)', color: '#29b6f6', borderRadius: '6px', cursor: 'pointer', border: '1px solid #29b6f655' }}>
                                                    رفع صورة <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                                        const f = e.target.files?.[0]; if (!f) return;
                                                        const r = new FileReader(); r.onload = ev => setT('printLogoCustom', ev.target?.result as string); r.readAsDataURL(f);
                                                    }} />
                                                </label>
                                                {config.printLogoCustom && <button onClick={() => setT('printLogoCustom', '')} style={{ padding: '8px 12px', background: 'transparent', color: '#E35E35', border: '1px solid #E35E3555', borderRadius: '6px' }}>حذف</button>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem title="خيارات العرض والأعمدة" isActive={activeSection === 'display'} onToggle={() => setActiveSection(activeSection === 'display' ? '' : 'display')} accentColor={config.accentColor}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={config.showDate} onChange={e => setT('showDate', e.target.checked)} style={{ accentColor: config.accentColor }} /> <span>إظهار تاريخ طباعة المستند</span></label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={config.showTable} onChange={e => setT('showTable', e.target.checked)} style={{ accentColor: config.accentColor }} /> <span>إظهار جدول البيانات الرئيسي</span></label>

                            {config.reportType === 'sales' && (
                                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <p style={{ margin: '0 0 10px', color: '#aaa', fontSize: '0.85rem' }}>الأعمدة المرئية لفواتير المبيعات:</p>
                                    {Object.entries({ invoiceNo: 'الرقم', client: 'العميل', date: 'التاريخ', total: 'الإجمالي', status: 'الحالة' }).map(([k, v]) => (
                                        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '6px' }}>
                                            <input type="checkbox" checked={config.columns[k] !== false} onChange={e => setT('columns', { ...config.columns, [k]: e.target.checked })} style={{ accentColor: config.accentColor }} />
                                            <span style={{ fontSize: '0.85rem' }}>{v}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {config.reportType === 'sales' && (
                                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: config.accentColor, fontWeight: 'bold' }}><input type="checkbox" checked={config.showClientBox} onChange={e => setT('showClientBox', e.target.checked)} style={{ accentColor: config.accentColor }} /> إظهار صندوق بيانات العميل</label>
                                    {config.showClientBox && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                                            {[
                                                { key: 'showClientName', label: 'الاسم' }, { key: 'showClientStoreName', label: 'اسم المحل' },
                                                { key: 'showClientPhone', label: 'الهاتف' }, { key: 'showClientAddress', label: 'العنوان' }
                                            ].map(f => (
                                                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={config[f.key]} onChange={e => setT(f.key, e.target.checked)} style={{ accentColor: config.accentColor }} /> {f.label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </AccordionItem>

                    <AccordionItem title="التذييل وروابط التواصل (السوشيال)" isActive={activeSection === 'footer'} onToggle={() => setActiveSection(activeSection === 'footer' ? '' : 'footer')} accentColor={config.accentColor}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={config.showFooter} onChange={e => setT('showFooter', e.target.checked)} style={{ accentColor: config.accentColor }} /> <span>تفعيل التذييل (Footer)</span></label>

                            {config.showFooter && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
                                        <div>
                                            <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>نص ترحيبي / ملاحظة</label>
                                            <input type="text" className="input-glass" style={{ width: '100%' }} value={config.footerText} onChange={e => setT('footerText', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '4px', display: 'block' }}>حجم الخط</label>
                                            <input type="number" min="10" max="32" className="input-glass" style={{ width: '100%' }} value={config.footerFontSize || '14'} onChange={e => setT('footerFontSize', e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <select title="محاذاة النص" className="input-glass" value={config.footerAlign} onChange={e => setT('footerAlign', e.target.value)}>
                                            <option value="right">نص يمين</option><option value="center">نص بالمنتصف</option><option value="left">نص يسار</option>
                                        </select>
                                        <select title="محاذاة السوشيال" className="input-glass" value={config.socialAlign} onChange={e => setT('socialAlign', e.target.value)}>
                                            <option value="right">أيقونات يمين</option><option value="center">أيقونات بالمنتصف</option><option value="left">أيقونات يسار</option>
                                        </select>
                                    </div>
                                    <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

                                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {SOCIAL_PLATFORMS.map(p => (
                                            <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', borderLeft: `3px solid ${p.color}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div
                                                            onClick={() => iconRefs.current[p.key]?.click()}
                                                            title="تغيير الأيقونة"
                                                            style={{
                                                                width: '24px', height: '24px', borderRadius: '4px', background: config[`${p.key}_icon`] ? 'transparent' : p.color,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: config[`${p.key}_icon`] ? '1px dashed #555' : 'none'
                                                            }}
                                                        >
                                                            {config[`${p.key}_icon`] ?
                                                                <img src={config[`${p.key}_icon`]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="icon" />
                                                                : <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{p.defaultIcon}</span>
                                                            }
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{p.label}</span>
                                                        <input type="file" ref={el => { iconRefs.current[p.key] = el; }} style={{ display: 'none' }} accept="image/*" onChange={e => e.target.files?.[0] && loadIconFile(p.key, e.target.files[0])} />
                                                        {config[`${p.key}_icon`] && <button onClick={() => setT(`${p.key}_icon`, '')} style={{ background: 'transparent', border: 'none', color: '#E35E35', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>✖</button>}
                                                    </div>
                                                    <label style={{ fontSize: '0.75rem', cursor: 'pointer' }}><input type="checkbox" checked={config[`${p.key}_show`] !== false} onChange={e => setT(`${p.key}_show`, e.target.checked)} /> مفعل</label>
                                                </div>
                                                <input type="text" className="input-glass" placeholder={p.placeholder} value={config[p.key] || ''} onChange={e => setT(p.key, e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 10px' }} />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </AccordionItem>
                </div>

                {/* ─── RIGHT PANEL: LIVE SECTION PREVIEW ───────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: '6', overflowY: 'auto', paddingLeft: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>معاينة حية للمستند المطبوع</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ padding: '3px 10px', background: `${config.accentColor}22`, color: config.accentColor, borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>LIVE PREVIEW</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', direction: 'rtl', fontFamily: 'Tahoma, Arial, sans-serif', color: '#222', fontSize: `${config.fontSize}px`, minHeight: '500px' }}>

                        {/* HEADER PREVIEW */}
                        <div style={{ borderBottom: `3px solid ${config.accentColor}`, paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <h2 style={{ margin: 0, color: config.accentColor, fontSize: config.companyNameFontSize ? `${config.companyNameFontSize}px` : '1.4rem' }}>{config.companyName || 'اسم الشركة'}</h2>
                                {config.companySubtitle && <p style={{ margin: '2px 0 0', color: '#666', fontSize: config.companySubtitleFontSize ? `${config.companySubtitleFontSize}px` : '0.85rem' }}>{config.companySubtitle}</p>}
                                <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#555', lineHeight: 1.4 }}>
                                    {config.companyAddress && <div>📍 {config.companyAddress}</div>}
                                    {config.companyPhone && <div>📞 {config.companyPhone} {config.companyPhone2 ? ` | ${config.companyPhone2}` : ''}</div>}
                                </div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <h1 style={{ margin: 0, fontSize: config.titleFontSize ? `${config.titleFontSize}px` : '1.4rem' }}>{config.title}</h1>
                                {config.subtitle && <p style={{ margin: '2px 0 0', color: '#666', fontSize: '0.85rem' }}>{config.subtitle}</p>}
                                {config.showDate && <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.75rem' }}>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                {config.showLogo && (config.printLogoCustom || appLogo) ? <img src={config.printLogoCustom || appLogo} style={{ maxWidth: `${config.printLogoSize || 70}px`, maxHeight: `${config.printLogoSize || 70}px`, objectFit: 'contain' }} /> : (config.showLogo ? <span style={{ fontSize: '2rem' }}>🏭</span> : '')}
                            </div>
                        </div>

                        {/* CLIENT PREVIEW */}
                        {config.showClientBox && config.reportType === 'sales' && (
                            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', marginBottom: '16px', background: '#fafafa' }}>
                                <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: config.accentColor }}>بيانات العميل</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                                    {config.showClientName && <div><strong>اسم العميل:</strong> أحمد السيد</div>}
                                    {config.showClientStoreName && <div><strong>اسم الشركة:</strong> مجموعة التجارة</div>}
                                    {config.showClientPhone && <div><strong>الهاتف:</strong> 01000000000</div>}
                                    {config.showClientAddress && <div><strong>العنوان:</strong> القاهرة</div>}
                                </div>
                            </div>
                        )}

                        {/* TABLE PREVIEW */}
                        {config.showTable && loaded && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ background: config.accentColor, color: '#fff', padding: '6px 8px', textAlign: 'center' }}>#</th>
                                        {getColumns().map(c => <th key={c.key} style={{ background: config.accentColor, color: '#fff', padding: '6px 8px', textAlign: 'right' }}>{c.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getPreviewData().slice(0, 4).map((item, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', color: '#888', textAlign: 'center' }}>{i + 1}</td>
                                            {getColumns().map(c => <td key={c.key} style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{getCellValue(item, c.key)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FOOTER PREVIEW */}
                        {config.showFooter && (
                            <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #eee', textAlign: config.footerAlign, color: '#888', fontSize: '0.78rem' }}>
                                <div style={{ marginBottom: '8px', fontSize: config.footerFontSize ? `${config.footerFontSize}px` : 'inherit' }}>{config.footerText}</div>
                                <div style={{ textAlign: config.socialAlign }}>
                                    {SOCIAL_PLATFORMS.filter(p => config[`${p.key}_show`] !== false && config[p.key]).map(p => (
                                        <span key={p.key} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: config[`${p.key}_icon`] ? 'transparent' : p.color, borderRadius: '4px', margin: '0 3px' }}>
                                            {config[`${p.key}_icon`] ? <img src={config[`${p.key}_icon`]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>{p.defaultIcon}</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
