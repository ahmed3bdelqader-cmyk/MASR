'use client';
/**
 * WhatsAppBtn — Simple WhatsApp button
 * Fetches template from DB, replaces smart tags, cleans phone, opens wa.me
 */
import React, { useState } from 'react';

export interface WhatsAppBtnProps {
    /** Phone number (any format — will be cleaned + +20 prefixed if EG) */
    phone: string;
    /** Template type key e.g. 'sales' | 'clients' | 'employees' | 'treasury' | 'inventory' */
    templateType?: string;
    /** Smart tag values e.g. { '[اسم_الطرف]': 'أحمد' } */
    templateData?: Record<string, string>;
    /** Fallback plain message if no template found */
    fallbackMessage?: string;
    /** Button size variant */
    size?: 'sm' | 'md';
    /** Show label next to icon */
    showLabel?: boolean;
    className?: string;
}

export default function WhatsAppBtn({
    phone,
    templateType,
    templateData = {},
    fallbackMessage = 'مرحباً',
    size = 'md',
    showLabel = false,
    className = '',
}: WhatsAppBtnProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!phone) return;
        setLoading(true);
        try {
            let message = fallbackMessage;

            // Try to fetch template from DB
            if (templateType) {
                try {
                    const [settingsRes, templatesRes] = await Promise.all([
                        fetch('/api/settings').then(r => r.json()),
                        fetch('/api/whatsapp-templates').then(r => r.json()),
                    ]);

                    let config: any = {};
                    if (settingsRes?.report_config) {
                        try { config = JSON.parse(settingsRes.report_config); } catch { /**/ }
                    }

                    const tmpl = Array.isArray(templatesRes)
                        ? templatesRes.find((t: any) => t.type === templateType && t.active !== false)
                        : null;

                    if (tmpl?.message) {
                        let msg = tmpl.message;
                        for (const [tag, val] of Object.entries(templateData)) {
                            msg = msg.replaceAll(tag, val);
                        }
                        const parts: string[] = [];
                        if (config.waWelcomeEnabled !== false && config.waWelcomeMessage) {
                            parts.push(config.waWelcomeMessage);
                        }
                        parts.push(msg.trim());
                        if (config.waFooterEnabled !== false && config.waFooterMessage) {
                            parts.push(config.waFooterMessage);
                        }
                        message = parts.join('\n\n');
                    }
                } catch {
                    // fallback to plain message
                }
            }

            // Clean + format phone
            let clean = phone.replace(/[\s\-\(\)\.]/g, '');
            if (clean.startsWith('01') && clean.length === 11) {
                clean = '+20' + clean.substring(1);
            } else if (!clean.startsWith('+')) {
                clean = '+' + clean;
            }

            window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
        } finally {
            setLoading(false);
        }
    };

    const smStyle = size === 'sm'
        ? { padding: '4px 8px', fontSize: '0.8rem', borderRadius: '6px', minWidth: 'unset' }
        : { padding: '7px 14px', fontSize: '0.9rem', borderRadius: '8px' };

    return (
        <button
            onClick={handleClick}
            disabled={loading || !phone}
            title={phone ? `واتساب: ${phone}` : 'لا يوجد رقم هاتف'}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: phone ? '#25D366' : '#555',
                color: '#fff',
                border: 'none',
                cursor: phone ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                ...smStyle,
            }}
            className={className}
        >
            {loading ? '⏳' : '💬'}
            {showLabel && <span>واتساب</span>}
        </button>
    );
}
