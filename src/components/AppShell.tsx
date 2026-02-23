'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const NO_SIDEBAR_PATHS = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const [isHoveringMargin, setIsHoveringMargin] = React.useState(false);

    const [s, setS] = React.useState({
        sidebarOpenWidth: 250,
        sidebarClosedWidth: 80,
        sidebarTogglePos: 'top',
        sidebarToggleSize: 'medium',
        sidebarToggleStyle: 'floating',
        sidebarAutoHideToggle: true
    });

    const showSidebar = !NO_SIDEBAR_PATHS.some(p => pathname.startsWith(p));

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const raw = localStorage.getItem('erp_settings');
        if (raw) {
            const parsed = JSON.parse(raw);
            setS(prev => ({
                ...prev,
                sidebarOpenWidth: parseInt(parsed.sidebarOpenWidth || '250'),
                sidebarClosedWidth: parseInt(parsed.sidebarClosedWidth || '80'),
                sidebarTogglePos: parsed.sidebarTogglePos || 'top',
                sidebarToggleSize: parsed.sidebarToggleSize || 'medium',
                sidebarToggleStyle: parsed.sidebarToggleStyle || 'floating',
                sidebarAutoHideToggle: parsed.sidebarAutoHideToggle !== undefined ? parsed.sidebarAutoHideToggle : true
            }));
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, [pathname]);

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="app-container" style={{ display: 'flex' }}>
            {/* Mobile Overlay */}
            <div
                className={`mobile-menu-overlay ${mobileOpen ? 'visible' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar Container */}
            <div style={{
                position: 'fixed',
                right: isMobile ? (mobileOpen ? '0' : '-280px') : '0',
                top: 0,
                zIndex: 2005,
                transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100vh',
                background: 'var(--sidebar-bg)'
            }}
                onMouseEnter={() => setIsHoveringMargin(true)}
                onMouseLeave={() => setIsHoveringMargin(false)}>
                <Sidebar
                    isCollapsed={!isMobile && collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                />
            </div>

            <main
                className="main-content"
                onMouseMove={() => setIsHoveringMargin(true)}
                onMouseLeave={() => setIsHoveringMargin(false)}
                style={{
                    flex: 1,
                    transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginRight: isMobile ? '0' : (collapsed ? `${s.sidebarClosedWidth}px` : `${s.sidebarOpenWidth}px`),
                    width: '100%',
                    padding: isMobile ? '0.8rem' : '1.5rem',
                    height: '100vh',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}
            >
                {/* Desktop Toggle Button */}
                {!isMobile && (
                    <button
                        className="desktop-only"
                        onClick={() => setCollapsed(!collapsed)}
                        onMouseEnter={() => setIsHoveringMargin(true)}
                        style={{
                            position: 'fixed',
                            top: s.sidebarTogglePos === 'top' ? '20px' : s.sidebarTogglePos === 'middle' ? '50%' : 'auto',
                            bottom: s.sidebarTogglePos === 'bottom' ? '20px' : 'auto',
                            transform: s.sidebarTogglePos === 'middle' ? 'translateY(-50%)' : 'none',
                            right: s.sidebarToggleStyle === 'floating'
                                ? (collapsed ? `${s.sidebarClosedWidth + 10}px` : `${s.sidebarOpenWidth + 10}px`)
                                : (collapsed ? `${s.sidebarClosedWidth - 1}px` : `${s.sidebarOpenWidth - 1}px`),
                            zIndex: 2100,
                            background: s.sidebarToggleStyle === 'floating' ? 'var(--primary-color)' : 'transparent',
                            color: s.sidebarToggleStyle === 'floating' ? '#fff' : 'var(--primary-color)',
                            border: s.sidebarToggleStyle === 'floating' ? 'none' : `1px solid var(--border-color)`,
                            borderRight: s.sidebarToggleStyle === 'floating' ? 'none' : 'none',
                            width: s.sidebarToggleSize === 'small' ? '24px' : s.sidebarToggleSize === 'large' ? '40px' : '32px',
                            height: s.sidebarToggleSize === 'small' ? '24px' : s.sidebarToggleSize === 'large' ? '40px' : '32px',
                            borderRadius: s.sidebarToggleStyle === 'floating' ? '8px' : '8px 0 0 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: s.sidebarToggleStyle === 'floating' ? '0 4px 15px rgba(0,0,0,0.3)' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: s.sidebarAutoHideToggle ? (isHoveringMargin ? 1 : 0) : 1,
                            pointerEvents: s.sidebarAutoHideToggle && !isHoveringMargin ? 'none' : 'auto',
                            backdropFilter: s.sidebarToggleStyle === 'border' ? 'blur(10px)' : 'none'
                        }}
                    >
                        {collapsed ? '◀' : '▶'}
                    </button>
                )}

                {/* Mobile Menu Button */}
                <button
                    className="mobile-only"
                    onClick={() => setMobileOpen(true)}
                    style={{
                        position: 'fixed',
                        top: '15px',
                        left: '15px',
                        zIndex: 1000,
                        background: 'var(--primary-color)',
                        color: '#fff',
                        border: 'none',
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(227,94,53,0.3)',
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>☰</span>
                </button>

                {children}
            </main>
        </div>
    );
}
