/**
 * Centralized Report Template Fetcher
 * Fetches company branding & layout config from DB (/api/settings),
 * merged with localStorage as fallback. Use this in ALL export/print operations.
 */

export interface ReportTemplate {
    companyName: string;
    companySubtitle?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyPhone2?: string;
    companyEmail?: string;
    companyTax?: string;
    companyCommercial?: string;
    accentColor: string;
    appLogo?: string;
    printLogoSize?: number;
    logoShape?: 'circle' | 'square' | 'rounded' | 'rect';
    logoPosition?: 'right' | 'left' | 'center';
    showLogo?: boolean;
    footerText?: string;
    footerAlign?: 'right' | 'center' | 'left';
    footerFontSize?: number;
    showFooter?: boolean;
    sealImage?: string;
    sealAlign?: 'right' | 'center' | 'left';
    sealSize?: number;
    currencySymbol?: string;
    // Social
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
    youtube?: string;
    tiktok?: string;
    pinterest?: string;
    socialAlign?: 'right' | 'center' | 'left';
    // Style settings from designer
    companyNameFontSize?: number;
    companySubtitleFontSize?: number;
    titleFontSize?: number;
    baseFontSize?: number;
}

let _cachedTemplate: ReportTemplate | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

/** Fetch the unified report template. Cached for 30s. */
export async function fetchReportTemplate(): Promise<ReportTemplate> {
    const now = Date.now();
    if (_cachedTemplate && now - _cacheTimestamp < CACHE_TTL) {
        return _cachedTemplate;
    }

    // --- Defaults from localStorage (instant fallback) ---
    let ls: any = {};
    let lsInvoice: any = {};
    let lsUnified: any = {};
    try { ls = JSON.parse(localStorage.getItem('erp_settings') || '{}'); } catch { }
    try { lsInvoice = JSON.parse(localStorage.getItem('erp_invoice_template') || '{}'); } catch { }
    try { lsUnified = JSON.parse(localStorage.getItem('erp_unified_report_config') || '{}'); } catch { }

    // --- Try to fetch from DB ---
    let db: any = {};
    try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) db = await res.json();
    } catch { /* offline – rely on localStorage */ }

    // --- Merge: DB > lsUnified > lsInvoice > ls > hardcoded defaults ---
    const merged: ReportTemplate = {
        companyName: db.appName || lsUnified.companyName || lsInvoice.companyName || ls.appName || 'Stand Masr',
        companySubtitle: db.appSubtitle || lsUnified.companySubtitle || lsInvoice.companySubtitle || '',
        companyAddress: db.companyAddress || lsUnified.companyAddress || lsInvoice.companyAddress || '',
        companyPhone: db.companyPhone || lsUnified.companyPhone || lsInvoice.companyPhone || '',
        companyPhone2: db.companyPhone2 || lsUnified.companyPhone2 || lsInvoice.companyPhone2 || '',
        companyEmail: db.companyEmail || lsUnified.companyEmail || lsInvoice.companyEmail || '',
        companyTax: db.companyTax || lsUnified.companyTax || lsInvoice.companyTax || '',
        companyCommercial: db.companyCommercial || lsUnified.companyCommercial || lsInvoice.companyCommercial || '',
        accentColor: db.primaryColor || lsUnified.accentColor || lsInvoice.accentColor || ls.primaryColor || '#E35E35',
        appLogo: db.appLogo || lsUnified.printLogoCustom || lsInvoice.printLogoCustom || lsUnified.appLogo || ls.appLogo || '',
        printLogoSize: db.printLogoSize || lsUnified.printLogoSize || lsInvoice.printLogoSize || 70,
        logoShape: db.logoShape || lsUnified.logoShape || lsInvoice.logoShape || ls.logoShape || 'rounded',
        logoPosition: db.logoPosition || lsUnified.logoPosition || lsInvoice.logoPosition || 'right',
        showLogo: lsUnified.showLogo ?? lsInvoice.showLogo ?? true,
        footerText: db.footerText || lsUnified.footerText || lsInvoice.footerText || 'شكراً لتعاملكم معنا',
        footerAlign: (db.footerAlign || lsUnified.footerAlign || 'center') as ReportTemplate['footerAlign'],
        footerFontSize: lsUnified.footerFontSize || 13,
        showFooter: lsUnified.showFooter ?? true,
        sealImage: db.footerSealImage || lsUnified.sealImage || '',
        sealAlign: (db.footerSealAlign || lsUnified.sealAlign || 'right') as ReportTemplate['sealAlign'],
        sealSize: db.footerSealSize || lsUnified.sealSize || 120,
        currencySymbol: db.currencySymbol || ls.currencySymbol || 'ج.م',
        whatsapp: db.whatsapp || lsUnified.whatsapp || '',
        facebook: db.facebook || lsUnified.facebook || '',
        instagram: db.instagram || lsUnified.instagram || '',
        website: db.website || lsUnified.website || '',
        youtube: db.youtube || lsUnified.youtube || '',
        tiktok: db.tiktok || lsUnified.tiktok || '',
        pinterest: db.pinterest || lsUnified.pinterest || '',
        socialAlign: lsUnified.socialAlign || 'center',
        companyNameFontSize: lsUnified.companyNameFontSize || 24,
        companySubtitleFontSize: lsUnified.companySubtitleFontSize || 14,
        titleFontSize: lsUnified.titleFontSize || 28,
        baseFontSize: lsUnified.fontSize || 13,
    };

    _cachedTemplate = merged;
    _cacheTimestamp = now;
    return merged;
}

