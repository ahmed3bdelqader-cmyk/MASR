'use client';
import React, { useState, useEffect } from 'react';

export default function DatabaseSettingsPage() {
    const [config, setConfig] = useState({
        dbType: 'SQLite (Local)',
        host: '',
        port: '',
        database: 'dev.db',
        username: '',
        password: '',
        syncInterval: '60',
        websiteUrl: '',
        apiKey: '',
        wooConsumerKey: '',
        wooConsumerSecret: '',
        syncProducts: true,
        syncOrders: false
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin(u.role === 'ADMIN' || !u.role);

            // Load saved config if any
            const saved = localStorage.getItem('erp_db_config');
            if (saved) setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));

            fetchLogs();
        } catch { }
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/logs');
            const data = await res.json();
            if (Array.isArray(data)) setLogs(data);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    };

    const clearLogs = async () => {
        if (!confirm('هل أنت متأكد من مسح جميع السجلات؟')) return;
        try {
            await fetch('/api/logs', { method: 'DELETE' });
            setLogs([]);
        } catch (err) {
            alert('فشل مسح السجلات');
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            localStorage.setItem('erp_db_config', JSON.stringify(config));
            setMsg('✅ تم حفظ إعدادات الربط مع WooCommerce بنجاح');
            setLoading(false);
            setTimeout(() => setMsg(''), 3000);
        }, 1000);
    };

    if (!isAdmin) {
        return <div style={{ padding: '2rem', color: '#ff5252', textAlign: 'center' }}>⛔ عذراً، هذه الشاشة للمديرين فقط</div>;
    }

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--primary-color)' }}>🗄️ إعدادات قاعدة البيانات والربط الخارجي</h1>
                <p style={{ color: '#919398' }}>تهيئة الاتصال مع الموقع الإلكتروني ومتجر WooCommerce</p>
            </header>

            {msg && (
                <div style={{ padding: '15px', borderRadius: '10px', background: 'rgba(102,187,106,0.1)', color: '#66bb6a', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid #66bb6a44' }}>
                    {msg}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* WooCommerce Integration Section */}
                    <div className="glass-panel" style={{ border: '1px solid rgba(150, 88, 138, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#96588a' }}>
                                🛒 ربط متجر WooCommerce
                            </h3>
                            <span style={{ fontSize: '0.7rem', background: '#96588a33', color: '#96588a', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>برمجية WordPress</span>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label htmlFor="woo_url">رابط المتجر (Store URL)</label>
                                <input id="woo_url" type="url" className="input-glass" placeholder="https://your-store-link.com" value={config.websiteUrl} onChange={e => setConfig({ ...config, websiteUrl: e.target.value })} required title="رابط متجر ووكومرس" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label htmlFor="woo_ck">Consumer Key (ck_...)</label>
                                    <input id="woo_ck" type="text" className="input-glass" placeholder="ck_xxxxxxxxxxxx" value={config.wooConsumerKey} onChange={e => setConfig({ ...config, wooConsumerKey: e.target.value })} title="Consumer Key" />
                                </div>
                                <div>
                                    <label htmlFor="woo_cs">Consumer Secret (cs_...)</label>
                                    <input id="woo_cs" type="password" className="input-glass" placeholder="cs_xxxxxxxxxxxx" value={config.wooConsumerSecret} onChange={e => setConfig({ ...config, wooConsumerSecret: e.target.value })} title="Consumer Secret" />
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(150, 88, 138, 0.05)', borderRadius: '8px', border: '1px solid rgba(150, 88, 138, 0.2)' }}>
                                <h4 style={{ color: '#96588a', margin: '0 0 10px', fontSize: '0.9rem' }}>⚙️ خيارات التزامن الذكي</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input type="checkbox" checked={config.syncProducts} onChange={e => setConfig({ ...config, syncProducts: e.target.checked })} title="تزامن التلقائي للمنتجات" />
                                        تحديث تلقائي للمخزون والأسعار من ERP للمتجر
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input type="checkbox" checked={config.syncOrders} onChange={e => setConfig({ ...config, syncOrders: e.target.checked })} title="تزامن الطلبات" />
                                        سحب الطلبات الجديدة من المتجر وتسجيلها في النظام
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label htmlFor="sync_interval">دورية التزامن التلقائي</label>
                                    <select id="sync_interval" className="input-glass" value={config.syncInterval} onChange={e => setConfig({ ...config, syncInterval: e.target.value })} title="اختر مدة التزامن">
                                        <option value="5">كل 5 دقائق</option>
                                        <option value="30">كل 30 دقيقة</option>
                                        <option value="60">كل ساعة</option>
                                        <option value="1440">يومياً</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px', background: '#96588a', height: '45px' }}>
                                    {loading ? 'جاري الفحص...' : '🔗 حفظ وربط المتجر'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Standard API Sync Section */}
                    <div className="glass-panel">
                        <h3 style={{ marginBottom: '1.5rem' }}>إعدادات الربط العام (Web API)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label htmlFor="api_url">رابط الموقع المخصص</label>
                                <input id="api_url" type="text" className="input-glass" value={config.websiteUrl} onChange={e => setConfig({ ...config, websiteUrl: e.target.value })} placeholder="https://api.website.com" title="رابط الـ API" />
                            </div>
                            <div>
                                <label htmlFor="api_token">مفتاح التوثيق (API Token)</label>
                                <input id="api_token" type="password" className="input-glass" value={config.apiKey} onChange={e => setConfig({ ...config, apiKey: e.target.value })} placeholder="JWT / Auth Token" title="مفتاح التوثيق" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>حالة قاعدة البيانات الحالية</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                            <span style={{ color: '#888' }}>النوع:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>SQLite</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                            <span style={{ color: '#888' }}>الحالة:</span>
                            <span style={{ color: '#66bb6a' }}>متصل (محلي) ✅</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                            <span style={{ color: '#888' }}>WooCommerce:</span>
                            <span style={{ color: config.wooConsumerKey ? '#ffa726' : '#666' }}>{config.wooConsumerKey ? 'بانتظار التفعيل' : 'غير مربوط'}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button className="btn-secondary" style={{ width: '100%' }}>
                            📦 تصدير نسخة احتياطية (Backup)
                        </button>
                        <button className="btn-secondary" style={{ width: '100%' }}>
                            📥 استيراد بيانات سابقة
                        </button>
                    </div>
                </div>
            </div>

            {/* System Logs Section */}
            <div className="glass-panel" style={{ marginTop: '2rem', border: '1px solid rgba(255, 82, 82, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#ff5252' }}>
                        📜 سجل أحداث النظام (System Logs)
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => fetchLogs()} className="btn-primary btn-sm">
                            🔄 تحديث السجل
                        </button>
                        <button onClick={clearLogs} className="btn-danger btn-sm">
                            🗑️ مسح السجل
                        </button>
                    </div>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <table className="table-glass" style={{ width: '100%' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--secondary-color)', zIndex: 1 }}>
                            <tr>
                                <th style={{ width: '200px' }}>الوقت</th>
                                <th style={{ width: '150px' }}>الصفحة/API</th>
                                <th style={{ width: '120px' }}>المستخدم</th>
                                <th>الرسالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>لا توجد سجلات حالياً</td>
                                </tr>
                            ) : (
                                logs.map((log: any) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '10px', whiteSpace: 'nowrap', color: '#888' }}>
                                            {new Date(log.timestamp).toLocaleString('ar-EG')}
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#333', fontSize: '0.75rem' }}>{log.page}</span>
                                        </td>
                                        <td style={{ padding: '10px' }}>{log.user}</td>
                                        <td style={{ padding: '10px', color: log.level === 'ERROR' ? '#ff5252' : '#fff' }}>
                                            <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                                                {log.message}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
