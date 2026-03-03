'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Settings,
  ShoppingCart, Users, History, Activity, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Banknote, Hammer, Clock, Palette, Moon, Sun, Zap
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
    setUserName(user.name || 'مدير النظام');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="unified-container flex-center" style={{ minHeight: '80vh' }}>
        <div className="animate-pulse text-center">
          <div style={{ fontSize: '3rem' }}>📊</div>
          <p className="mt-2 text-muted">جاري تحليل البيانات وإعداد لوحة المعلومات...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || { liquidity: 0, receivables: 0, debts: 0, activeJobs: 0 };
  const chartData = data?.chartData || [];
  const donutData = data?.donutData || [];
  const lowStock = data?.lowStockItems || [];
  const recentJobs = data?.recentJobs || [];

  const applyQuickTheme = (p: any) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', p.primary);
    root.style.setProperty('--bg-color', p.bg);
    root.style.setProperty('--sidebar-bg', p.sidebar || p.bg);
    root.style.setProperty('--sidebar-text', p.text || '#fff');
    root.style.setProperty('--card-bg', p.card || 'rgba(30,32,38,0.7)');
    root.style.setProperty('--text-primary', p.text || '#ffffff');
    root.style.setProperty('--btn-text', p.btnText || '#ffffff');

    const isLight = p.bg === '#f8f9fa' || p.bg === '#ffffff';
    root.style.setProperty('--btn-secondary-bg', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)');
    root.style.setProperty('--btn-secondary-text', isLight ? '#333' : '#ffffff');
    root.style.setProperty('--input-bg-glass', isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)');

    document.body.className = document.body.className.replace(/rgb-[a-z-]+|ramadan-theme/g, '').trim();
    if (p.type && p.type.startsWith('rgb')) document.body.classList.add(p.type === 'rgb' ? 'rgb-theme' : p.type);
    if (p.type === 'ramadan') document.body.classList.add('ramadan-theme');

    document.body.style.backgroundColor = p.bg;

    // Persist full settings for AppShell to pick up
    const currentSettings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    const newSettings = {
      ...currentSettings,
      primaryColor: p.primary,
      bgColor: p.bg,
      sidebarBg: p.sidebar || p.bg,
      sidebarText: p.text || '#fff',
      cardBg: p.card || 'rgba(30,32,38,0.7)',
      textColor: p.text || '#ffffff',
      btnText: p.btnText || '#ffffff',
    };
    localStorage.setItem('erp_settings', JSON.stringify(newSettings));
    localStorage.setItem('erp_ui_prefs', JSON.stringify({ isRGB: p.type?.startsWith('rgb'), isRamadan: p.type === 'ramadan' }));
  };

  const QUICK_THEMES = [
    { label: 'نهاري', icon: <Sun size={14} />, primary: '#e35e35', bg: '#f8f9fa', text: '#333', card: 'rgba(255,255,255,0.9)', btnText: '#fff' },
    { label: 'ليلي', icon: <Moon size={14} />, primary: '#60a5fa', bg: '#0f172a', text: '#fff', card: 'rgba(30,41,59,0.7)', btnText: '#fff' },
    { label: 'رمضان', icon: '🌙', primary: '#fbbf24', bg: '#064e3b', text: '#fef3c7', card: 'rgba(5,150,105,0.4)', btnText: '#064e3b', type: 'ramadan' },
    { label: 'نيون', icon: <Zap size={14} />, primary: '#00ffcc', bg: '#000', text: '#fff', card: 'rgba(20,20,20,0.8)', btnText: '#000', type: 'rgb' },
    { label: 'برتقالي', icon: <Zap size={14} />, primary: '#ff6600', bg: '#050200', text: '#fff', card: 'rgba(15,8,4,0.8)', btnText: '#000', type: 'rgb-orange' },
    { label: 'أحمر', icon: <Zap size={14} />, primary: '#ff0033', bg: '#050002', text: '#fff', card: 'rgba(15,4,6,0.8)', btnText: '#000', type: 'rgb-red' },
    { label: 'أزرق', icon: <Zap size={14} />, primary: '#0066ff', bg: '#000205', text: '#fff', card: 'rgba(4,8,15,0.8)', btnText: '#fff', type: 'rgb-blue' },
    { label: 'أخضر', icon: <Zap size={14} />, primary: '#33ff00', bg: '#000501', text: '#fff', card: 'rgba(4,15,6,0.8)', btnText: '#000', type: 'rgb-green' },
  ];


  return (
    <div className="unified-container animate-fade-in" style={{ padding: '1rem' }}>

      {/* Header Section */}
      <header className="mb-4 glass-panel" style={{ padding: '1.2rem', borderRadius: '20px' }}>
        <div className="flex-between mb-4">
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📊 لوحة القياس والتحليل</h1>
            <p className="page-subtitle">أهلاً بك، {userName} - نظرة عامة على أداء المنشأة اليوم</p>
          </div>
          <div className="flex-group">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="btn-secondary"
              style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {showBalances ? '👁️ إخفاء الأرقام' : '👁️ عرض الأرقام'}
            </button>
            <button onClick={fetchDashboardData} className="btn-primary" style={{ padding: '8px 15px' }}>
              🔄 تحديث
            </button>
          </div>
        </div>

        {/* Quick Theme Switcher */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.75rem', color: '#919398', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <Palette size={14} /> مبدل المظهر السريع:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {QUICK_THEMES.map((th, i) => (
              <button key={i} onClick={() => applyQuickTheme(th)}
                className="hover-scale"
                style={{
                  padding: '5px 12px 5px 6px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: th.bg,
                  color: th.text,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                {th.type?.startsWith('rgb') && <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: th.type === 'rgb-orange' ? 'linear-gradient(90deg, #ff3300, #ff6600, #ff9900, #ffcc00, #ff6600, #ff3300)' :
                    th.type === 'rgb-red' ? 'linear-gradient(90deg, #cc0000, #ff0000, #ff3333, #ff6666, #ff0000, #cc0000)' :
                      th.type === 'rgb-blue' ? 'linear-gradient(90deg, #0033cc, #0066ff, #3399ff, #66ccff, #0066ff, #0033cc)' :
                        th.type === 'rgb-green' ? 'linear-gradient(90deg, #009900, #33cc33, #66ff66, #99ff99, #33cc33, #009900)' :
                          'linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000)',
                  backgroundSize: '400% 100%', animation: 'rgb-border-flow 3s linear infinite'
                }} />}

                <div style={{ display: 'flex', gap: '3px', marginLeft: '2px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: th.primary, border: '1px solid rgba(255,255,255,0.2)' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: th.card || '#333', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {th.type !== 'ramadan' && th.icon}
                  {th.label}
                </div>
              </button>
            ))}
            <Link href="/settings" style={{ fontSize: '0.7rem', color: 'var(--primary-color)', marginLeft: '10px', textDecoration: 'none', fontWeight: 700 }}>عرض الكل 🎭</Link>
          </div>
        </div>
      </header>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* Total Liquidity */}
        <div className="glass-panel hover-card" style={{ padding: '1.2rem', borderRight: '4px solid #10b981' }}>
          <div className="flex-between mb-2">
            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '8px', borderRadius: '12px' }}>
              <Banknote size={20} />
            </span>
            <span className="text-success flex-group" style={{ fontSize: '0.75rem' }}>
              رصيد متاح <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '5px' }}>إجمالي السيولة (الخزينة + البنوك)</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
            {showBalances ? kpis.liquidity.toLocaleString('en-US') : '****'} <small style={{ fontSize: '0.8rem' }}>ج.م</small>
          </h2>
        </div>

        {/* Total Receivables */}
        <div className="glass-panel hover-card" style={{ padding: '1.2rem', borderRight: '4px solid #3b82f6' }}>
          <div className="flex-between mb-2">
            <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '8px', borderRadius: '12px' }}>
              <ShoppingCart size={20} />
            </span>
            <span className="text-primary flex-group" style={{ fontSize: '0.75rem' }}>
              مستحقات لنا <Activity size={14} />
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '5px' }}>إجمالي مستحقات عند العملاء</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
            {showBalances ? kpis.receivables.toLocaleString('en-US') : '****'} <small style={{ fontSize: '0.8rem' }}>ج.م</small>
          </h2>
        </div>

        {/* Total Debts */}
        <div className="glass-panel hover-card" style={{ padding: '1.2rem', borderRight: '4px solid #ef4444' }}>
          <div className="flex-between mb-2">
            <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '8px', borderRadius: '12px' }}>
              <TrendingDown size={20} />
            </span>
            <span className="text-danger flex-group" style={{ fontSize: '0.75rem' }}>
              مستحقات للغير <ArrowDownRight size={14} />
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '5px' }}>إجمالي الديون (موردين + دهان)</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
            {showBalances ? kpis.debts.toLocaleString('en-US') : '****'} <small style={{ fontSize: '0.8rem' }}>ج.م</small>
          </h2>
        </div>

        {/* Active Jobs */}
        <div className="glass-panel hover-card" style={{ padding: '1.2rem', borderRight: '4px solid #a855f7' }}>
          <div className="flex-between mb-2">
            <span style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '8px', borderRadius: '12px' }}>
              <Hammer size={20} />
            </span>
            <span style={{ color: '#a855f7', fontSize: '0.75rem' }}>قيد التصنيع</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '5px' }}>أوامر تصنيع نشطة حالياً</p>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
            {kpis.activeJobs} <small style={{ fontSize: '0.8rem' }}>شغلانة</small>
          </h2>
        </div>

      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Bar Chart: Sales vs Expenses */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <h3 className="flex-group mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>
            <TrendingUp size={18} className="text-primary" /> مبيعات مقابل مصروفات (آخر 6 أشهر)
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" />
                <Bar name="إجمالي المبيعات" dataKey="sales" fill="var(--primary-color)" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar name="إجمالي المصروفات" dataKey="expenses" fill="rgba(255,255,255,0.2)" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Expense Distribution */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <h3 className="flex-group mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>
            <Package size={18} className="text-primary" /> توزيع المصروفات (الشهر الحالي)
          </h3>
          <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {donutData.map((entry: any, index: number) => (
                <div key={index} className="flex-between" style={{ fontSize: '0.75rem' }}>
                  <span className="flex-group">
                    <span style={{ width: 8, height: 8, background: COLORS[index % COLORS.length], borderRadius: '50%' }}></span>
                    {entry.name}
                  </span>
                  <span style={{ fontWeight: 700 }}>{((entry.value / donutData.reduce((acc: any, curr: any) => acc + curr.value, 0)) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

        {/* Low Stock Alerts */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <div className="flex-between mb-4">
            <h3 className="flex-group" style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
              <AlertTriangle size={18} /> نواقص المخزون (بحاجة لطلب)
            </h3>
            <Link href="/inventory" className="text-primary" style={{ fontSize: '0.75rem' }}>عرض الكل ←</Link>
          </div>
          <div className="smart-table-container">
            <table className="smart-table">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.8rem', padding: '10px' }}>الصنف</th>
                  <th style={{ fontSize: '0.8rem', padding: '10px' }}>الحالي</th>
                  <th style={{ fontSize: '0.8rem', padding: '10px' }}>الحد الأدنى</th>
                  <th style={{ fontSize: '0.8rem', padding: '10px' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted" style={{ padding: '2rem' }}>لا توجد نواقص حالياً 🎉</td></tr>
                ) : lowStock.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.stock} {item.unit}</td>
                    <td>{item.minStockLevel || 0}</td>
                    <td>
                      <span className="sh-badge partial" style={{ fontSize: '0.65rem' }}>ناقص</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Running Jobs Status */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px' }}>
          <div className="flex-between mb-4">
            <h3 className="flex-group" style={{ fontSize: '1rem', fontWeight: 700 }}>
              <Clock size={18} className="text-primary" /> حالة التشغيل (أحدث الشغلانات)
            </h3>
            <Link href="/jobs" className="text-primary" style={{ fontSize: '0.75rem' }}>إدارة الشغل ←</Link>
          </div>
          <div className="flex-column" style={{ gap: '10px' }}>
            {recentJobs.length === 0 ? (
              <p className="text-center text-muted" style={{ padding: '2rem' }}>لا توجد أوامر تشغيل مفتوحة حالياً.</p>
            ) : recentJobs.map((job: any) => (
              <div key={job.id} className="flex-between glass-panel" style={{ padding: '10px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex-group">
                  <span style={{ fontSize: '0.7rem', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '8px' }}>#{job.serialNo}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{job.name}</span>
                </div>
                <div className="flex-group">
                  <span className={`sh-badge ${job.status === 'IN_PROGRESS' ? 'partial' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                    {job.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'بالانتظار'}
                  </span>
                  <Link href={`/jobs/details/${job.id}`} className="btn-action">👁️</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style jsx>{`
        .unified-container {
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .glass-panel {
            padding: 1rem !important;
          }
        `}
      </style>
      <style jsx global>{`
        @keyframes rgb-line-quick {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  );
}
