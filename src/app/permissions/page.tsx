'use client';
import React, { useEffect, useState } from 'react';

type Employee = {
    id: string;
    name: string;
    username: string;
    role: string;
    canLogin: boolean;
    department: string;
    lastLogin?: string;
    lastActive?: string;
};

const MODULES = [
    { key: '/clients', label: '👥 العملاء والتحصيلات' },
    { key: '/suppliers', label: '🤝 الموردين والحسابات' },
    { key: '/sales', label: '🧾 المبيعات والفواتير' },
    { key: '/purchases', label: '🔩 المشتريات والمدخلات' },
    { key: '/inventory', label: '📦 المخزن الذكي' },
    { key: '/jobs', label: '🏭 أوامر التصنيع' },
    { key: '/paint', label: '🎨 قسم الدهانات' },
    { key: '/products', label: '🏷️ الكتالوج (المنتجات)' },
    { key: '/treasury', label: '🏦 الخزينة والمصروفات' },
    { key: '/employees', label: '👤 شؤون الموظفين' },
    { key: '/reports', label: '📊 التقارير والإحصائيات' },
    { key: '/seals', label: '🔏 الأختام والتوقيعات' },
    { key: '/permissions', label: '🛡️ إدارة الصلاحيات' },
    { key: '/database', label: '🗄️ إعدادات قاعدة البيانات' },
    { key: '/settings', label: '⚙️ الإعدادات والمظهر' },
    { key: '/print-template', label: '🖨 قالب الطباعة' },
];

const ROLES = ['ACCOUNTANT', 'SALES', 'INVENTORY', 'WORKER'];

