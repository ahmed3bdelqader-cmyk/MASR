'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const DEFAULT_SHORTCUTS = [
  { id: '1', label: 'إصدار فاتورة مبيعات', icon: '🧾', link: '/sales', color: '#E35E35', size: 'normal' },
  { id: '2', label: 'أمر تصنيع جديد', icon: '⚙️', link: '/jobs', color: '#29b6f6', size: 'normal' },
  { id: '3', label: 'إدخال مشتريات', icon: '📦', link: '/purchases', color: '#78909c', size: 'normal' },
  { id: '4', label: 'حركة خزينة', icon: '💵', link: '/treasury', color: '#66bb6a', size: 'normal' },
  { id: '5', label: 'إضافة عميل', icon: '👤', link: '/clients', color: '#ffa726', size: 'normal' },
  { id: '6', label: 'إضافة منتج', icon: '🏷️', link: '/products', color: '#ab47bc', size: 'normal' },
  { id: '7', label: 'الإعدادات', icon: '⚙️', link: '/settings', color: '#607d8b', size: 'normal' },
  { id: '8', label: 'سجل الفواتير', icon: '📋', link: '/sales/history', color: '#ff7043', size: 'normal' },
];

export default function Home() {
  const [settings, setSettings] = useState({ appName: 'Stand Masr ERP', primaryColor: '#E35E35', appLogo: '', logoSize: '60', currency: 'EGP', currencySymbol: 'ج.م' });
  const [stats, setStats] = useState({ totalSales: 0, unpaidBalance: 0, treasuryBalance: 0, activeJobs: 0, unpaidInvoicesCount: 0 });
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Custom shortcuts state
  const [shortcuts, setShortcuts] = useState<any[]>(DEFAULT_SHORTCUTS);
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false);
  const [shortcutForm, setShortcutForm] = useState({ id: '', label: '', icon: '🌟', link: '/', color: '#E35E35', size: 'normal' });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Load settings
    try {
      const raw = localStorage.getItem('erp_settings');
      if (raw) {
        const s = JSON.parse(raw);
        setSettings(prev => ({ ...prev, ...s }));
        if (s.primaryColor) document.documentElement.style.setProperty('--primary-color', s.primaryColor);
        if (s.bgColor) document.body.style.backgroundColor = s.bgColor;
        if (s.sidebarBg) document.documentElement.style.setProperty('--sidebar-bg', s.sidebarBg);
      }
      const savedShortcuts = localStorage.getItem('erp_dashboard_shortcuts');
      if (savedShortcuts) {
        setShortcuts(JSON.parse(savedShortcuts));
      }
    } catch { }

    // Load live data
    Promise.all([
      fetch('/api/sales').then(r => r.json()).catch(() => []),
      fetch('/api/treasury').then(r => r.json()).catch(() => []),
      fetch('/api/jobs').then(r => r.json()).catch(() => []),
    ]).then(([salesData, treasuryData, jobsData]) => {
      const totalSales = Array.isArray(salesData) ? salesData.reduce((acc: number, inv: any) => acc + (inv.total || 0), 0) : 0;
      const unpaid = Array.isArray(salesData) ? salesData.filter((inv: any) => inv.status === 'UNPAID' || inv.status === 'PARTIAL') : [];
      const unpaidBalance = unpaid.reduce((acc: number, inv: any) => acc + (inv.total || 0), 0);
      const treasuryBalance = Array.isArray(treasuryData) ? treasuryData.reduce((acc: number, t: any) => acc + (t.balance || 0), 0) : 0;
      const activeJobs = Array.isArray(jobsData) ? jobsData.filter((j: any) => j.status !== 'COMPLETED').length : 0;
      setStats({ totalSales, unpaidBalance, treasuryBalance, activeJobs, unpaidInvoicesCount: unpaid.length });
      setUnpaidInvoices(unpaid.slice(0, 5));
      setLoading(false);
    });

    return () => clearInterval(timer);
  }, []);

  const saveShortcuts = (newShortcuts: any[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem('erp_dashboard_shortcuts', JSON.stringify(newShortcuts));
  };

  const handleSaveShortcut = () => {
    if (!shortcutForm.label || !shortcutForm.link) return alert('يرجى ملء الاسم والرابط');
    let updated;
    if (shortcutForm.id) {
      updated = shortcuts.map(s => s.id === shortcutForm.id ? shortcutForm : s);
    } else {
      updated = [...shortcuts, { ...shortcutForm, id: Date.now().toString() }];
    }
    saveShortcuts(updated);
    setShortcutForm({ id: '', label: '', icon: '🌟', link: '/', color: '#E35E35', size: 'normal' });
  };

  const handleDeleteShortcut = (id: string) => {
    if (!confirm('هل تريد مسح هذا الاختصار؟')) return;
    saveShortcuts(shortcuts.filter(s => s.id !== id));
  };

  const sym = settings.currencySymbol || 'ج.م';

  const quickStats = [
    { title: 'إجمالي المبيعات', value: stats.totalSales.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ' + sym, color: '#E35E35', icon: '💰', link: '/sales/history' },
    { title: 'رصيد غير محصّل', value: stats.unpaidBalance.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ' + sym, color: '#ffa726', icon: '⚠️', link: '/clients' },
    { title: 'رصيد الخزينة الكلي', value: stats.treasuryBalance.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ' + sym, color: '#66bb6a', icon: '🏦', link: '/treasury' },
    { title: 'أوامر تصنيع نشطة', value: stats.activeJobs + ' شغلانة', color: '#29b6f6', icon: '⚙️', link: '/jobs' },
  ];

  const modules = [
    { title: 'العملاء والتحصيلات', desc: 'إدارة ديون العملاء وكشوفات الحساب والتحصيل', link: '/clients', icon: '👥' },
    { title: 'المبيعات والفواتير', desc: 'إصدار فواتير ضريبية وخصم المخزون أوتوماتيكياً', link: '/sales', icon: '🧾' },
    { title: 'الخزينة والمصروفات', desc: 'متابعة الأرصدة والتحويلات البنكية والمحافظ', link: '/treasury', icon: '🏦' },
    { title: 'أوامر التصنيع', desc: 'القلب النابض - خطوط الإنتاج وحساب صافي الربح', link: '/jobs', icon: '🏭' },
    { title: 'المخزن الذكي', desc: 'جرد آلي للخامات والمنتجات النهائية', link: '/inventory', icon: '📦' },
    { title: 'المشتريات', desc: 'فواتير التوريد بتصنيفات ذكية', link: '/purchases', icon: '🔩' },
    { title: 'الكتالوج والمنتجات', desc: 'تسجيل القطع مع المقاسات والأسعار', link: '/products', icon: '🏷️' },
    { title: 'تقارير الإدارة', desc: 'تقارير مالية وتصنيعية مفصلة وإحصائيات', link: '/reports', icon: '📊' },
    { title: 'السيمزات والأختام', desc: 'إدارة أختام الشركة والإمضاءات', link: '/seals', icon: '🔏' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('erp_logged_in');
    localStorage.removeItem('erp_login_time');
    window.location.href = '/login';
  };

  const [userName, setUserName] = useState('');
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
    setUserName(user.name || 'مدير النظام');
  }, []);

  return (
    <div className="main-container" style={{ padding: '0', width: '100%', maxWidth: 'none', margin: '0', background: 'transparent' }}>
      {/* Premium Header Section */}
      <header className="animate-fade-in" style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
        padding: '1.2rem 2rem',
        borderRadius: '0 0 24px 24px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        gap: '20px'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 1, minWidth: '280px' }}>
          {settings.appLogo
            ? <img src={settings.appLogo} alt="Logo" style={{ width: `50px`, height: `50px`, objectFit: 'contain', borderRadius: 'var(--logo-radius, 12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} />
            : <div style={{ width: `50px`, height: `50px`, background: `linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color), transparent 30%) 100%)`, borderRadius: 'var(--logo-radius, 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>🏭</div>
          }
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 900, marginBottom: '2px', letterSpacing: '-0.03em' }}>{settings.appName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ padding: '2px 8px', background: 'color-mix(in srgb, var(--primary-color), transparent 85%)', color: 'var(--primary-color)', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, border: `1px solid color-mix(in srgb, var(--primary-color), transparent 70%)` }}>v2.0</span>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>نسخة مخصصة - إدارة العمليات الذكية</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', flex: '1', justifyContent: 'flex-end', alignItems: 'center', minWidth: 'fit-content' }}>
          <div style={{ textAlign: 'left', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px', marginLeft: '5px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>أهلاً بك،</div>
            <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 800 }}>{userName}</div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}
            title="تسجيل الخروج"
          >
            🚪
          </button>

          <Link href="/jobs" style={{ background: 'var(--primary-color)', color: '#fff', padding: '0 15px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, textDecoration: 'none', boxShadow: `0 10px 25px color-mix(in srgb, var(--primary-color), transparent 70%)`, fontSize: '0.85rem' }}>
            <span>➕ أمر هندسي وتصنيع جديد</span>
          </Link>
        </div>
      </header>

      <div style={{ padding: '0 1.5rem 1rem' }}>
        <div className="dashboard-grid" style={{ marginBottom: '1.2rem' }}>
          {/* Time & Date Card */}
          <div className="glass-panel hover-card" style={{ padding: '0.8rem 1rem', position: 'relative' }}>
            <div style={{ width: '34px', height: '34px', background: 'color-mix(in srgb, var(--primary-color), transparent 90%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--primary-color)' }}>
              🕒
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {mounted ? currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '...'}
            </p>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginTop: '4px', fontFamily: 'monospace', letterSpacing: '1px' }}>
              {mounted ? currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...'}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: '1.2rem', right: '1.2rem', height: '3px', background: 'color-mix(in srgb, var(--primary-color), transparent 85%)', borderRadius: '10px' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--primary-color)', borderRadius: '10px' }}></div>
            </div>
          </div>

          {quickStats.map((stat, i) => (
            <Link key={i} href={stat.link} style={{ textDecoration: 'none' }}>
              <div className="glass-panel hover-card" style={{ padding: '1rem 1.2rem', position: 'relative' }}>
                <div style={{ width: '34px', height: '34px', background: `${stat.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '0.8rem', color: stat.color }}>
                  {stat.icon}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.title}</p>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                  {loading ? '...' : stat.value}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: '1.2rem', right: '1.2rem', height: '3px', background: `${stat.color}22`, borderRadius: '10px' }}>
                  <div style={{ width: '60%', height: '100%', background: stat.color, borderRadius: '10px' }}></div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="responsive-grid" style={{ gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem', marginBottom: '1rem', alignItems: 'start' }}>
          {/* All Modules Section */}
          <div style={{ minWidth: '0' }}>
            <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              الأقسام الرئيسية <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.7rem' }}>إدارة شاملة</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {modules.map((mod, i) => (
                <Link key={i} href={mod.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="glass-panel hover-card" style={{ padding: '1.2rem', display: 'flex', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', background: 'color-mix(in srgb, var(--primary-color), transparent 90%)', borderRadius: '12px', border: `1px solid color-mix(in srgb, var(--primary-color), transparent 85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                      {mod.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>{mod.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '1.2rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>⚡ وصول سريع</h3>
                <button
                  onClick={() => setIsEditingShortcuts(!isEditingShortcuts)}
                  style={{ background: isEditingShortcuts ? 'var(--primary-color)' : 'transparent', color: isEditingShortcuts ? '#fff' : 'var(--primary-color)', border: `1px solid ${isEditingShortcuts ? 'transparent' : 'color-mix(in srgb, var(--primary-color), transparent 65%)'}`, padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s' }}
                >
                  {isEditingShortcuts ? '💾 إنهاء التعديل' : '✏️ تخصيص الاختصارات'}
                </button>
              </div>

              {isEditingShortcuts && (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#aaa' }}>إضافة / تعديل اختصار</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="الاسم (مثال: إنشاء فاتورة)" className="input-glass" value={shortcutForm.label} onChange={e => setShortcutForm(s => ({ ...s, label: e.target.value }))} style={{ fontSize: '0.8rem' }} title="اسم الاختصار" aria-label="اسم الاختصار" />
                    <input type="text" placeholder="رمز / إيموجي" className="input-glass" value={shortcutForm.icon} onChange={e => setShortcutForm(s => ({ ...s, icon: e.target.value }))} style={{ fontSize: '0.8rem' }} title="رمز الاختصار (إيموجي)" aria-label="رمز الاختصار" />
                    <input type="text" placeholder="الرابط (مثال: /sales)" className="input-glass" value={shortcutForm.link} onChange={e => setShortcutForm(s => ({ ...s, link: e.target.value }))} style={{ fontSize: '0.8rem' }} title="رابط الاختصار" aria-label="رابط الاختصار" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={shortcutForm.color} onChange={e => setShortcutForm(s => ({ ...s, color: e.target.value }))} style={{ width: '40px', height: '100%', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} title="لون الاختصار" aria-label="لون الاختصار" />
                      <select className="input-glass" value={shortcutForm.size} onChange={e => setShortcutForm(s => ({ ...s, size: e.target.value }))} style={{ flex: 1, fontSize: '0.8rem' }} title="حجم الاختصار" aria-label="حجم الاختصار">
                        <option value="normal">عادي (مربع صغير)</option>
                        <option value="large">عريض (مستطيل)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button onClick={handleSaveShortcut} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', flex: 1, background: '#4CAF50' }}>{shortcutForm.id ? 'حفظ التعديلات' : 'إضافة اختصار جديد'}</button>
                    <button onClick={() => setShortcutForm({ id: '', label: '', icon: '🌟', link: '/', color: '#E35E35', size: 'normal' })} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>إلغاء</button>
                    <button onClick={() => { if (confirm('سيعيد الافتراضيات. متأكد؟')) saveShortcuts(DEFAULT_SHORTCUTS) }} style={{ padding: '6px 14px', background: 'rgba(227,94,53,0.1)', color: '#E35E35', border: '1px solid rgba(227,94,53,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>استعادة الافتراضي</button>
                  </div>
                </div>
              )}

              <div className="shortcuts-grid">
                {shortcuts.map((s, i) => (
                  <div key={s.id} style={{ position: 'relative', gridColumn: s.size === 'large' ? 'span 2' : 'span 1' }}>
                    <Link href={s.link} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: s.size === 'large' ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: s.size === 'large' ? '8px 12px' : '12px 6px', borderRadius: '14px', background: `${s.color}11`, border: `1px solid ${s.color}33`, transition: '0.3s', minHeight: '80px', height: '100%' }}>
                        <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.65rem', color: '#fff', textAlign: 'center', fontWeight: s.size === 'large' ? 700 : 500 }}>{s.size === 'large' ? s.label : s.label.split(' ')[0]}</span>
                      </div>
                    </Link>

                    {isEditingShortcuts && (
                      <div style={{ position: 'absolute', top: '-6px', right: '-6px', display: 'flex', gap: '4px' }}>
                        <button onClick={() => setShortcutForm(s)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2196F3', color: '#fff', border: '2px solid #222', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                        <button onClick={() => handleDeleteShortcut(s.id)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E35E35', color: '#fff', border: '2px solid #222', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="glass-panel" style={{ borderLeft: `5px solid #ffa726`, padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#ffa726', fontSize: '1.1rem' }}>⚠️ فواتير وعملاء متأخرة بالدفع</h3>
                <span style={{ background: '#ffa72622', color: '#ffa726', padding: '3px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>{stats.unpaidInvoicesCount} المعلق</span>
              </div>
              {loading ? <p>جاري...</p> : unpaidInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <p style={{ color: '#66bb6a', fontSize: '0.85rem' }}>لا توجد فواتير متأخرة.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {unpaidInvoices.map((inv: any) => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.invoiceNo}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inv.client?.name || '-'}</div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        <div style={{ color: 'var(--primary-color)', fontWeight: 900, fontSize: '0.85rem' }}>{inv.total.toLocaleString()} {sym}</div>
                      </div>
                    </div>
                  ))}
                  <Link href="/clients" style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: '#888', fontSize: '0.8rem', textDecoration: 'none' }}>عرض حسابات العملاء ←</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
