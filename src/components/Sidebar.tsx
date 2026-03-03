'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Home, Users, Receipt, FileText, Factory, Paintbrush, Package, Truck, Wrench, Tags, Wallet, UserCircle, BarChart3, Stamp, Shield, Database, Settings, LogOut } from 'lucide-react';

const menuItems = [
    { label: 'الرئيسية', icon: <Home size={24} strokeWidth={1.5} />, path: '/', roles: ['ADMIN', 'ACCOUNTANT', 'INVENTORY', 'SALES', 'WORKER'] },
    { label: 'المدخل الذكي', icon: <FileText size={24} strokeWidth={1.5} />, path: '/smart-entry', roles: ['ADMIN', 'ACCOUNTANT', 'INVENTORY', 'SALES'] },
    { label: 'العملاء والتحصيلات', icon: <Users size={24} strokeWidth={1.5} />, path: '/clients', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: 'المبيعات والفواتير', icon: <Receipt size={24} strokeWidth={1.5} />, path: '/sales', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: 'سجل الفواتير (PDF)', icon: <FileText size={24} strokeWidth={1.5} />, path: '/sales/history', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: 'أوامر التصنيع', icon: <Factory size={24} strokeWidth={1.5} />, path: '/jobs', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: 'قسم الدهانات', icon: <Paintbrush size={24} strokeWidth={1.5} />, path: '/paint', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: 'المخزن الذكي', icon: <Package size={24} strokeWidth={1.5} />, path: '/inventory', roles: ['ADMIN', 'INVENTORY', 'ACCOUNTANT'] },
    { label: 'إدارة الموردين', icon: <Truck size={24} strokeWidth={1.5} />, path: '/suppliers', roles: ['ADMIN', 'ACCOUNTANT', 'INVENTORY'] },
    { label: 'المشتريات والمدخلات', icon: <Wrench size={24} strokeWidth={1.5} />, path: '/purchases', roles: ['ADMIN', 'INVENTORY', 'ACCOUNTANT'] },
    { label: 'الكتالوج (المنتجات)', icon: <Tags size={24} strokeWidth={1.5} />, path: '/products', roles: ['ADMIN', 'INVENTORY', 'ACCOUNTANT', 'SALES'] },
    { label: 'الخزينة والمصروفات', icon: <Wallet size={24} strokeWidth={1.5} />, path: '/treasury', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: 'شؤون الموظفين', icon: <UserCircle size={24} strokeWidth={1.5} />, path: '/employees', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: 'التقارير المفصلة', icon: <BarChart3 size={24} strokeWidth={1.5} />, path: '/reports', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: 'التقارير والأختام', icon: <Stamp size={24} strokeWidth={1.5} />, path: '/reports/designer', roles: ['ADMIN', 'ACCOUNTANT'] },
];

const subItems = [
    { label: 'إدارة الصلاحيات', icon: <Shield size={24} strokeWidth={1.5} />, path: '/permissions', roles: ['ADMIN'] },
    { label: 'إعدادات الربط', icon: <Database size={24} strokeWidth={1.5} />, path: '/database', roles: ['ADMIN'] },
    { label: 'الإعدادات والمظهر', icon: <Settings size={24} strokeWidth={1.5} />, path: '/settings', roles: ['ADMIN'] },
];

const SIDEBAR_WIDTH_OPEN = 280;
const SIDEBAR_WIDTH_CLOSED = 80;

