'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Clock, Wallet, Menu, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Sidebar from './Sidebar';

const NO_SIDEBAR_PATHS = ['/login'];

const UNIFIED_SIDEBAR_OPEN = 280;
const UNIFIED_SIDEBAR_CLOSED = 80;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // UI Preferences State
    const [prefs, setPrefs] = React.useState({
        scale: 100,
        layoutMode: 'fluid',
        sidebarCollapsed: false,
        forceDesktop: false,
    });

    const showSidebar = !NO_SIDEBAR_PATHS.some(p => pathname.startsWith(p));

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        setMounted(true);
        // Apply special theme effects based on the UI prefs
        try {
            const prefs = JSON.parse(localStorage.getItem('erp_ui_prefs') || '{}');
            document.body.className = document.body.className.replace(/rgb-[a-z-]+|ramadan-theme/gi, '').trim();
            if (prefs.isRGB) {
                const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
                // Retrieve the saved type from erp_settings to get the exact RGB variant
                const colorThemeType = s.themeType || 'rgb-theme';
                document.body.classList.add(colorThemeType.startsWith('rgb') ? colorThemeType : 'rgb-theme');
            }
            if (prefs.isRamadan) {
                document.body.classList.add('ramadan-theme');
            }
        } catch (e) { }

        window.addEventListener('resize', checkMobile);

        // Load Prefs
        const savedPrefs = localStorage.getItem('erp_ui_prefs');
        if (savedPrefs) {
            try {
                const p = JSON.parse(savedPrefs);
                setPrefs(prev => ({ ...prev, ...p }));
                setCollapsed(p.sidebarCollapsed || false);
            } catch (e) { }
        }

        // Load Theme (erp_settings)
        const savedSettings = localStorage.getItem('erp_settings');
        if (savedSettings) {
            try {
                const s = JSON.parse(savedSettings);
                const root = document.documentElement;
                if (s.primaryColor) root.style.setProperty('--primary-color', s.primaryColor);
                if (s.bgColor) root.style.setProperty('--bg-color', s.bgColor);
                if (s.sidebarBg) root.style.setProperty('--sidebar-bg', s.sidebarBg);
                if (s.sidebarText) root.style.setProperty('--sidebar-text', s.sidebarText);
                if (s.sidebarActive) root.style.setProperty('--sidebar-active', s.sidebarActive);
                if (s.cardBg) root.style.setProperty('--card-bg', s.cardBg);
                if (s.textColor) root.style.setProperty('--text-primary', s.textColor);
                if (s.textMuted) root.style.setProperty('--text-muted', s.textMuted);
                if (s.btnText) root.style.setProperty('--btn-text', s.btnText);
                if (s.borderRadius) root.style.setProperty('--border-radius', s.borderRadius + 'px');
                if (s.fontFamily) root.style.setProperty('--font-main', s.fontFamily);

                // Secondary backgrounds
                const isLight = s.bgColor === '#fbfbfb' || s.bgColor === '#ffffff' || s.bgColor === '#f8f9fa';
                root.style.setProperty('--btn-secondary-bg', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)');
                root.style.setProperty('--btn-secondary-text', isLight ? '#333' : '#ffffff');
                root.style.setProperty('--input-bg-glass', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)');

                document.body.style.backgroundColor = s.bgColor || '';
            } catch (e) { }
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, [pathname]);

    // Apply Prefs Side effects
    React.useEffect(() => {
        if (!mounted) return;

        // 1. UI Scaling
        document.documentElement.style.fontSize = `${prefs.scale}%`;

        // 2. Sidebar sync
        if (prefs.sidebarCollapsed !== collapsed) {
            setCollapsed(prefs.sidebarCollapsed);
        }

        // 3. Force Desktop Viewport
        if (prefs.forceDesktop && window.innerWidth <= 1024) {
            let meta = document.querySelector('meta[name="viewport"]');
            if (meta) {
                meta.setAttribute('content', 'width=1200, initial-scale=0.8, maximum-scale=2');
            }
        } else {
            let meta = document.querySelector('meta[name="viewport"]');
            if (meta) {
                meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=false');
            }
        }

        // Save
        localStorage.setItem('erp_ui_prefs', JSON.stringify(prefs));
    }, [prefs, mounted]);

    const handleToggleCollapse = () => {
        const newCollapsed = !collapsed;
        setCollapsed(newCollapsed);
        setPrefs(p => ({ ...p, sidebarCollapsed: newCollapsed }));
    };

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="app-container">
            {/* Mobile Overlay */}
            {isMobile && mobileOpen && (
                <div
                    className="mobile-menu-overlay visible"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`sidebar-wrapper-shell ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`} style={{ position: 'fixed', zIndex: 2005 }}>
                <Sidebar
                    isCollapsed={!isMobile && collapsed}
                    onToggle={handleToggleCollapse}
                    isMobile={isMobile}
                    onMobileClose={() => setMobileOpen(false)}
                    onLinkClick={isMobile ? () => setMobileOpen(false) : undefined}
                />

                {/* ── Desktop Floating Toggle (Boundary) ──────────────── */}
                {!isMobile && (
                    <button
                        onClick={handleToggleCollapse}
                        className="sidebar-edge-toggle"
                        title={collapsed ? "توسيع" : "تصغير"}
                    >
                        {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
            </div>

            <main className={`main-content-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="content-centered-wrapper" style={{
                    maxWidth: prefs.layoutMode === 'boxed' ? '1820px' : 'none',
                    margin: '0 auto',
                    width: '100%',
                    transition: 'all 0.3s ease'
                }}>
                    {/* Header with toggle is removed and moved to dock/sidebar */}

                    {children}
                </div>
            </main>

            {/* Bottom Actions Dock */}
            <div className="bottom-actions-dock">
                {isMobile && (
                    <>
                        <button
                            aria-label="القائمة"
                            onClick={() => setMobileOpen(true)}
                            className="dock-btn"
                            title="القائمة"
                            style={{ color: '#ab47bc' }}
                        >
                            <Menu size={16} strokeWidth={2} /> <span>القائمة</span>
                        </button>
                        <div className="dock-divider"></div>
                    </>
                )}

                <button
                    aria-label="الصفحة الرئيسية"
                    onClick={() => window.location.href = '/'}
                    className="dock-btn dock-btn-home"
                    title="الصفحة الرئيسية"
                >
                    <Home size={16} strokeWidth={2} /> <span>الرئيسية</span>
                </button>
                <div className="dock-divider"></div>
                <button
                    aria-label="الحضور والانصراف"
                    onClick={() => window.location.href = '/employees/attendance'}
                    className="dock-btn"
                    title="الحضور والانصراف"
                >
                    <Clock size={16} strokeWidth={2} /> <span>الحضور والانصراف</span>
                </button>
                <div className="dock-divider"></div>
                <button
                    aria-label="الخزينة والمصروفات"
                    onClick={() => window.location.href = '/treasury'}
                    className="dock-btn dock-btn-treasury"
                    title="الخزينة والمصروفات"
                >
                    <Wallet size={16} strokeWidth={2} /> <span>المصروفات</span>
                </button>
            </div>


            <style jsx>{`
                .sidebar-wrapper-shell {
                    position: fixed;
                    right: ${isMobile ? (mobileOpen ? '0' : '-300px') : '0'};
                    top: 0;
                    z-index: 2005;
                    height: 100dvh;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    width: ${isMobile ? '280px' : (collapsed ? '80px' : '280px')};
                }
                .main-content-shell {
                    margin-right: ${isMobile ? '0' : (collapsed ? '80px' : '280px')};
                    padding-right: ${isMobile ? '10px' : '45px'};
                    padding-left: ${isMobile ? '10px' : '0'};
                    padding-top: ${isMobile ? '5px' : '0'};
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-height: 100vh;
                    width: 100%;
                    max-width: 100vw;
                    padding-bottom: 90px; /* Space for the dock */
                }
                
                /* ── Floating Actions Dock ── */
                .bottom-actions-dock {
                    position: fixed;
                    bottom: 25px;
                    left: 25px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--sidebar-bg);
                    -webkit-backdrop-filter: blur(25px);
                    backdrop-filter: blur(25px);
                    padding: 8px 12px;
                    border-radius: 999px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05);
                    z-index: 1000;
                    transition: var(--transition-smooth, all 0.3s ease);
                }
                
                @media (min-width: 1025px) {
                    .bottom-actions-dock {
                        display: none;
                    }
                }
                
                .dock-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 0 4px;
                }
                
                .dock-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: transparent;
                    border: none;
                    color: var(--sidebar-text);
                    padding: 6px 14px;
                    border-radius: 999px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                }
                
                .dock-btn:hover {
                    background: var(--primary-color);
                    color: var(--btn-text);
                    transform: translateY(-2px);
                }
                
                .dock-btn-home {
                    color: #81d4fa;
                }
                .dock-btn-home:hover {
                    background: rgba(129, 212, 250, 0.12);
                    color: #81d4fa;
                    box-shadow: 0 0 15px rgba(129, 212, 250, 0.2);
                }
                
                .dock-btn-treasury {
                    color: #ffb74d;
                }
                .dock-btn-treasury:hover {
                    background: rgba(255, 183, 77, 0.15);
                    color: #ffb74d;
                    box-shadow: 0 0 15px rgba(255, 183, 77, 0.2);
                }

                .sidebar-edge-toggle {
                    position: absolute;
                    top: 85px;
                    left: -14px;
                    width: 28px;
                    height: 28px;
                    background: var(--primary-color);
                    border: 4px solid var(--bg-color);
                    border-radius: 50%;
                    color: var(--btn-text);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 2010;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    padding: 0;
                }
                .sidebar-edge-toggle:hover {
                    transform: scale(1.1);
                    background: #ff8a65;
                }

                @media (max-width: 1024px) {
                    .sidebar-wrapper-shell {
                        right: ${mobileOpen ? '0' : '-300px'};
                    }
                    .main-content-shell {
                        margin-right: 0 !important;
                        margin-left: 0 !important;
                        padding-right: 10px !important;
                        padding-left: 10px !important;
                        width: 100% !important;
                    }
                    .sidebar-edge-toggle {
                        display: none;
                    }
                }
                
                @media (max-width: 768px) {
                    .bottom-actions-dock {
                        left: 50%;
                        transform: translateX(-50%);
                        bottom: 12px;
                        width: 92%;
                        min-width: 0;
                        justify-content: space-between;
                        padding: 8px 10px;
                        gap: 4px;
                        border-radius: 20px;
                        background: rgba(18, 20, 24, 0.9);
                    }
                    .dock-btn {
                        flex-direction: column;
                        gap: 2px;
                        padding: 6px 2px;
                        flex: 1;
                        font-size: 0.65rem;
                        min-width: 0;
                        text-align: center;
                        font-family: 'Tajawal', 'Cairo', sans-serif;
                    }
                    .dock-btn span {
                        font-weight: 600;
                        opacity: 0.9;
                        letter-spacing: -0.01em;
                    }
                    .dock-divider {
                        display: none;
                    }
                }
            `}</style>
        </div >
    );
}