/** Invalidate the cache (call after saving settings). */
export function invalidateTemplateCache() {
    _cachedTemplate = null;
    _cacheTimestamp = 0;
}

/** Convert a logo URL (possibly base64 or http) to a base64 data URL for jsPDF. */
export async function logoToBase64(url: string): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/** Generates a full HTML document for printing, applying all designer customizations. */
export function generatePrintHtml(contentHtml: string, documentTitle: string, template: ReportTemplate): string {
    const {
        companyName, companySubtitle, companyAddress, companyPhone, companyPhone2,
        accentColor, appLogo, printLogoSize, logoPosition, showLogo,
        footerText, footerAlign, footerFontSize, showFooter,
        sealImage, sealAlign, sealSize,
        whatsapp, facebook, instagram, website, youtube, tiktok, pinterest, socialAlign,
        companyNameFontSize, companySubtitleFontSize, titleFontSize, baseFontSize
    } = template;

    const accent = accentColor || '#E35E35';
    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Social icons helper
    const socials = [
        { val: whatsapp, icon: '📞' },
        { val: facebook, icon: 'f' },
        { val: instagram, icon: '📸' },
        { val: website, icon: '🌐' },
        { val: youtube, icon: '▶' },
        { val: tiktok, icon: '♪' },
        { val: pinterest, icon: 'P' },
    ].filter(s => s.val);

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8"/>
    <title>${documentTitle}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            direction: rtl; 
            color: #111; 
            padding: 30px; 
            font-size: ${baseFontSize || 13}px; 
            background: #fff;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 3px solid ${accent};
        }
        .header-left { flex: 1; text-align: left; }
        .header-center { flex: 1; text-align: center; }
        .header-right { flex: 1; text-align: right; }

        .company-name { 
            font-size: ${companyNameFontSize || 24}px; 
            font-weight: 800; 
            color: ${accent}; 
            margin-bottom: 2px;
        }
        .company-subtitle { 
            font-size: ${companySubtitleFontSize || 14}px; 
            color: #666; 
            margin-bottom: 8px;
        }
        .company-info { font-size: 0.8rem; color: #555; line-height: 1.4; }

        .document-title-block { text-align: center; margin: 5px 0 15px; }
        .document-title { 
            font-size: ${titleFontSize || 28}px; 
            margin-bottom: 4px; 
            color: #1e293b;
            font-weight: 800;
        }
        .document-date { font-size: 0.85rem; color: #888; }

        .logo-img { 
            max-width: ${printLogoSize || 70}px; 
            max-height: ${printLogoSize || 70}px; 
            object-fit: contain; 
        }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: auto; }
        th { background: #1e293b; color: #fff; padding: 12px 10px; text-align: right; border: 1px solid #1e293b; }
        td { padding: 10px; border: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9f9f9; }

        .footer { 
            margin-top: 40px; 
            border-top: 1px solid #eee; 
            padding-top: 15px; 
            text-align: ${footerAlign || 'center'};
        }
        .footer-text { 
            font-size: ${footerFontSize || 13}px; 
            color: #666; 
            margin-bottom: 10px; 
        }

        .socials { 
            display: flex; 
            gap: 10px; 
            justify-content: ${socialAlign === 'left' ? 'flex-start' : socialAlign === 'right' ? 'flex-end' : 'center'};
            margin-bottom: 15px;
        }
        .social-icon { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            width: 24px; 
            height: 24px; 
            background: ${accent}; 
            color: #fff; 
            border-radius: 4px; 
            font-size: 0.75rem;
            font-weight: bold;
        }

        .seal-container { 
            text-align: ${sealAlign || 'right'}; 
            margin-top: 15px; 
        }
        .seal-img { 
            max-width: ${sealSize || 120}px; 
            max-height: ${sealSize || 120}px; 
            object-fit: contain; 
        }

        .print-only-footer { font-size: 0.7rem; color: #999; margin-top: 20px; text-align: center; }

        @media print { 
            body { padding: 0; } 
            @page { margin: 15mm; } 
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-right">
            <h1 class="company-name">${companyName}</h1>
            <p class="company-subtitle">${companySubtitle}</p>
            <div class="company-info">
                ${companyAddress ? `<div>📍 ${companyAddress}</div>` : ''}
                ${companyPhone ? `<div>📞 ${companyPhone}${companyPhone2 ? ` | ${companyPhone2}` : ''}</div>` : ''}
            </div>
        </div>
        <div class="header-left">
            ${showLogo && appLogo ? `<img src="${appLogo}" class="logo-img" alt="Logo" />` : ''}
        </div>
    </header>

    <div class="document-title-block">
        <h2 class="document-title">${documentTitle}</h2>
        <p class="document-date">بتاريخ: ${dateStr}</p>
    </div>

    <main class="content">
        ${contentHtml}
    </main>

    ${showFooter ? `
    <footer class="footer">
        <div class="footer-text">${footerText}</div>
        
        <div class="socials">
            ${socials.map(s => `<span class="social-icon">${s.icon}</span>`).join('')}
        </div>

        ${sealImage ? `
        <div class="seal-container">
            <img src="${sealImage}" class="seal-img" alt="Seal" />
        </div>` : ''}

        <div class="print-only-footer">
            طبع بواسطة نظام ${companyName} — ${new Date().toLocaleString('ar-EG')}
        </div>
    </footer>
    ` : ''}
</body>
</html>`;
}