export default function PermissionsPage() {
    const [users, setUsers] = useState<Employee[]>([]);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
    const [isMobile, setIsMobile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);
        } catch { }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, permRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/settings/permissions')
            ]);

            const usersData = await usersRes.json();
            const permData = await permRes.json();

            if (Array.isArray(usersData)) {
                setUsers(usersData.filter((e: any) => e.canLogin));
            }
            setPermissions(permData);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        setMsg('جاري تحديث دور الموظف...');
        try {
            const res = await fetch('/api/employees', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: newRole })
            });

            if (res.ok) {
                setMsg('✅ تم تحديث الدور بنجاح');
                fetchData();
            } else {
                setMsg('❌ فشل التحديث');
            }
        } catch { setMsg('❌ خطأ في الاتصال'); }
        setTimeout(() => setMsg(''), 3000);
    };

    const togglePermission = (moduleKey: string, role: string) => {
        const currentAllowed = permissions[moduleKey] || [];
        let newAllowed;
        if (currentAllowed.includes(role)) {
            newAllowed = currentAllowed.filter(r => r !== role);
        } else {
            newAllowed = [...currentAllowed, role];
        }
        setPermissions({ ...permissions, [moduleKey]: newAllowed });
    };

    const savePermissions = async () => {
        setMsg('جاري حفظ جدول الصلاحيات...');
        try {
            const res = await fetch('/api/settings/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(permissions)
            });

            if (res.ok) {
                setMsg('✅ تم حفظ جدول الصلاحيات بنجاح');
                // Update localStorage to sync with sidebar/authguard immediately
                localStorage.setItem('erp_role_permissions', JSON.stringify(permissions));
            } else {
                setMsg('❌ فشل الحفظ');
            }
        } catch { setMsg('❌ خطأ في الاتصال'); }
        setTimeout(() => setMsg(''), 3000);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin && !loading) {
        return <div style={{ padding: '4rem', color: '#ff5252', textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', margin: '2rem' }}>⛔ عذراً، هذه الشاشة للمديرين فقط</div>;
    }

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">🛡️ مركز إدارة الصلاحيات</h1>
                    <p className="page-subtitle">تخصيص مستويات الوصول لكل قسم ولكل موظف بشكل منفصل</p>
                </div>
            </header>

            {msg && (
                <div className="animate-fade-in" style={{ padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', background: 'rgba(102,187,106,0.1)', color: '#66bb6a', textAlign: 'center', border: '1px solid rgba(102,187,106,0.2)', fontWeight: 600 }}>
                    {msg}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '6px', marginBottom: '2rem', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                        background: activeTab === 'users' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'users' ? '#fff' : '#919398', cursor: 'pointer',
                        fontWeight: 700, transition: 'all 0.3s'
                    }}
                >
                    👤 الموظفين والوصول
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                        background: activeTab === 'matrix' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'matrix' ? '#fff' : '#919398', cursor: 'pointer',
                        fontWeight: 700, transition: 'all 0.3s'
                    }}
                >
                    ⚙️ جدول صلاحيات الأقسام
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ جاري تحميل البيانات...</div>
            ) : (
                <>
                    {activeTab === 'users' && (
                        <div className="animate-fade-in">
                            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder="🔍 ابحث عن موظف بالاسم أو اسم المستخدم..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%' }}
                                    title="بحث عن مستخدم"
                                />
                            </div>

                            <div className="glass-panel" style={{ padding: '0.5rem' }}>
                                <div className="smart-table-container">
                                    <table className="smart-table">
                                        <thead>
                                            <tr>
                                                <th>الموظف</th>
                                                <th className="hide-on-tablet">اسم المستخدم</th>
                                                <th className="text-center">الدور</th>
                                                <th className="text-center">تغيير الصلاحية</th>
                                                <th className="hide-on-tablet text-center">الحالة</th>
                                                <th className="hide-on-tablet">آخر تواجد</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(u => (
                                                <tr key={u.id}>
                                                    <td data-label="الموظف">
                                                        <div className="mobile-card-title">{u.name}</div>
                                                        <div className="text-muted text-sm">{u.department}</div>
                                                    </td>
                                                    <td className="hide-on-tablet text-sm" data-label="اسم المستخدم">@{u.username}</td>
                                                    <td className="text-center" data-label="الدور">
                                                        <span className={`sh-badge ${(u.role || '').toUpperCase() === 'ADMIN' ? 'paid' : 'partial'}`}>
                                                            {(u.role || '').toUpperCase() === 'ADMIN' ? 'مدير نظام' : (u.role || '').toUpperCase() === 'ACCOUNTANT' ? 'محاسب' : (u.role || '').toUpperCase() === 'SALES' ? 'مبيعات' : (u.role || '').toUpperCase() === 'INVENTORY' ? 'أمين مخزن' : 'عامل'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center" data-label="تغيير الصلاحية">
                                                        <select
                                                            className="input-glass select-small"
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                            title="تغيير صلاحية المستخدم"
                                                        >
                                                            <option value="ADMIN">مدير (ADMIN)</option>
                                                            <option value="ACCOUNTANT">محاسب (ACCOUNTANT)</option>
                                                            <option value="SALES">مبيعات (SALES)</option>
                                                            <option value="INVENTORY">مخازن (INVENTORY)</option>
                                                            <option value="WORKER">عامل (WORKER)</option>
                                                        </select>
                                                    </td>
                                                    <td className="hide-on-tablet text-center" data-label="الحالة">
                                                        {u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime()) < 5 * 60 * 1000 ? (
                                                            <span className="flex-group text-success font-bold text-sm">
                                                                <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#66bb6a', borderRadius: '50%' }}></span>
                                                                نشط
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted text-sm">🌕 غائب</span>
                                                        )}
                                                    </td>
                                                    <td className="hide-on-tablet text-muted text-sm" data-label="آخر تواجد">
                                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'لم يدخل بعد'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>لا يوجد مستخدمون يطابقون البحث</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'matrix' && (
                        <div className="animate-fade-in">
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#fff' }}>⚙️ مصفوفة صلاحيات الوصول</h3>
                                        <p style={{ margin: '5px 0 0', color: '#919398', fontSize: '0.85rem' }}>تحكم في الأيقونات والصفحات التي تظهر لكل مجموعة وظيفية</p>
                                    </div>
                                    <button onClick={savePermissions} className="btn-primary" style={{ padding: '12px 35px' }}>💾 حفظ التعديلات</button>
                                </div>

                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,167,38,0.1)', color: '#ffa726', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(255,167,38,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span>💡</span>
                                    <span>ملاحظة: المدير (ADMIN) يملك صلاحية الدخول لجميع الشاشات تلقائياً ولا يمكن إغلاقها له من هنا.</span>
                                </div>

                                <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="table-glass high-density" style={{ minWidth: '700px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: '250px' }}>الأقسام / الصفحات</th>
                                                {ROLES.map(role => (
                                                    <th key={role} style={{ textAlign: 'center' }}>
                                                        <div style={{ color: '#fff', fontSize: '0.85rem' }}>{role}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#777', fontWeight: 400 }}>{role === 'ACCOUNTANT' ? 'محاسب' : role === 'SALES' ? 'مبيعات' : role === 'INVENTORY' ? 'خازن' : 'عامل'}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {MODULES.map(module => (
                                                <tr key={module.key}>
                                                    <td style={{ fontWeight: 700, fontSize: '0.9rem', color: '#eee' }}>{module.label}</td>
                                                    {ROLES.map(role => (
                                                        <td key={role} style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permissions[module.key]?.includes(role) || false}
                                                                    onChange={() => togglePermission(module.key, role)}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        cursor: 'pointer',
                                                                        accentColor: 'var(--primary-color)',
                                                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                                                    }}
                                                                    title={`منح ${role} صلاحية ${module.label}`}
                                                                />
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <style>{`
                .pulse-dot {
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 0 0 rgba(102, 187, 106, 0.7);
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(102, 187, 106, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(102, 187, 106, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(102, 187, 106, 0); }
                }
                .tab-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
                .tab-btn.active {
                    box-shadow: 0 4px 15px rgba(227, 94, 53, 0.3);
                }
                .select-small {
                    border-radius: 8px !important;
                    height: 34px !important;
                }
            `}</style>
        </div>
    );
}
