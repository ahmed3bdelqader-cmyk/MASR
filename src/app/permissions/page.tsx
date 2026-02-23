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
    { key: '/sales', label: '🧾 المبيعات والفواتير' },
    { key: '/jobs', label: '🏭 أوامر التصنيع' },
    { key: '/paint', label: '🎨 قسم الدهانات' },
    { key: '/inventory', label: '📦 المخزن الذكي' },
    { key: '/purchases', label: '🔩 المشتريات والمدخلات' },
    { key: '/products', label: '🏷️ الكتالوج (المنتجات)' },
    { key: '/treasury', label: '🏦 الخزينة والمصروفات' },
    { key: '/employees', label: '👤 شؤون الموظفين' },
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

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin(u.role === 'ADMIN' || !u.role);
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

    if (!isAdmin && !loading) {
        return <div style={{ padding: '2rem', color: '#ff5252', textAlign: 'center' }}>⛔ عذراً، هذه الشاشة للمديرين فقط</div>;
    }

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--primary-color)' }}>🛡️ مركز إدارة الصلاحيات</h1>
                <p style={{ color: '#919398' }}>تخصيص مستويات الوصول لكل قسم ولكل موظف بشكل منفصل</p>
            </header>

            {msg && (
                <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', color: '#fff', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    {msg}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 20px' }}
                >
                    👤 الموظفين النشطين
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={activeTab === 'matrix' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 20px' }}
                >
                    ⚙️ جدول صلاحيات الأقسام
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem' }}>تحديد أدوار الموظفين</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    <th>اسم الموظف</th>
                                    <th>اسم المستخدم</th>
                                    <th>الدور الحالي</th>
                                    <th>تغيير الدور</th>
                                    <th>حالة الاتصال</th>
                                    <th>آخر دخول</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                                        <td style={{ color: '#aaa' }}>@{u.username}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                background: u.role === 'ADMIN' ? 'rgba(102,187,106,0.1)' : 'rgba(41,182,246,0.1)',
                                                color: u.role === 'ADMIN' ? '#66bb6a' : '#29b6f6',
                                                border: `1px solid ${u.role === 'ADMIN' ? '#66bb6a44' : '#29b6f644'}`
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                className="input-glass"
                                                style={{ padding: '5px', fontSize: '0.85rem' }}
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                title="تغيير دور المستخدم"
                                            >
                                                <option value="ADMIN">مدير (ADMIN)</option>
                                                <option value="ACCOUNTANT">محاسب (ACCOUNTANT)</option>
                                                <option value="SALES">مبيعات (SALES)</option>
                                                <option value="INVENTORY">مخازن (INVENTORY)</option>
                                                <option value="WORKER">عامل (WORKER)</option>
                                            </select>
                                        </td>
                                        <td>
                                            {u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime()) < 5 * 60 * 1000 ? (
                                                <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#4caf50', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 5px #4caf50' }}></span> متصل الآن</span>
                                            ) : (
                                                <span style={{ color: '#888' }}>غير متصل</span>
                                            )}
                                        </td>
                                        <td style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'لم يدخل بعد'}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>لا يوجد مستخدمون حالياً</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'matrix' && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>تخصيص صلاحيات الوصول لكل دور</h3>
                        <button onClick={savePermissions} className="btn-primary" style={{ padding: '10px 25px' }}>💾 حفظ التعديلات</button>
                    </div>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>💡 ملحوظة: المدير (ADMIN) يملك صلاحية الدخول لجميع الشاشات تلقائياً ولا يمكن إغلاقها له.</p>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-glass">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'right' }}>الشاشة / الموديول</th>
                                    {ROLES.map(role => <th key={role} style={{ textAlign: 'center' }}>{role}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {MODULES.map(module => (
                                    <tr key={module.key}>
                                        <td style={{ fontWeight: 'bold' }}>{module.label}</td>
                                        {ROLES.map(role => (
                                            <td key={role} style={{ textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[module.key]?.includes(role) || false}
                                                    onChange={() => togglePermission(module.key, role)}
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
