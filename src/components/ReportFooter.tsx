'use client';
import React, { useEffect, useState } from 'react';
import { fetchReportTemplate, ReportTemplate } from '@/core/reportTemplate';

export function useReportFooter() {
    const [config, setConfig] = useState<ReportTemplate | null>(null);

    useEffect(() => {
        fetchReportTemplate().then(setConfig).catch(console.error);
    }, []);

    return config;
}

export default function ReportFooter() {
    const config = useReportFooter();

    if (!config || !config.showFooter) return null;

    const accent = config.accentColor || '#E35E35';

    // Social icons helper
    const socials = [
        { val: config.whatsapp, icon: '📞' },
        { val: config.facebook, icon: 'f' },
        { val: config.instagram, icon: '📸' },
        { val: config.website, icon: '🌐' },
        { val: config.youtube, icon: '▶' },
        { val: config.tiktok, icon: '♪' },
        { val: config.pinterest, icon: 'P' },
    ].filter(s => s.val);

    const mapAlign = (align?: string) => {
        if (align === 'left') return 'flex-end';
        if (align === 'right') return 'flex-start';
        return 'center';
    };

    return (
        <footer className="report-footer-container">
            <style jsx>{`
                .report-footer-container {
                    margin-top: 40px;
                    border-top: 1px solid #eee;
                    padding-top: 15px;
                    text-align: ${config.footerAlign || 'center'};
                    width: 100%;
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
                .footer-message-text {
                    font-size: ${config.footerFontSize || 13}px;
                    color: #666;
                    margin-bottom: 10px;
                }
                .social-links-wrapper {
                    display: flex;
                    gap: 10px;
                    justify-content: ${mapAlign(config.socialAlign)};
                    margin-bottom: 15px;
                }
                .seal-img-wrapper {
                    display: flex;
                    justify-content: ${mapAlign(config.sealAlign)};
                    marginTop: 15px;
                }
                .report-seal-image {
                    max-width: ${config.sealSize || 120}px;
                    max-height: ${config.sealSize || 120}px;
                    object-fit: contain;
                }
                .footer-timestamp-meta {
                    font-size: 0.7rem;
                    color: #999;
                    margin-top: 20px;
                    text-align: center;
                }
            `}</style>

            <div className="footer-message-text">
                {config.footerText || 'تم الطباعة من نظام إدارة المصنع'}
            </div>

            {socials.length > 0 && (
                <div className="social-links-wrapper">
                    {socials.map((s, idx) => (
                        <span key={idx} className="social-icon">{s.icon}</span>
                    ))}
                </div>
            )}

            {config.sealImage && (
                <div className="seal-img-wrapper">
                    <img
                        src={config.sealImage}
                        alt="Seal"
                        crossOrigin="anonymous"
                        className="report-seal-image"
                    />
                </div>
            )}

            <div className="footer-timestamp-meta">
                طبع بواسطة نظام {config.companyName || 'Stand Masr'} — {new Date().toLocaleString('ar-EG')}
            </div>
        </footer>
    );
}

// Helper for window.print() vanilla HTML string generation
export function buildReportFooterHTML(footerSealImage: string, footerSealAlign: string) {
    if (!footerSealImage) return '';
    const alignMap = {
        'right': 'right',
        'center': 'center',
        'left': 'left',
    };
    const textAlign = alignMap[footerSealAlign as keyof typeof alignMap] || 'right';

    return `
        <div style="margin-top: 40px; padding-top: 20px; text-align: ${textAlign}; border-top: 2px solid #ccc; width: 100%;">
            <img src="${footerSealImage}" alt="Seal" style="max-width: 250px; max-height: 120px; object-fit: contain;" crossorigin="anonymous" />
        </div>
    `;
}
