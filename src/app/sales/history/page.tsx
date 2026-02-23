'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';

// ─── Social Platforms ────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
    { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', defaultIcon: '📞', placeholder: 'https://wa.me/201000000000' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2', defaultIcon: 'f', placeholder: 'https://facebook.com/YourPage' },
    { key: 'instagram', label: 'Instagram', color: '#E4405F', defaultIcon: '📸', placeholder: 'https://instagram.com/YourPage' },
    { key: 'youtube', label: 'YouTube', color: '#FF0000', defaultIcon: '▶', placeholder: 'https://youtube.com/YourChannel' },
    { key: 'tiktok', label: 'TikTok', color: '#2D2D2D', defaultIcon: '♪', placeholder: 'https://tiktok.com/@YourPage' },
    { key: 'pinterest', label: 'Pinterest', color: '#E60023', defaultIcon: 'P', placeholder: 'https://pinterest.com/YourPage' },
    { key: 'website', label: 'الموقع', color: '#29b6f6', defaultIcon: '🌐', placeholder: 'https://www.yourwebsite.com' },
] as const;

// ─── Default Template ─────────────────────────────────────────────────────────
const DEFAULT_TEMPLATE = {
    // Company header
    companyName: '', companySubtitle: '', companyAddress: '',
    companyPhone: '', companyPhone2: '', companyEmail: '',
    companyTax: '', companyCommercial: '',
    // Layout
    headerPosition: 'space-between' as 'space-between' | 'flex-start' | 'flex-end' | 'center',
    logoPosition: 'right' as 'right' | 'left' | 'center' | 'top-center' | 'logo-only',
    printLogoSize: '70',
    printLogoCustom: '',          // ⭐ شعار مخصص للفاتورة (غير شعار التطبيق)
    titleAr: 'فاتورة مبيعات',
    accentColor: '#E35E35',
    showLogo: true, showTax: true, showDiscount: true,
    // Client section
    showClientBox: true, showClientName: true, showClientPhone: true,
    showClientPhone2: false, showClientAddress: true, showClientEmail: false, showClientStoreName: false,
    // Footer
    footerText: 'شكراً لتعاملكم معنا',
    footerAlign: 'center' as 'right' | 'center' | 'left',
    // Social — URLs
    socialAlign: 'center' as 'right' | 'center' | 'left',
    whatsapp: '', facebook: '', instagram: '', youtube: '', tiktok: '', pinterest: '', website: '',
    // Social — show/hide flags
    whatsapp_show: true, facebook_show: true, instagram_show: true,
    youtube_show: true, tiktok_show: true, pinterest_show: true, website_show: true,
    // Social — custom icons
    whatsapp_icon: '', facebook_icon: '', instagram_icon: '',
    youtube_icon: '', tiktok_icon: '', pinterest_icon: '', website_icon: '',
    // Extra custom platforms (array stored as JSON string)
    customPlatforms: '[]',
};

type Template = typeof DEFAULT_TEMPLATE;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const alignOptions = ['right', 'center', 'left'] as const;

