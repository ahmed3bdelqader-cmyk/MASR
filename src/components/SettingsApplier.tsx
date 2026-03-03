'use client';
import { useEffect } from 'react';

// ── Map logoShape key → CSS border-radius value ───────────────────────────────
const SHAPE_RADIUS: Record<string, string> = {
    square: '0px',
    rounded: '12px',
    circle: '50%',
    rect: '8px',
};

export default function SettingsApplier() {
    useEffect(() => {
        try {
            const raw = localStorage.getItem('erp_settings');
            if (!raw) return;
            const s = JSON.parse(raw);
            const root = document.documentElement;
            if (s.primaryColor) root.style.setProperty('--primary-color', s.primaryColor);
            if (s.bgColor) { root.style.setProperty('--bg-color', s.bgColor); document.body.style.backgroundColor = s.bgColor; }
            if (s.sidebarBg) root.style.setProperty('--sidebar-bg', s.sidebarBg);
            if (s.sidebarText) root.style.setProperty('--sidebar-text', s.sidebarText);
            if (s.sidebarActive) root.style.setProperty('--sidebar-active', s.sidebarActive);
            if (s.cardBg) root.style.setProperty('--card-bg', s.cardBg);
            if (s.textColor) root.style.setProperty('--text-primary', s.textColor);
            if (s.textMuted) root.style.setProperty('--text-muted', s.textMuted);
            else if (s.textColor) root.style.setProperty('--text-muted', s.textColor === '#ffffff' ? '#919398' : '#555555');
            if (s.btnText) root.style.setProperty('--btn-text', s.btnText);
            if (s.fontFamily) root.style.setProperty('--font-main', s.fontFamily);
            if (s.cardShadow) root.style.setProperty('--card-shadow', s.cardShadow);
            if (s.cardHoverShadow) root.style.setProperty('--card-hover-shadow', s.cardHoverShadow);
            if (s.fontSize) document.body.style.fontSize = (Number(s.fontSize) / 100) * 16 + 'px';
            if (s.appName) document.title = s.appName + ' | ERP';

            // ── Logo shape → CSS variable ──────────────────────────────────
            const radius = SHAPE_RADIUS[s.logoShape || 'rounded'] || '12px';
            root.style.setProperty('--logo-radius', radius);
            if (s.logoSize) root.style.setProperty('--logo-size', `${s.logoSize}px`);

            if (s.menuFontSize) root.style.setProperty('--sidebar-font-size', `${s.menuFontSize}rem`);
            if (s.sidebarOpenWidth) root.style.setProperty('--sidebar-open-width', `${s.sidebarOpenWidth}px`);
            if (s.sidebarClosedWidth) root.style.setProperty('--sidebar-closed-width', `${s.sidebarClosedWidth}px`);

            // ── Dark/Light mode Specifics ──────────────────────────────────
            if (s.textColor && s.textColor !== '#ffffff' && !s.textColor.startsWith('rgba(255')) {
                root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
            } else {
                root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.08)');
            }
        } catch (e) { /* ignore */ }
    }, []);

    return null;
}
