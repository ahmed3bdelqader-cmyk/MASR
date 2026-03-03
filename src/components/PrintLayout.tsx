'use client';
import React, { useEffect, useState } from 'react';
import ReportFooter from './ReportFooter';

interface PrintLayoutProps {
    children: React.ReactNode;
    documentTitle?: string;
}

export default function PrintLayout({ children, documentTitle = 'تقرير' }: PrintLayoutProps) {
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        try {
            const savedConfig = localStorage.getItem('erp_unified_report_config');
            const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');

            let loadedConfig = savedConfig ? JSON.parse(savedConfig) : {};

            // Combine with general settings if missing
            if (!loadedConfig.companyName) loadedConfig.companyName = s.appName || 'Stand Masr';
            if (!loadedConfig.accentColor) loadedConfig.accentColor = s.primaryColor || '#E35E35';

            // Fallbacks for seals and logos
            if (!loadedConfig.appLogo) loadedConfig.appLogo = s.appLogo || '';
            if (!loadedConfig.sealImage && s.footerSealImage) loadedConfig.sealImage = s.footerSealImage;

            setConfig(loadedConfig);
        } catch {
            setConfig({ companyName: 'Stand Masr', accentColor: '#E35E35' });
        }
    }, []);

    if (!config) return null;

    const accent = config.accentColor || '#E35E35';
    // Use custom logo from report designer, fallback to general app logo
    const logo = config.printLogoCustom || config.appLogo || '';

    return (
        <div id="print-root" dir="rtl" style={{ '--accent': accent } as React.CSSProperties}>
            {/* Header */}
            <header className="print-header" style={{ borderBottomColor: accent }}>
                {config.showLogo !== false && logo && (
                    <img
                        src={logo}
                        alt="Logo"
                        className={`print-logo ${config.logoPosition === 'left' ? 'pl-left' : 'pl-right'}`}
                        style={{ width: `${config.printLogoSize || 70}px` }}
                        crossOrigin="anonymous"
                    />
                )}
                <div className="print-company-info">
                    <h1 style={{ color: accent, fontSize: `${config.companyNameFontSize || 24}px` }}>{config.companyName}</h1>
                    {config.companySubtitle && <p style={{ fontSize: `${config.companySubtitleFontSize || 14}px` }}>{config.companySubtitle}</p>}
                </div>
            </header>

            <h2 className="print-document-title" style={{ color: accent }}>{documentTitle}</h2>

            {/* Print Body */}
            <div className="print-body">
                {children}
            </div>

            {/* Print Footer */}
            <ReportFooter />
        </div>
    );
}