function getSettings() {
    try { return JSON.parse(localStorage.getItem('erp_settings') || '{}'); } catch { return {}; }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SalesHistoryPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchBy, setSearchBy] = useState<'invoice' | 'client'>('client');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    const [showDropdown, setShowDropdown] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editorTab, setEditorTab] = useState<'header' | 'client' | 'footer' | 'social'>('header');
    const [template, setTemplate] = useState<Template>(DEFAULT_TEMPLATE);
    const iconRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // ── Edit/Delete modal state ────────────────────────────────────────────────
    const [editModal, setEditModal] = useState<any | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNote, setEditNote] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Currency / appName
    const sym = () => getSettings().currencySymbol || 'ج.م';
    const appName = () => getSettings().appName || 'Stand Masr ERP';

    const fetchInvoices = () => fetch('/api/sales').then(r => r.json()).then((d: any[]) => { setInvoices(d); setLoading(false); });

    // ── Delete invoice ────────────────────────────────────────────────────────
    const handleDelete = async (inv: any) => {
        if (!confirm(`هل تريد إلغاء وحذف الفاتورة ${inv.invoiceNo}؟\nسيتم استعادة المخزون تلقائياً.`)) return;
        setDeleting(true); setActionMsg('');
        try {
            const res = await fetch('/api/sales', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inv.id }) });
            if (res.ok) { setActionMsg('✅ تم حذف الفاتورة واستعادة المخزون'); fetchInvoices(); }
            else { const d = await res.json(); setActionMsg(`❌ ${d.error || 'فشل الحذف'}`); }
        } catch { setActionMsg('❌ خطأ في الاتصال'); } finally { setDeleting(false); }
    };

    // ── Edit invoice status ───────────────────────────────────────────────────
    const openEdit = (inv: any) => { setEditModal(inv); setEditStatus(inv.status); setEditNote(inv.note || ''); setActionMsg(''); };
    const handleSaveEdit = async () => {
        if (!editModal) return;
        setSaving(true);
        try {
            const res = await fetch('/api/sales', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editModal.id, status: editStatus, note: editNote }) });
            if (res.ok) { setActionMsg('✅ تم تحديث الفاتورة'); setEditModal(null); fetchInvoices(); }
            else { const d = await res.json(); setActionMsg(`❌ ${d.error || 'فشل التحديث'}`); }
        } catch { setActionMsg('❌ خطأ في الاتصال'); } finally { setSaving(false); }
    };

    useEffect(() => {
        fetchInvoices();
        try {
            const saved = localStorage.getItem('erp_invoice_template');
            const s = getSettings();
            setTemplate(prev => ({
                ...DEFAULT_TEMPLATE,
                companyName: s.appName || '',
                accentColor: s.primaryColor || '#E35E35',
                ...(saved ? JSON.parse(saved) : {}),
            }));
        } catch { }
    }, []);

    const setT = (k: keyof Template, v: any) => setTemplate(prev => ({ ...prev, [k]: v }));
    const saveTemplate = () => { localStorage.setItem('erp_invoice_template', JSON.stringify(template)); setShowEditor(false); };

    // ── load custom icon image for a social platform ──
    const loadIconFile = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onload = ev => setT(`${key}_icon` as keyof Template, ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // ── Suggestions dropdown ──
    const clientNames = useMemo(() => [...new Set(invoices.map((inv: any) => inv.client?.name).filter(Boolean))].sort() as string[], [invoices]);
    const invoiceNos = useMemo(() => invoices.map((inv: any) => inv.invoiceNo).filter(Boolean) as string[], [invoices]);
    const suggestions = useMemo(() => {
        if (!search.trim()) return [];
        const q = search.toLowerCase();
        return (searchBy === 'client' ? clientNames : invoiceNos).filter(n => n.toLowerCase().includes(q)).slice(0, 8);
    }, [search, searchBy, clientNames, invoiceNos]);

    // ── Filtered results ──
    const filtered = useMemo(() => invoices.filter(inv => {
        const q = search.trim().toLowerCase();
        const match = !q ? true : searchBy === 'invoice' ? (inv.invoiceNo || '').toLowerCase().includes(q) : (inv.client?.name || '').toLowerCase().includes(q);
        const d = new Date(inv.createdAt);
        return match && (!dateFrom || d >= new Date(dateFrom)) && (!dateTo || d <= new Date(dateTo + 'T23:59:59'));
    }), [invoices, search, searchBy, dateFrom, dateTo]);

    const totalFiltered = filtered.reduce((a, inv) => a + (inv.total || 0), 0);

    // Pagination
    useEffect(() => { setCurrentPage(1); }, [search, searchBy, dateFrom, dateTo]);
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedFiltered = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage]);

    // ─────────────────────────────────────────────────────────────────
    //  BUILD SOCIAL HTML
    // ─────────────────────────────────────────────────────────────────
    const buildSocialHTML = (t: Template) => {
        const allPlatforms = [
            ...SOCIAL_PLATFORMS,
            ...((() => { try { return JSON.parse((t as any).customPlatforms || '[]'); } catch { return []; } })())
        ];
        // filter: has URL and show flag is not explicitly false
        const platforms = allPlatforms.filter(p => {
            const url = (t as any)[p.key];
            const show = (t as any)[`${p.key}_show`];
            return !!url && show !== false;
        });
        if (platforms.length === 0 && !t.footerText) return '';
        const sz = '36px';
        const icons = platforms.map(p => {
            const url = (t as any)[p.key] as string;
            const custom = (t as any)[`${p.key}_icon`] as string;
            const iconHtml = custom
                ? `<img src="${custom}" style="width:${sz};height:${sz};object-fit:contain;border-radius:6px;display:block" />`
                : `<span style="width:${sz};height:${sz};background:${(p as any).color};color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.9rem">${(p as any).defaultIcon}</span>`;
            return `<a href="${url}" style="display:inline-flex;margin:0 4px;text-decoration:none" title="${p.label}">${iconHtml}</a>`;
        }).join('');
        return `
            <div style="margin-top:24px;padding-top:14px;border-top:1px solid #eee">
                <div style="text-align:${t.footerAlign};color:#777;font-size:0.85rem;margin-bottom:8px">${t.footerText}</div>
                ${platforms.length > 0 ? `<div style="text-align:${t.socialAlign}">${icons}</div>` : ''}
                ${(t as any).website && (t as any).website_show !== false ? `<div style="text-align:${t.socialAlign};margin-top:6px;font-size:0.8rem"><a href="${(t as any).website}" style="color:#29b6f6">${(t as any).website}</a></div>` : ''}
            </div>`;
    };

    // ─────────────────────────────────────────────────────────────────
    //  BUILD CLIENT HTML
    // ─────────────────────────────────────────────────────────────────
    const buildClientHTML = (t: Template, inv: any) => {
        if (!t.showClientBox) return '';
        const client = inv.client || {};
        const lines = [
            t.showClientName && client.name ? `<strong>العميل:</strong> ${client.name}` : '',
            t.showClientStoreName && client.storeName ? `<strong>المحل:</strong> ${client.storeName}` : '',
            t.showClientPhone && client.phone1 ? `<strong>هاتف:</strong> ${client.phone1}` : '',
            t.showClientPhone2 && client.phone2 ? `<strong>هاتف 2:</strong> ${client.phone2}` : '',
            t.showClientAddress && client.address ? `<strong>العنوان:</strong> ${client.address}` : '',
            t.showClientEmail && client.email ? `<strong>بريد:</strong> ${client.email}` : '',
        ].filter(Boolean).join('&nbsp;&nbsp;|&nbsp;&nbsp;');
        if (!lines) return '';
        return `<div style="background:#f7f7f7;border-right:4px solid ${t.accentColor};padding:10px 14px;border-radius:4px;margin-bottom:16px;font-size:0.88rem">${lines}</div>`;
    };

    // ─────────────────────────────────────────────────────────────────
    //  PRINT INVOICE
    // ─────────────────────────────────────────────────────────────────
    const printInvoice = (inv: any) => {
        const win = window.open('', '_blank'); if (!win) return;
        const s = getSettings();
        const t = template;
        const logo = (t as any).printLogoCustom || s.appLogo || '';  // ⭐ شعار مخصص للفاتورة أو الشعار العام
        const logoSizePx = t.printLogoSize || '70';
        const accentColor = t.accentColor || s.primaryColor || '#E35E35';
        const coName = t.companyName || appName();
        const currency = sym();

        // logo border-radius
        const shapeMap: Record<string, string> = { circle: '50%', square: '0', rect: '6px', rounded: '10px' };
        const logoRadius = shapeMap[s.logoShape || 'rounded'] || '10px';

        const rows = (inv.sales || []).map((it: any) => `
            <tr>
                <td>${it.product?.name || 'منتوج'}</td>
                <td style="text-align:center">${it.quantity}</td>
                <td style="text-align:center">${(it.unitPrice || 0).toFixed(0)}</td>
                <td style="text-align:center;font-weight:bold">${(it.totalPrice || 0).toFixed(0)}</td>
            </tr>`).join('');

        const discountVal = (inv.subtotal || 0) * (inv.discountPct || 0) / 100;
        const taxVal = ((inv.subtotal || 0) - discountVal) * (inv.taxPct || 0) / 100;

        const logoImg = logo && t.showLogo
            ? `<img src="${logo}" style="width:${logoSizePx}px;height:${logoSizePx}px;object-fit:contain;border-radius:${logoRadius};display:block" />`
            : '';

        // ── Company info block ──
        const infoBlock = `<div>
            <h1 style="margin:0 0 3px;font-size:1.35rem;color:${accentColor}">${coName}</h1>
            ${t.companySubtitle ? `<p style="margin:2px 0;color:#666;font-size:0.82rem">${t.companySubtitle}</p>` : ''}
            ${t.companyAddress ? `<p style="margin:2px 0;font-size:0.8rem">📍 ${t.companyAddress}</p>` : ''}
            ${t.companyPhone ? `<p style="margin:2px 0;font-size:0.8rem">📞 ${t.companyPhone}</p>` : ''}
            ${t.companyPhone2 ? `<p style="margin:2px 0;font-size:0.8rem">📞 ${t.companyPhone2}</p>` : ''}
            ${t.companyEmail ? `<p style="margin:2px 0;font-size:0.8rem">✉ ${t.companyEmail}</p>` : ''}
            ${t.companyTax ? `<p style="margin:2px 0;font-size:0.8rem">🏦 ر.ض: ${t.companyTax}</p>` : ''}
            ${t.companyCommercial ? `<p style="margin:2px 0;font-size:0.8rem">📋 س.ت: ${t.companyCommercial}</p>` : ''}
        </div>`;

        const metaBlock = `<div style="text-align:left">
            <h2 style="margin:0 0 5px;color:${accentColor};font-size:1.05rem">${t.titleAr}</h2>
            <p style="margin:2px 0;font-size:0.83rem"><strong>رقم:</strong> ${inv.invoiceNo}</p>
            <p style="margin:2px 0;font-size:0.83rem"><strong>تاريخ:</strong> ${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</p>
            <p style="margin:2px 0;font-size:0.83rem"><strong>حالة:</strong> ${inv.status === 'PAID' ? '✅ مدفوع' : inv.status === 'PARTIAL' ? '🕐 جزئي' : '⏳ آجل'}</p>
        </div>`;

        // ── Header layout ── 6 positions ──────────────────────────────
        let headerHTML = '';
        const logoBlock = (extraStyle = '') =>
            logoImg ? logoImg.replace('display:block', `display:block;${extraStyle}`) : '';

        switch (t.logoPosition) {
            case 'right':
                // Logo right of company info, meta on far left
                headerHTML = `<div style="display:flex;justify-content:${t.headerPosition};align-items:flex-start;gap:14px">
                    <div style="display:flex;align-items:flex-start;gap:10px">${logoBlock()}${infoBlock}</div>
                    ${metaBlock}
                </div>`;
                break;
            case 'left':
                // Logo left of meta block, company info on right
                headerHTML = `<div style="display:flex;justify-content:${t.headerPosition};align-items:flex-start;gap:14px">
                    ${infoBlock}
                    <div style="display:flex;align-items:flex-start;gap:10px">${metaBlock}${logoBlock()}</div>
                </div>`;
                break;
            case 'center':
                // Logo centered above, both info blocks below
                headerHTML = `
                    ${logoImg ? `<div style="text-align:center;margin-bottom:10px">${logoBlock('display:inline-block')}</div>` : ''}
                    <div style="display:flex;justify-content:${t.headerPosition};align-items:flex-start;gap:12px">
                        ${infoBlock}${metaBlock}
                    </div>`;
                break;
            case 'top-center':
                // Everything centered — logo + company name centered, meta below
                headerHTML = `<div style="text-Align:center">
                    ${logoImg ? `<div style="margin-bottom:8px">${logoBlock('display:inline-block')}</div>` : ''}
                    ${infoBlock.replace('<div>', '<div style="text-align:center">')}
                    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;display:flex;justify-content:space-between">
                        ${metaBlock}
                    </div>
                </div>`;
                break;
            case 'logo-only':
                // Large logo alone on right, company info + meta stacked
                headerHTML = `<div style="display:flex;align-items:flex-start;gap:18px">
                    ${logoImg ? logoImg.replace(`width:${logoSizePx}px;height:${logoSizePx}px`, `width:${Math.round(parseInt(logoSizePx) * 1.3)}px;height:${Math.round(parseInt(logoSizePx) * 1.3)}px`) : ''}
                    <div style="flex:1">
                        ${infoBlock}
                        <div style="margin-top:10px">${metaBlock.replace('text-align:left', 'text-align:right')}</div>
                    </div>
                </div>`;
                break;
            default:
                headerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px">
                    <div style="display:flex;align-items:flex-start;gap:10px">${logoBlock()}${infoBlock}</div>
                    ${metaBlock}
                </div>`;
        }

        win.document.write(`
        <html dir="rtl"><head><title>${t.titleAr} - ${inv.invoiceNo}</title>
        <style>
            @page { size:A4; margin:12mm 15mm; }
            *{box-sizing:border-box;}
            body{font-family:'Tahoma','Arial',sans-serif;color:#222;font-size:14px;margin:0;}
            .hdr{border-bottom:3px solid ${accentColor};padding-bottom:14px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;margin-bottom:16px;}
            th{background:${accentColor};color:white;padding:8px 12px;text-align:right;font-size:0.86rem;}
            td{padding:7px 12px;border-bottom:1px solid #eee;font-size:0.87rem;}
            tr:nth-child(even) td{background:#fafafa;}
            .totals{width:280px;border:1px solid #ddd;border-radius:6px;overflow:hidden;float:left;}
            .totals .row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #eee;font-size:0.86rem;}
            .totals .total{display:flex;justify-content:space-between;padding:10px 14px;background:${accentColor};color:white;font-weight:bold;}
            .clearfix::after{content:'';display:table;clear:both;}
        </style></head>
        <body onload="window.print()">
        <div class="hdr">${headerHTML}</div>
        ${buildClientHTML(t, inv)}
        <table>
            <thead><tr><th>الصنف</th><th style="text-align:center">الكمية</th><th style="text-align:center">سعر الوحدة (${currency})</th><th style="text-align:center">الإجمالي (${currency})</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="clearfix">
            <div class="totals">
                <div class="row"><span>المجموع قبل الخصم</span><span>${(inv.subtotal || 0).toFixed(0)} ${currency}</span></div>
                ${t.showDiscount && inv.discountPct > 0 ? `<div class="row" style="color:green"><span>خصم ${inv.discountPct}%</span><span>- ${discountVal.toFixed(0)} ${currency}</span></div>` : ''}
                ${t.showTax && inv.taxPct > 0 ? `<div class="row" style="color:#e67e00"><span>ضريبة ${inv.taxPct}%</span><span>${taxVal.toFixed(0)} ${currency}</span></div>` : ''}
                <div class="total"><span>الإجمالي المستحق</span><span>${(inv.total || 0).toFixed(0)} ${currency}</span></div>
            </div>
        </div>
        ${buildSocialHTML(t)}
        </body></html>`);
        win.document.close();
    };

    // ─── Excel export ─────────────────────────────────────────────────────────
    const downloadExcel = (all = false) => {
        const data = all ? invoices : filtered;
        const currency = sym();
        const rows = data.map((inv: any) => `<tr>
            <td>${inv.invoiceNo}</td><td>${inv.client?.name || '-'}</td>
            <td>${new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
            <td>${(inv.subtotal || 0).toFixed(0)}</td><td>${inv.discountPct || 0}%</td>
            <td>${inv.taxPct || 0}%</td><td><b>${(inv.total || 0).toFixed(0)}</b></td>
            <td>${inv.status === 'PAID' ? 'مدفوع' : inv.status === 'PARTIAL' ? 'جزئي' : 'آجل'}</td>
        </tr>`).join('');
        const total = data.reduce((a: number, inv: any) => a + (inv.total || 0), 0);
        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"></head><body>
            <table dir="rtl" border="1"><thead><tr style="background:#1565C0;color:white">
                <th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>قبل الخصم</th><th>الخصم</th><th>الضريبة</th><th>الإجمالي (${currency})</th><th>الحالة</th>
            </tr></thead><tbody>${rows}<tr style="background:#eee"><td colspan="6"><b>الإجمالي</b></td><td><b>${total.toFixed(0)}</b></td><td></td></tr></tbody></table>
            </body></html>`;
        const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `فواتير_${new Date().toISOString().split('T')[0]}.xls` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    // ─── Tab style helper ─────────────────────────────────────────────────────
    const eTabStyle = (tab: string) => ({
        padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 as const,
        background: editorTab === tab ? template.accentColor : 'rgba(255,255,255,0.06)',
        color: editorTab === tab ? '#fff' : '#aaa',
        border: `1px solid ${editorTab === tab ? template.accentColor : 'rgba(255,255,255,0.1)'}`,
    });

    const checkStyle = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ccc', fontSize: '0.88rem', marginBottom: 0 } as const;

    // ════════════════════════════════════════════════════════════════════
    return (
        <div className="animate-fade-in">
            {/* ── Header ── */}
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>سجل فواتير المبيعات</h1>
                    <p>بحث ذكي وطباعة PDF مخصصة وتصدير Excel</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => downloadExcel(false)} className="btn-secondary" style={{ color: '#66bb6a', borderColor: 'rgba(102, 187, 106, 0.3)' }}>📊 Excel</button>
                    <button onClick={() => downloadExcel(true)} className="btn-secondary" style={{ color: '#1a7a3c', borderColor: 'rgba(26, 122, 60, 0.3)' }}>📂 الكل Excel</button>
                </div>
            </header>

            {/* ── Search ── */}
            <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label>البحث بـ</label>
                        <select className="input-glass" value={searchBy} onChange={e => { setSearchBy(e.target.value as any); setSearch(''); }} style={{ width: '155px' }}>
                            <option value="client">اسم العميل</option>
                            <option value="invoice">رقم الفاتورة</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '210px', position: 'relative' }}>
                        <label>{searchBy === 'client' ? 'اسم العميل' : 'رقم الفاتورة'}</label>
                        <input type="text" className="input-glass" value={search}
                            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            placeholder={searchBy === 'client' ? 'ابدأ بكتابة اسم العميل..' : 'INV-0001..'}
                        />
                        {showDropdown && suggestions.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#1e2028', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', marginTop: '4px', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
                                {suggestions.map((s: string, i: number) => (
                                    <div key={i} onClick={() => { setSearch(s); setShowDropdown(false); }}
                                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        {searchBy === 'client' ? '👤 ' : '🧾 '}{s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div><label>من تاريخ</label><input type="date" className="input-glass" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                    <div><label>إلى تاريخ</label><input type="date" className="input-glass" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                    {(search || dateFrom || dateTo) && (
                        <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }} style={{ padding: '0.75rem 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', borderRadius: '8px', cursor: 'pointer' }}>✕ مسح</button>
                    )}
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#919398' }}>
                    النتائج: <strong style={{ color: '#fff' }}>{filtered.length}</strong> | الإجمالي: <strong style={{ color: 'var(--primary-color)' }}>{totalFiltered.toFixed(0)} {sym()}</strong>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                {loading ? <p>جاري التحميل...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-glass">
                            <thead>
                                <tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>قبل الخصم</th><th>الخصم/ض</th><th>الإجمالي</th><th>الحالة</th><th>الإجراءات</th></tr>
                            </thead>
                            <tbody>
                                {paginatedFiltered.map((inv: any) => (
                                    <tr key={inv.id}>
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{inv.invoiceNo}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                                        <td>{inv.client?.name || '-'}</td>
                                        <td>{(inv.subtotal || 0).toFixed(0)} {sym()}</td>
                                        <td style={{ fontSize: '0.83rem', color: '#919398' }}>
                                            {inv.discountPct > 0 && <span style={{ color: '#66bb6a' }}>خ {inv.discountPct}% </span>}
                                            {inv.taxPct > 0 && <span style={{ color: '#ffa726' }}>ض {inv.taxPct}%</span>}
                                            {!inv.discountPct && !inv.taxPct && '-'}
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>{(inv.total || 0).toFixed(0)} {sym()}</td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold',
                                                background: inv.status === 'PAID' ? 'rgba(102,187,106,0.2)' : inv.status === 'PARTIAL' ? 'rgba(255,167,38,0.2)' : 'rgba(227,94,53,0.2)',
                                                color: inv.status === 'PAID' ? '#66bb6a' : inv.status === 'PARTIAL' ? '#ffa726' : '#E35E35'
                                            }}>
                                                {inv.status === 'PAID' ? 'مدفوع' : inv.status === 'PARTIAL' ? 'جزئي' : 'آجل'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button onClick={() => printInvoice(inv)} className="btn-secondary btn-sm" style={{ color: '#fff' }}>🖨 PDF</button>
                                                <button onClick={() => openEdit(inv)} className="btn-secondary btn-sm" style={{ color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)' }}>✏️ تعديل</button>
                                                <button onClick={() => handleDelete(inv)} disabled={deleting} className="btn-danger btn-sm">🗑 حذف</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !loading && (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>لا توجد نتائج</td></tr>
                                )}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>السابق</button>
                                <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>صفحة {currentPage} من {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>التالي</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Action message (delete feedback) ── */}
            {actionMsg && !editModal && (
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: actionMsg.startsWith('✅') ? 'rgba(102,187,106,0.9)' : 'rgba(255,82,82,0.9)', color: '#fff', padding: '12px 28px', borderRadius: '30px', fontWeight: 'bold', zIndex: 9999 }}>
                    {actionMsg}
                </div>
            )}

            {/* ════ EDIT INVOICE MODAL ════ */}
            {editModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
                    <div style={{ background: '#1a1c22', border: '1px solid rgba(41,182,246,0.3)', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#29b6f6' }}>✏️ تعديل الفاتورة</h3>
                            <button onClick={() => setEditModal(null)} style={{ background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: '1.4rem' }}>✕</button>
                        </div>
                        <p style={{ color: '#919398', marginBottom: '1.5rem', fontSize: '0.9rem' }}>فاتورة: <strong style={{ color: '#fff' }}>{editModal.invoiceNo}</strong> — {editModal.client?.name}</p>
                        {actionMsg && <div style={{ background: actionMsg.startsWith('✅') ? 'rgba(102,187,106,0.12)' : 'rgba(255,82,82,0.12)', color: actionMsg.startsWith('✅') ? '#66bb6a' : '#ff5252', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 'bold' }}>{actionMsg}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label>حالة الفاتورة</label>
                                <select className="input-glass" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                    <option value="UNPAID">⏳ آجل (غير مدفوع)</option>
                                    <option value="PARTIAL">🕐 جزئي (مدفوع جزء)</option>
                                    <option value="PAID">✅ مدفوع بالكامل</option>
                                </select>
                            </div>
                            <div>
                                <label>ملاحظة (اختياري)</label>
                                <input type="text" className="input-glass" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="أي ملاحظة تتعلق بالفاتورة.." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditModal(null)} className="btn-secondary">إلغاء</button>
                            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary">
                                {saving ? 'جاري الحفظ...' : '💾 حفظ التعديل'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TEMPLATE EDITOR MODAL
            ════════════════════════════════════════════════════════ */}
            {showEditor && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: '#16181f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '870px', maxHeight: '92vh', overflowY: 'auto' }}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: '#ab47bc', margin: 0 }}>🖊 قالب الطباعة والـ PDF</h3>
                            <button onClick={() => setShowEditor(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        {/* Editor Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <button style={eTabStyle('header')} onClick={() => setEditorTab('header')}>🏢 رأس الفاتورة</button>
                            <button style={eTabStyle('client')} onClick={() => setEditorTab('client')}>👤 بيانات العميل</button>
                            <button style={eTabStyle('footer')} onClick={() => setEditorTab('footer')}>📝 التذييل</button>
                            <button style={eTabStyle('social')} onClick={() => setEditorTab('social')}>🌐 منصات التواصل</button>
                        </div>

                        {/* ─── TAB: HEADER ─────────────────────────────── */}
                        {editorTab === 'header' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div><label>اسم الشركة</label><input type="text" className="input-glass" value={template.companyName} onChange={e => setT('companyName', e.target.value)} /></div>
                                    <div><label>وصف / شعار مختصر</label><input type="text" className="input-glass" value={template.companySubtitle} onChange={e => setT('companySubtitle', e.target.value)} placeholder="للصناعات المعدنية" /></div>
                                    <div><label>العنوان</label><input type="text" className="input-glass" value={template.companyAddress} onChange={e => setT('companyAddress', e.target.value)} /></div>
                                    <div><label>هاتف رئيسي</label><input type="text" className="input-glass" value={template.companyPhone} onChange={e => setT('companyPhone', e.target.value)} /></div>
                                    <div><label>هاتف 2 / واتساب</label><input type="text" className="input-glass" value={template.companyPhone2} onChange={e => setT('companyPhone2', e.target.value)} /></div>
                                    <div><label>البريد الإلكتروني</label><input type="text" className="input-glass" value={template.companyEmail} onChange={e => setT('companyEmail', e.target.value)} /></div>
                                    <div><label>الرقم الضريبي</label><input type="text" className="input-glass" value={template.companyTax} onChange={e => setT('companyTax', e.target.value)} /></div>
                                    <div><label>السجل التجاري</label><input type="text" className="input-glass" value={template.companyCommercial} onChange={e => setT('companyCommercial', e.target.value)} /></div>
                                    <div><label>عنوان الفاتورة</label><input type="text" className="input-glass" value={template.titleAr} onChange={e => setT('titleAr', e.target.value)} /></div>
                                    <div>
                                        <label>لون التمييز</label>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input type="color" value={template.accentColor} onChange={e => setT('accentColor', e.target.value)} style={{ width: '42px', height: '36px', border: 'none', borderRadius: '6px' }} />
                                            <input type="text" className="input-glass" value={template.accentColor} onChange={e => setT('accentColor', e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Logo controls */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}>
                                    <label style={{ fontWeight: 600, color: '#ccc', display: 'block', marginBottom: '12px' }}>📐 الشعار وتنسيق الرأس</label>

                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                                        <label style={checkStyle}>
                                            <input type="checkbox" checked={template.showLogo} onChange={e => setT('showLogo', e.target.checked)} />
                                            إظهار الشعار
                                        </label>
                                        {template.showLogo && (<>
                                            <span style={{ color: '#888', fontSize: '0.83rem', display: 'block', width: '100%', marginBottom: '6px' }}>موضع الشعار في الفاتورة:</span>
                                            {([
                                                { val: 'right', lbl: '🔲→ شعار يمين + بيانات', desc: '[ 🖼 بيانات الشركة ] ← → [ رقم الفاتورة ]' },
                                                { val: 'left', lbl: '←🔲 شعار يسار + بيانات', desc: '[ بيانات الشركة ] ← → [ رقم الفاتورة 🖼 ]' },
                                                { val: 'center', lbl: '⬛ شعار وسط أعلى', desc: '[ 🖼 ] وسط / [ بيانات ] ← → [ رقم ]' },
                                                { val: 'top-center', lbl: '☀ كل شيء بالوسط', desc: '[ 🖼 + بيانات ] توسيط / رقم اسفل' },
                                                { val: 'logo-only', lbl: '🔲 شعار كبير + بيانات مكدسة', desc: '[ 🖼 كبير ] + [ بيانات + رقم بجانب ]' },
                                            ] as const).map(p => (
                                                <button key={p.val} type="button" onClick={() => setT('logoPosition', p.val)}
                                                    title={p.desc}
                                                    style={{
                                                        padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', textAlign: 'right',
                                                        background: template.logoPosition === p.val ? template.accentColor + '22' : 'transparent',
                                                        border: `1px solid ${template.logoPosition === p.val ? template.accentColor : 'rgba(255,255,255,0.15)'}`,
                                                        color: template.logoPosition === p.val ? '#fff' : '#aaa',
                                                    }}>
                                                    {p.lbl}
                                                </button>
                                            ))}
                                        </>)}
                                    </div>

                                    {template.showLogo && (
                                        <div style={{ marginBottom: '14px', marginTop: '6px' }}>
                                            <label>حجم الشعار في الطباعة ({template.printLogoSize}px)</label>
                                            <input type="range" min="30" max="160" value={template.printLogoSize} onChange={e => setT('printLogoSize', e.target.value)} style={{ width: '100%', marginTop: '6px', accentColor: template.accentColor }} />
                                        </div>
                                    )}

                                    <label style={{ ...checkStyle, marginBottom: '8px', display: 'block' }}>محاذاة محتوى الرأس:</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {[
                                            { val: 'space-between', lbl: '↔ موزع (يمين ويسار)' },
                                            { val: 'flex-start', lbl: '→ بداية (يمين)' },
                                            { val: 'flex-end', lbl: '← نهاية (يسار)' },
                                            { val: 'center', lbl: '⬛ وسط' },
                                        ].map(opt => (
                                            <button key={opt.val} type="button" onClick={() => setT('headerPosition', opt.val as any)}
                                                style={{
                                                    padding: '7px 13px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
                                                    background: template.headerPosition === opt.val ? template.accentColor : 'rgba(255,255,255,0.06)',
                                                    border: `1px solid ${template.headerPosition === opt.val ? template.accentColor : 'rgba(255,255,255,0.1)'}`,
                                                    color: template.headerPosition === opt.val ? '#fff' : '#ccc'
                                                }}>
                                                {opt.lbl}
                                            </button>
                                        ))}
                                    </div>

                                    {/* ── شعار مخصص للفاتورة المطبوعة ── */}
                                    <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <label style={{ fontWeight: 600, color: '#ccc', display: 'block', marginBottom: '10px', fontSize: '0.88rem' }}>🖼 شعار مخصص للفاتورة المطبوعة</label>
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{ width: '64px', height: '64px', flexShrink: 0, border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                {(template as any).printLogoCustom
                                                    ? <img src={(template as any).printLogoCustom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    : <span style={{ color: '#555', fontSize: '1.6rem' }}>🖼</span>}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 8px' }}>
                                                    {(template as any).printLogoCustom ? 'يُستخدم هذا الشعار في الطباعة بدلاً من شعار التطبيق' : 'تركه فارغاً = يُستخدم شعار التطبيق من الإعدادات'}
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <label style={{ padding: '7px 14px', background: 'rgba(41,182,246,0.12)', border: '1px solid #29b6f680', color: '#29b6f6', borderRadius: '8px', cursor: 'pointer', fontSize: '0.83rem', fontFamily: 'inherit' }}>
                                                        📁 رفع شعار الفاتورة
                                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                                            const f = e.target.files?.[0]; if (!f) return;
                                                            const r = new FileReader();
                                                            r.onload = ev => setT('printLogoCustom' as any, ev.target?.result as string);
                                                            r.readAsDataURL(f);
                                                        }} />
                                                    </label>
                                                    {(template as any).printLogoCustom && (
                                                        <button type="button" onClick={() => setT('printLogoCustom' as any, '')}
                                                            style={{ padding: '7px 12px', background: 'transparent', border: '1px solid #E35E35', color: '#E35E35', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.83rem' }}>✕ حذف</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
                                        <label style={checkStyle}><input type="checkbox" checked={template.showTax} onChange={e => setT('showTax', e.target.checked)} /> إظهار الضريبة</label>
                                        <label style={checkStyle}><input type="checkbox" checked={template.showDiscount} onChange={e => setT('showDiscount', e.target.checked)} /> إظهار الخصم</label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: CLIENT ─────────────────────────────── */}
                        {editorTab === 'client' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <label style={checkStyle}>
                                    <input type="checkbox" checked={template.showClientBox} onChange={e => setT('showClientBox', e.target.checked)} />
                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>إظهار قسم بيانات العميل في الفاتورة</span>
                                </label>

                                {template.showClientBox && (
                                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <p style={{ color: '#888', margin: '0 0 4px', fontSize: '0.85rem' }}>اختر البيانات التي تريد إظهارها:</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {[
                                                { key: 'showClientName', label: 'اسم العميل' },
                                                { key: 'showClientStoreName', label: 'اسم المحل / الشركة' },
                                                { key: 'showClientPhone', label: 'رقم الهاتف الرئيسي' },
                                                { key: 'showClientPhone2', label: 'رقم الهاتف 2' },
                                                { key: 'showClientAddress', label: 'العنوان' },
                                                { key: 'showClientEmail', label: 'البريد الإلكتروني' },
                                            ].map(f => (
                                                <label key={f.key} style={{ ...checkStyle, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: `1px solid ${(template as any)[f.key] ? template.accentColor + '60' : 'rgba(255,255,255,0.08)'}` }}>
                                                    <input type="checkbox" checked={(template as any)[f.key]} onChange={e => setT(f.key as keyof Template, e.target.checked)} style={{ accentColor: template.accentColor }} />
                                                    {f.label}
                                                </label>
                                            ))}
                                        </div>

                                        {/* Client preview */}
                                        <div style={{ background: '#f5f5f5', borderRight: `4px solid ${template.accentColor}`, padding: '10px 14px', borderRadius: '4px', color: '#333', fontSize: '0.87rem', marginTop: '8px' }}>
                                            <strong style={{ color: '#555', fontSize: '0.75rem' }}>معاينة قسم العميل:</strong><br />
                                            {template.showClientName && <span><strong>العميل:</strong> محمد أحمد &nbsp;|&nbsp;</span>}
                                            {template.showClientStoreName && <span><strong>المحل:</strong> متجر النجاح &nbsp;|&nbsp;</span>}
                                            {template.showClientPhone && <span><strong>هاتف:</strong> 01000000000 &nbsp;|&nbsp;</span>}
                                            {template.showClientPhone2 && <span><strong>هاتف 2:</strong> 01100000000 &nbsp;|&nbsp;</span>}
                                            {template.showClientAddress && <span><strong>العنوان:</strong> القاهرة، مصر &nbsp;|&nbsp;</span>}
                                            {template.showClientEmail && <span><strong>بريد:</strong> client@mail.com</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── TAB: FOOTER ─────────────────────────────── */}
                        {editorTab === 'footer' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label>نص التذييل</label>
                                    <input type="text" className="input-glass" value={template.footerText} onChange={e => setT('footerText', e.target.value)} placeholder="شكراً لتعاملكم معنا" />
                                </div>
                                <div>
                                    <label>محاذاة نص التذييل</label>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        {alignOptions.map(a => (
                                            <button key={a} type="button" onClick={() => setT('footerAlign', a)}
                                                style={{
                                                    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                                                    background: template.footerAlign === a ? template.accentColor : 'rgba(255,255,255,0.06)',
                                                    border: `1px solid ${template.footerAlign === a ? template.accentColor : 'rgba(255,255,255,0.1)'}`,
                                                    color: template.footerAlign === a ? '#fff' : '#aaa'
                                                }}>
                                                {a === 'right' ? '→ يمين' : a === 'center' ? '⬛ وسط' : '← يسار'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', borderTop: '1px solid #eee', textAlign: template.footerAlign, color: '#777', fontSize: '0.85rem' }}>
                                    {template.footerText || 'نص التذييل هنا'}
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: SOCIAL ─────────────────────────────── */}
                        {editorTab === 'social' && (() => {
                            // Parse custom platforms
                            let customPlatforms: any[] = [];
                            try { customPlatforms = JSON.parse((template as any).customPlatforms || '[]'); } catch { }

                            const addCustomPlatform = () => {
                                const label = prompt('اسم المنصة الجديدة (مثل: Snapchat)');
                                if (!label?.trim()) return;
                                const key = 'custom_' + Date.now();
                                const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                                const newP = { key, label: label.trim(), color, defaultIcon: '★', placeholder: 'https://' };
                                const updated = [...customPlatforms, newP];
                                setT('customPlatforms' as any, JSON.stringify(updated));
                                setT(key as any, '');
                            };

                            const removeCustomPlatform = (key: string) => {
                                const updated = customPlatforms.filter((p: any) => p.key !== key);
                                setT('customPlatforms' as any, JSON.stringify(updated));
                            };

                            const allPlatforms = [...SOCIAL_PLATFORMS, ...customPlatforms];

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ color: '#888', fontSize: '0.84rem', margin: 0 }}>أدخل رابط + يمكنك إخفاء/إظهار وتخصيص أيقونة لكل منصة</p>
                                        <button type="button" onClick={addCustomPlatform}
                                            style={{ padding: '6px 14px', background: 'rgba(102,187,106,0.15)', border: '1px solid #66bb6a', color: '#66bb6a', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.83rem' }}>
                                            + إضافة منصة جديدة
                                        </button>
                                    </div>

                                    {allPlatforms.map((p: any) => {
                                        const customIcon = (template as any)[`${p.key}_icon`] as string || '';
                                        const url = (template as any)[p.key] as string || '';
                                        const showFlag = (template as any)[`${p.key}_show`] !== false;
                                        const isCustom = p.key.startsWith('custom_');
                                        return (
                                            <div key={p.key} style={{ background: showFlag ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px 12px', border: `1px solid ${showFlag ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`, opacity: showFlag ? 1 : 0.55 }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    {/* Icon preview + upload */}
                                                    <div onClick={() => iconRefs.current[p.key]?.click()} title="انقر لرفع أيقونة"
                                                        style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: `2px dashed ${p.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: customIcon ? 'transparent' : p.color }}>
                                                        {customIcon
                                                            ? <img src={customIcon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                            : <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>{p.defaultIcon}</span>}
                                                    </div>
                                                    <input ref={el => { iconRefs.current[p.key] = el; }} type="file" accept="image/*" style={{ display: 'none' }}
                                                        onChange={e => e.target.files?.[0] && loadIconFile(p.key, e.target.files[0])} />

                                                    {/* Name + URL */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
                                                            <span style={{ color: p.color, fontWeight: 600, fontSize: '0.85rem' }}>{p.label}</span>
                                                            {customIcon && <button type="button" onClick={() => setT(`${p.key}_icon` as any, '')} style={{ padding: '2px 6px', fontSize: '0.72rem', background: 'transparent', border: '1px solid #E35E35', color: '#E35E35', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit' }}>✕ حذف</button>}
                                                        </div>
                                                        <input type="text" className="input-glass" value={url} onChange={e => setT(p.key as any, e.target.value)} placeholder={p.placeholder} style={{ fontSize: '0.82rem' }} />
                                                    </div>

                                                    {/* Toggle show/hide */}
                                                    <button type="button" onClick={() => setT(`${p.key}_show` as any, !showFlag)}
                                                        title={showFlag ? 'إخفاء من الفاتورة' : 'إظهار في الفاتورة'}
                                                        style={{ padding: '5px 10px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', flexShrink: 0, border: showFlag ? '1px solid #66bb6a' : '1px solid #555', background: showFlag ? 'rgba(102,187,106,0.12)' : 'transparent', color: showFlag ? '#66bb6a' : '#666' }}>
                                                        {showFlag ? '👁 ظاهر' : '🙈 مخفي'}
                                                    </button>

                                                    {/* Remove custom platform */}
                                                    {isCustom && (
                                                        <button type="button" onClick={() => removeCustomPlatform(p.key)}
                                                            style={{ padding: '5px 8px', borderRadius: '7px', cursor: 'pointer', background: 'transparent', border: '1px solid #E35E35', color: '#E35E35', fontSize: '0.82rem', flexShrink: 0 }}>🗑</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Alignment + preview */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                                        <label style={{ fontSize: '0.85rem', color: '#ccc' }}>محاذاة الأيقونات</label>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            {alignOptions.map(a => (
                                                <button key={a} type="button" onClick={() => setT('socialAlign', a)}
                                                    style={{ padding: '7px 18px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', background: template.socialAlign === a ? template.accentColor : 'rgba(255,255,255,0.06)', border: `1px solid ${template.socialAlign === a ? template.accentColor : 'rgba(255,255,255,0.1)'}`, color: template.socialAlign === a ? '#fff' : '#aaa' }}>
                                                    {a === 'right' ? '→ يمين' : a === 'center' ? '⬛ وسط' : '← يسار'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Live preview */}
                                    <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', textAlign: template.footerAlign }}>
                                        <p style={{ margin: '0 0 8px', color: '#777', fontSize: '0.83rem' }}>{template.footerText}</p>
                                        <div style={{ textAlign: template.socialAlign }}>
                                            {allPlatforms.filter((p: any) => !!(template as any)[p.key] && (template as any)[`${p.key}_show`] !== false).map((p: any) => {
                                                const custom = (template as any)[`${p.key}_icon`];
                                                return (
                                                    <span key={p.key} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: custom ? 'transparent' : p.color, borderRadius: '6px', margin: '0 3px', overflow: 'hidden', verticalAlign: 'middle' }}>
                                                        {custom ? <img src={custom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{p.defaultIcon}</span>}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Save/Cancel */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowEditor(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                            <button onClick={saveTemplate} style={{ padding: '10px 30px', background: '#ab47bc', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem' }}>
                                💾 حفظ القالب
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
