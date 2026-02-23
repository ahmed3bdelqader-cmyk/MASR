'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { label: '🏠 الرئيسية', path: '/', roles: ['ADMIN', 'ACCOUNTANT', 'INVENTORY', 'SALES', 'WORKER'] },
    { label: '👥 العملاء والتحصيلات', path: '/clients', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: '🧾 المبيعات والفواتير', path: '/sales', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: '📋 سجل الفواتير (PDF)', path: '/sales/history', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: '🏭 أوامر التصنيع', path: '/jobs', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    { label: '🎨 قسم الدهانات', path: '/paint', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: '📦 المخزن الذكي', path: '/inventory', roles: ['ADMIN', 'INVENTORY', 'ACCOUNTANT'] },
    { label: '🔩 المشتريات والمدخلات', path: '/purchases', roles: ['ADMIN', 'INVENTORY', 'ACCOUNTANT'] },
    { label: '🏷️ الكتالوج (المنتجات)', path: '/products', roles: ['ADMIN', 'INVENTORY', 'ACCOUNTANT', 'SALES'] },
    { label: '🏦 الخزينة والمصروفات', path: '/treasury', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: '👤 شؤون الموظفين', path: '/employees', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: '📊 التقارير المفصلة', path: '/reports', roles: ['ADMIN', 'ACCOUNTANT'] },
    { label: '🔏 السيمزات والأختام', path: '/seals', roles: ['ADMIN', 'ACCOUNTANT'] },
];

const subItems = [
    { label: '🛡️ إدارة الصلاحيات', path: '/permissions', roles: ['ADMIN'] },
    { label: '🗄️ إعدادات الربط والـ DB', path: '/database', roles: ['ADMIN'] },
    { label: '⚙️ الإعدادات والمظهر', path: '/settings', roles: ['ADMIN'] },
];

export default function Sidebar({ isCollapsed, onToggle }: { isCollapsed?: boolean, onToggle?: () => void }) {
    const pathname = usePathname();
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

    const [sidebarSettings, setSidebarSettings] = useState({
        sidebarOpenWidth: 250,
        sidebarClosedWidth: 80,
    });

    const sidebarWidth = isCollapsed ? `${sidebarSettings.sidebarClosedWidth}px` : `${sidebarSettings.sidebarOpenWidth}px`;

    useEffect(() => {
        try {
            const raw = localStorage.getItem('erp_settings');
            if (raw) {
                const s = JSON.parse(raw);
                if (s.appName) setAppName(s.appName);
                if (s.appLogo) setLogo(s.appLogo);
                if (s.logoSize) setLogoSize(String(Math.min(parseInt(s.logoSize), 56)));
                if (s.appVersionText) setAppVersionText(s.appVersionText);
                if (s.showLogoInUI !== undefined) setShowLogo(s.showLogoInUI);
                if (s.sidebarOpenWidth || s.sidebarClosedWidth) {
                    setSidebarSettings({
                        sidebarOpenWidth: parseInt(s.sidebarOpenWidth || '250'),
                        sidebarClosedWidth: parseInt(s.sidebarClosedWidth || '80')
                    });
                }
                if (s.sidebarBg) document.documentElement.style.setProperty('--sidebar-bg', s.sidebarBg);
                if (s.sidebarText) document.documentElement.style.setProperty('--sidebar-text', s.sidebarText);
                if (s.sidebarActive) document.documentElement.style.setProperty('--sidebar-active', s.sidebarActive);
            }

            const storedUser = localStorage.getItem('erp_user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                setUserRole(u.role || 'WORKER');
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
        window.location.href = '/login';
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
            height: '100vh',
            boxSizing: 'border-box'
        }}>
            <div style={{
                marginBottom: '1.5rem',
                padding: isCollapsed ? '1rem 0' : '1.2rem 1rem 0.5rem',
                display: 'flex',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                alignItems: 'center',
                minHeight: '80px'
            }}>
                {showLogo && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        justifyContent: isCollapsed ? 'center' : 'flex-start'
                    }}>
                        {logo ? (
                            <img src={logo} alt="Logo" style={{ width: `${isCollapsed ? '40' : logoSize}px`, height: `${isCollapsed ? '40' : logoSize}px`, objectFit: 'contain', borderRadius: 'var(--logoRadius, 10px)', flexShrink: 0, transition: 'all 0.3s' }} />
                        ) : (
                            <div style={{ width: `${isCollapsed ? '40' : logoSize}px`, height: `${isCollapsed ? '40' : logoSize}px`, background: 'var(--primary-color)', borderRadius: 'var(--logoRadius, 10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isCollapsed ? '1.2rem' : '1.5rem', flexShrink: 0, transition: 'all 0.3s' }}>🏭</div>
                        )}
                        {!isCollapsed && (
                            <div className="animate-fade-in" style={{ minWidth: 0, overflow: 'hidden' }}>
                                <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#fff', whiteSpace: 'nowrap', fontWeight: 800 }}>{appName}</h2>
                                <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', margin: 0, opacity: 0.8 }}>{appVersionText}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <nav style={{ flex: 1, overflowY: 'auto' }}>
                {menuItems.filter(checkPermission).map((item) => {
                    const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
                    const icon = item.label.split(' ')[0];
                    const label = item.label.split(' ').slice(1).join(' ');
                    const badge = getBadge(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={isActive ? 'active' : ''}
                            style={{
                                fontSize: 'var(--sidebarFontSize, 0.85rem)',
                                padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                margin: isCollapsed ? '4px 0' : '2px 8px',
                                borderRadius: isCollapsed ? '0' : '10px'
                            }}
                            title={isCollapsed ? item.label.replace(/^[^\s]+\s+/, '') : ''}
                        >
                            <span style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: isCollapsed ? '100%' : 'auto' }}>{icon}</span>
                            {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>}
                            {badge && (
                                <span style={{
                                    minWidth: '18px', height: '18px', borderRadius: '50%', background: badge.color,
                                    color: '#fff', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', padding: '0', flexShrink: 0,
                                    position: 'absolute',
                                    ...(isCollapsed ? { top: '8px', left: '15px' } : { left: '12px' })
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
                            onClick={() => setSettingsOpen(!settingsOpen)}
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
                                    const icon = item.label.split(' ')[0];
                                    const label = item.label.split(' ').slice(1).join(' ');
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={isActive ? 'active' : ''}
                                            style={{ fontSize: 'calc(var(--sidebarFontSize, 0.8rem) - 0.05rem)', padding: '0.35rem 0.8rem', opacity: isActive ? 1 : 0.8 }}
                                        >
                                            <span style={{ fontSize: '0.9rem', marginLeft: '6px' }}>{icon}</span> {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </nav>

        </aside>
    );
}
