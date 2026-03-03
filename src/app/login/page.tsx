'use client';
import React, { useState, useEffect } from 'react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [appName, setAppName] = useState('Stand Masr ERP');
    const [logo, setLogo] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#E35E35');
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to home
        if (localStorage.getItem('erp_logged_in') === 'true') {
            window.location.href = '/';
            return;
        }
        // Load branding
        try {
            const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
            if (s.appName) {
                setAppName(s.appName);
                document.title = `${s.appName} | تسجيل الدخول`;
            } else {
                document.title = 'Stand Masr | تسجيل الدخول';
            }
            if (s.appLogo) setLogo(s.appLogo);
            if (s.primaryColor) setPrimaryColor(s.primaryColor);
        } catch { }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. First try the database via API
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('erp_logged_in', 'true');
                localStorage.setItem('erp_user', JSON.stringify(data.user));
                localStorage.setItem('erp_login_time', new Date().toISOString());
                window.location.href = '/';
                return;
            }

            // 2. Fallback to LocalStorage admin (current system)
            const s = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}'); } catch { return {}; } })();
            const correctUser = s.loginUsername || 'admin';
            const correctPass = s.loginPassword || '1234';

            if (username === correctUser && password === correctPass) {
                localStorage.setItem('erp_logged_in', 'true');
                localStorage.setItem('erp_user', JSON.stringify({ name: 'مدير النظام', role: 'ADMIN', username: 'admin' }));
                localStorage.setItem('erp_login_time', new Date().toISOString());
                window.location.href = '/';
            } else {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة');
                setLoading(false);
            }
        } catch (err) {
            setError('فشل الاتصال بالسيرفر');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at top, #1a1f2e 0%, #0e0f11 60%)',
            padding: '20px',
            fontFamily: "'Cairo', sans-serif",
        }}>
            {/* Background decorations */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '500px', height: '500px', background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-200px', left: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, #29b6f615 0%, transparent 70%)', borderRadius: '50%' }} />
            </div>

            <div style={{
                position: 'relative', zIndex: 1,
                background: 'rgba(30, 32, 38, 0.85)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '3rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                animation: 'fadeIn 0.6s ease-out',
            }}>
                {/* Logo & App Name */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    {logo ? (
                        <img src={logo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '16px', marginBottom: '14px' }} />
                    ) : (
                        <div style={{ width: '80px', height: '80px', background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 14px' }}>🏭</div>
                    )}
                    <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', color: primaryColor, fontWeight: 800 }}>{appName}</h1>
                    <p style={{ margin: 0, color: '#919398', fontSize: '0.9rem' }}>نظام إدارة المصنع المتكامل</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label htmlFor="user_login" style={{ display: 'block', marginBottom: '6px', color: '#919398', fontSize: '0.85rem' }}>اسم المستخدم</label>
                        <input
                            id="user_login"
                            type="text"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setError(''); }}
                            placeholder="admin"
                            required
                            autoFocus
                            title="اسم المستخدم"
                            style={{
                                width: '100%', padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.3)',
                                border: `1px solid ${error ? '#E35E35' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '10px', color: '#fff', fontFamily: 'inherit',
                                fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: '0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = primaryColor}
                            onBlur={e => e.target.style.borderColor = error ? '#E35E35' : 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                    <div>
                        <label htmlFor="user_pass" style={{ display: 'block', marginBottom: '6px', color: '#919398', fontSize: '0.85rem' }}>كلمة المرور</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="user_pass"
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                placeholder="••••••"
                                required
                                title="كلمة المرور"
                                style={{
                                    width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', background: 'rgba(0,0,0,0.3)',
                                    border: `1px solid ${error ? '#E35E35' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '10px', color: '#fff', fontFamily: 'inherit',
                                    fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: '0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = primaryColor}
                                onBlur={e => e.target.style.borderColor = error ? '#E35E35' : 'rgba(255,255,255,0.1)'}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1rem' }} title={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                                {showPass ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(227,94,53,0.15)', border: '1px solid rgba(227,94,53,0.3)', color: '#E35E35', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading ? '#555' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                            border: 'none', padding: '1rem', borderRadius: '10px', color: '#fff',
                            fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s', marginTop: '4px',
                            boxShadow: loading ? 'none' : `0 4px 15px ${primaryColor}40`,
                        }}>
                        {loading ? '⏳ جاري التحقق...' : '🔑 تسجيل الدخول'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.75rem', color: '#555', textAlign: 'center' }}>
                    <span>تواصل مع مدير النظام للحصول على بيانات الدخول</span>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px #1a1c22 inset; -webkit-text-fill-color: #fff; }
            `}</style>
        </div>
    );
}