export default function Sidebar({ isCollapsed, onToggle, isMobile, onMobileClose, onLinkClick }: {
    isCollapsed?: boolean;
    onToggle?: () => void;
    isMobile?: boolean;
    onMobileClose?: () => void;
    onLinkClick?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [appName, setAppName] = useState('Stand Masr');
    const [logo, setLogo] = useState('');
    const [logoSize, setLogoSize] = useState('44');
    const [userRole, setUserRole] = useState('WORKER');
    const [userName, setUserName] = useState('');
    const [dynamicPermissions, setDynamicPermissions] = useState<Record<string, string[]>>({});
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showLogo, setShowLogo] = useState(true);
    const [appVersionText, setAppVersionText] = useState('ERP System v2.0');

    // Notification badges
    const [lowStockCount, setLowStockCount] = useState(0);
    const [activeJobsCount, setActiveJobsCount] = useState(0);

    const sidebarWidth = isCollapsed ? `${SIDEBAR_WIDTH_CLOSED}px` : `${SIDEBAR_WIDTH_OPEN}px`;

    useEffect(() => {
        try {
            const raw = localStorage.getItem('erp_settings');
            if (raw) {
                const s = JSON.parse(raw);
                if (s.appName) setAppName(s.appName);
                if (s.appLogo) setLogo(s.appLogo);
                if (s.logoSize) setLogoSize(String(Math.min(parseInt(s.logoSize), 64)));
                if (s.appVersionText) setAppVersionText(s.appVersionText);
                if (s.showLogoInUI !== undefined) setShowLogo(s.showLogoInUI);
                if (s.sidebarBg) document.documentElement.style.setProperty('--sidebar-bg', s.sidebarBg);
                if (s.sidebarText) document.documentElement.style.setProperty('--sidebar-text', s.sidebarText);
                if (s.sidebarActive) document.documentElement.style.setProperty('--sidebar-active', s.sidebarActive);
            }

            const storedUser = localStorage.getItem('erp_user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                setUserRole((u.role || 'WORKER').toUpperCase());
                setUserName(u.name || '');

                // Active Ping
                if (u.id) {
                    const pingStatus = () => {
                        fetch('/api/auth/ping', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: u.id })
                        }).catch(() => { });
                    };
                    pingStatus(); // Initial ping
                    const interval = setInterval(pingStatus, 2 * 60 * 1000); // Ping every 2 mins
                    return () => clearInterval(interval);
                }
            } else if (localStorage.getItem('erp_logged_in') === 'true') {
                setUserRole('ADMIN');
            }

            const loadPerms = async () => {
                try {
                    const local = localStorage.getItem('erp_role_permissions');
                    if (local) setDynamicPermissions(JSON.parse(local));
                    const res = await fetch('/api/settings/permissions');
                    if (res.ok) {
                        const data = await res.json();
                        setDynamicPermissions(data);
                        localStorage.setItem('erp_role_permissions', JSON.stringify(data));
                    }
                } catch { }
            };
            loadPerms();
        } catch { }

        // Load notification counts
        const loadBadges = async () => {
            try {
                const [invRes, jobsRes] = await Promise.all([
                    fetch('/api/inventory').then(r => r.json()).catch(() => []),
                    fetch('/api/jobs').then(r => r.json()).catch(() => []),
                ]);
                const stockAlerts: Record<string, number> = (() => { try { return JSON.parse(localStorage.getItem('erp_stock_alerts') || '{}'); } catch { return {}; } })();
                if (Array.isArray(invRes)) {
                    const low = invRes.filter((i: any) => i.category !== 'MANUFACTURED_PRICING' && i.stock <= (stockAlerts[i.id] ?? 10)).length;
                    setLowStockCount(low);
                }
                if (Array.isArray(jobsRes)) {
                    const active = jobsRes.filter((j: any) => j.status !== 'COMPLETED').length;
                    setActiveJobsCount(active);
                }
            } catch { }
        };
        loadBadges();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('erp_logged_in');
        localStorage.removeItem('erp_login_time');
        localStorage.removeItem('erp_user');
        router.push('/login');
    };

    const checkPermission = (item: typeof menuItems[0]) => {
        if (userRole === 'ADMIN') return true;
        const allowedRoles = dynamicPermissions[item.path];
        if (allowedRoles) return allowedRoles.includes(userRole);
        return item.roles.includes(userRole);
    };

    const getBadge = (path: string) => {
        if (path === '/inventory' && lowStockCount > 0) return { count: lowStockCount, color: '#E35E35' };
        if (path === '/jobs' && activeJobsCount > 0) return { count: activeJobsCount, color: '#ffa726' };
        return null;
    };

    return (
        <aside className="sidebar" style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            boxSizing: 'border-box',
            borderLeft: '1px solid rgba(255,255,255,0.03)'
        }}>
            {/* ── Sidebar Header: Logo & Branding ────────────────────────────────── */}
            <div style={{
                padding: isCollapsed ? '1rem 0' : '1.5rem 1rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isCollapsed ? 'center' : 'flex-start',
                minHeight: isCollapsed ? '80px' : '90px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '0.5rem',
                transition: 'all 0.3s',
                position: 'relative',
                gap: '10px'
            }}>
                {showLogo && !isCollapsed && (
                    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minWidth: 0 }}>
                        {logo ? (
                            <img src={logo} alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                        ) : (
                            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--primary-color), #ff8a65)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, color: '#fff', boxShadow: '0 4px 12px rgba(227,94,53,0.2)' }}>🏭</div>
                        )}
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--sidebar-text, #fff)', whiteSpace: 'nowrap', fontWeight: 800, letterSpacing: '-0.02em' }}>{appName}</h2>
                            <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', margin: '1px 0 0', opacity: 0.9, fontWeight: 700 }}>{appVersionText}</p>
                        </div>
                    </div>
                )}

                {showLogo && isCollapsed && (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', animation: 'fadeIn 0.4s ease', marginBottom: '10px' }}>
                        {logo ? (
                            <img src={logo} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }} />
                        ) : (
                            <div style={{ width: '36px', height: '36px', background: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff', boxShadow: '0 4px 10px rgba(227,94,53,0.3)' }}>🏭</div>
                        )}
                    </div>
                )}

                {/* Toggle Button Removed from here */}
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '0 10px' : '0 12px' }}>
                {menuItems.filter(checkPermission).map((item) => {
                    const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
                    const icon = item.icon || item.label.split(' ')[0];
                    const label = item.icon ? item.label : item.label.split(' ').slice(1).join(' ');
                    const badge = getBadge(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={isActive ? 'sidebar-link active' : 'sidebar-link'}
                            onClick={isMobile ? onLinkClick : undefined}
                            style={{
                                fontSize: '0.92rem',
                                padding: isCollapsed ? '0.8rem 0' : '0.75rem 1rem',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isCollapsed ? '0' : '12px',
                                margin: isCollapsed ? '4px 8px' : '4px 12px',
                                borderRadius: '12px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                color: isActive ? 'var(--btn-text, #fff)' : 'var(--sidebar-text, rgba(255,255,255,0.65))',
                                background: isActive ? 'var(--sidebar-active, rgba(255,255,255,0.08))' : 'transparent',
                            }}
                            title={isCollapsed ? item.label : ''}
                        >
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                flexShrink: 0,
                                color: isActive ? 'var(--btn-text, #fff)' : 'var(--sidebar-text, #fff)'
                            }}>{icon}</span>
                            {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 500 }}>{label}</span>}
                            {badge && (
                                <span style={{
                                    minWidth: '20px', height: '20px', borderRadius: '50%', background: badge.color,
                                    color: '#fff', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', padding: '0', flexShrink: 0,
                                    position: 'absolute',
                                    ...(isCollapsed ? { top: '6px', left: '12px' } : { left: '12px' }),
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    border: '2px solid var(--sidebar-bg)'
                                }}>
                                    {badge.count}
                                </span>
                            )}
                        </Link>
                    );
                })}

                {userRole === 'ADMIN' && (
                    <>
                        <div
                            onClick={() => { setSettingsOpen(!settingsOpen); if (isMobile && settingsOpen) onLinkClick?.(); }
                            }
                            style={{
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: isCollapsed ? 'center' : 'space-between',
                                fontSize: 'var(--sidebarFontSize, 0.8rem)', padding: '0.4rem 0.8rem',
                                color: settingsOpen ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                                background: settingsOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
                                borderRadius: '8px', transition: 'all 0.3s'
                            }}
                            title={isCollapsed ? '⚙️ الإعدادات العامة' : ''}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.05rem' }}>⚙️</span>
                                {!isCollapsed && 'الإعدادات العامة'}
                            </span>
                            {!isCollapsed && (
                                <span style={{ fontSize: '0.7rem', transition: 'transform 0.3s', transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                            )}
                        </div>

                        {settingsOpen && !isCollapsed && (
                            <div style={{ marginRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {subItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    const icon = item.icon || item.label.split(' ')[0];
                                    const label = item.icon ? item.label : item.label.split(' ').slice(1).join(' ');
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={isActive ? 'active' : ''}
                                            onClick={isMobile ? onLinkClick : undefined}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'calc(var(--sidebarFontSize, 0.8rem) - 0.05rem)', padding: '0.35rem 0.8rem', opacity: isActive ? 1 : 0.8 }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', width: '20px', height: '20px', justifyContent: 'center' }}>
                                                {icon}
                                            </span>
                                            <span>{label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </nav>

            {/* ── Bottom: User Info + Logout ─────────────────────────────────── */}
            <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: isCollapsed ? '12px 8px' : '12px 16px',
                display: 'flex',
                flexDirection: isCollapsed ? 'column' : 'row',
                alignItems: 'center',
                gap: '10px',
                marginTop: 'auto',
            }}>
                {/* User Info */}
                {!isCollapsed && (
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--sidebar-text, rgba(255,255,255,0.85))', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userName || 'المستخدم'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                            {userRole === 'ADMIN' ? '👑 مدير النظام' : userRole === 'ACCOUNTANT' ? '💼 محاسب' : userRole === 'INVENTORY' ? '📦 مخزن' : userRole === 'SALES' ? '🛒 مبيعات' : '👷 موظف'}
                        </p>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    title="تسجيل الخروج"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isCollapsed ? '0' : '8px',
                        padding: isCollapsed ? '10px' : '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(239,68,68,0.25)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        width: isCollapsed ? '42px' : 'auto',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)'; }}
                >
                    <LogOut size={16} />
                    {!isCollapsed && <span>تسجيل الخروج</span>}
                </button>
            </div>

        </aside>
    );
}
