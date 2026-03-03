'use client';
import React, { useState, useEffect } from 'react';

export default function ConnectionSettingsPage() {
    const [config, setConfig] = useState({
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
    const [tab, setTab] = useState<'sync' | 'backup' | 'logs'>('sync');

    // Reset Data States
    const [resetStep, setResetStep] = useState(0);
    const [challenge, setChallenge] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);

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
            setMsg('✅ تم حفظ إعدادات الربط بنجاح');
            setLoading(false);
            setTimeout(() => setMsg(''), 3000);
        }, 1000);
    };

    const handleExportAll = async () => {
        try {
            setMsg('🔄 جاري تصدير نسخة كاملة للبرنامج...');
            const res = await fetch('/api/settings/db/backup');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `StandMasr_Full_Backup_${new Date().toISOString().split('T')[0]}.sql`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setMsg('✅ تم تصدير النسخة الاحتياطية بنجاح!');
            } else {
                const err = await res.json();
                alert('❌ فشل التصدير: ' + err.error);
            }
        } catch (err) {
            alert('❌ حدث خطأ أثناء التصدير');
        } finally {
            setTimeout(() => setMsg(''), 4000);
        }
    };

    const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('⚠️ تحذير خطير: استيراد بيانات سابقة سيمسح كل البيانات الحالية ويستبدلها بالبيانات من الملف الذي تم رفعه بالكامل. هل أنت متأكد من الاستمرار؟')) return;

        try {
            setMsg('🔄 جاري استعادة البيانات... يرجى الانتظار');
            const dataForm = new FormData();
            dataForm.append('file', file);

            const res = await fetch('/api/settings/db/restore', {
                method: 'POST',
                body: dataForm
            });

            const data = await res.json();
            if (res.ok) {
                alert('✅ ' + data.message);
                window.location.reload();
            } else {
                alert('❌ ' + data.error);
            }
        } catch (err) {
            alert('❌ فشل قراءة الملف أو الاتصال بالخادم');
        } finally {
            setMsg('');
            if (e.target) e.target.value = '';
        }
    };

    const startReset = () => {
        const num = Math.floor(1000 + Math.random() * 9000);
        setChallenge(num);
        setResetStep(1);
        setUserInput('');
    };

    const processReset = async () => {
        if (parseInt(userInput) !== challenge) {
            alert('❌ الرقم المدخل غير صحيح. حاول مرة أخرى.');
            return;
        }

        setResetting(true);
        try {
            const res = await fetch('/api/settings/db/reset', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('🎉 ' + data.message);
                localStorage.clear();
                window.location.href = '/login';
            } else {
                alert('❌ ' + data.error);
            }
        } catch (err) {
            alert('❌ فشل الاتصال بالخادم لتصفير البرنامج');
        } finally {
            setResetting(false);
            setResetStep(0);
        }
    };

    if (!isAdmin) {
        return <div className="admin-only-message">⛔ عذراً، هذه الشاشة للمديرين فقط</div>;
    }

    return (
        <div className="unified-container animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">🔗 إعدادات الربط والنسخ الاحتياطي</h1>
                    <p className="page-subtitle">تهيئة الاتصال الخارجي وإدارة بيانات البرنامج بالكامل</p>
                </div>
            </header>

            {msg && (
                <div className="sh-badge paid full-width-badge">
                    {msg}
                </div>
            )}

            <div className="settings-layout-grid">
                <div className="glass-panel report-sidebar-menu sticky-sidebar">
                    <h4 className="settings-section-label sidebar-title">أقسام قاعدة البيانات</h4>
                    <div className="report-sidebar-list sidebar-nav">
                        <button onClick={() => setTab('sync')} className={`nav-item-btn ${tab === 'sync' ? 'active' : ''}`}>🔗 ربط المتجر والمواقع</button>
                        <button onClick={() => setTab('backup')} className={`nav-item-btn ${tab === 'backup' ? 'active' : ''}`}>🛡️ النسخ الاحتياطي الشامل</button>
                        <button onClick={() => setTab('logs')} className={`nav-item-btn ${tab === 'logs' ? 'active' : ''}`}>📜 سجلات النظام</button>
                    </div>
                </div>

                <div className="content-view-container">
                    {tab === 'sync' && (
                        <div className="sync-tab-content">
                            <div className="glass-panel integration-section woo-section">
                                <div className="section-header">
                                    <h3 className="section-title-wrapper">🛒 ربط متجر WooCommerce</h3>
                                    <span className="platform-badge">برمجية WordPress</span>
                                </div>

                                <form onSubmit={handleSave} className="integration-form">
                                    <div>
                                        <label htmlFor="woo_url">رابط المتجر (Store URL)</label>
                                        <input id="woo_url" type="url" className="input-glass" placeholder="https://your-store-link.com" value={config.websiteUrl} onChange={e => setConfig({ ...config, websiteUrl: e.target.value })} required />
                                    </div>

                                    <div className="form-grid dual-col">
                                        <div>
                                            <label htmlFor="woo_ck">Consumer Key (ck_...)</label>
                                            <input id="woo_ck" type="text" className="input-glass" placeholder="ck_xxxxxxxxxxxx" value={config.wooConsumerKey} onChange={e => setConfig({ ...config, wooConsumerKey: e.target.value })} />
                                        </div>
                                        <div>
                                            <label htmlFor="woo_cs">Consumer Secret (cs_...)</label>
                                            <input id="woo_cs" type="password" className="input-glass" placeholder="cs_xxxxxxxxxxxx" value={config.wooConsumerSecret} onChange={e => setConfig({ ...config, wooConsumerSecret: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="action-grid dual-col align-end">
                                        <div>
                                            <label htmlFor="sync_interval">دورية التزامن التلقائي</label>
                                            <select id="sync_interval" className="input-glass" value={config.syncInterval} onChange={e => setConfig({ ...config, syncInterval: e.target.value })}>
                                                <option value="5">كل 5 دقائق</option>
                                                <option value="30">كل 30 دقيقة</option>
                                                <option value="60">كل ساعة</option>
                                                <option value="1440">يومياً</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn-primary platform-submit-btn woo-btn" disabled={loading}>
                                            {loading ? 'جاري الفحص...' : '🔗 حفظ وربط المتجر'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="glass-panel integration-section">
                                <h3 className="generic-section-title">إعدادات الربط العام (Web API)</h3>
                                <div className="form-grid dual-col">
                                    <div>
                                        <label htmlFor="api_url">رابط الموقع المخصص</label>
                                        <input id="api_url" type="text" className="input-glass" value={config.websiteUrl} onChange={e => setConfig({ ...config, websiteUrl: e.target.value })} placeholder="https://api.website.com" />
                                    </div>
                                    <div>
                                        <label htmlFor="api_token">مفتاح التوثيق (API Token)</label>
                                        <input id="api_token" type="password" className="input-glass" value={config.apiKey} onChange={e => setConfig({ ...config, apiKey: e.target.value })} placeholder="JWT / Auth Token" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'backup' && (
                        <div className="backup-tab-content">
                            <div className="glass-panel hero-backup-panel">
                                <div className="backup-header-icon">🛡️</div>
                                <h2 className="backup-main-title">نظام النسخ الاحتياطي الشامل</h2>
                                <p className="backup-description">هذا القسم يسمح لك بإدارة كافة بيانات النظام (العملاء، الموظفين، المنتجات، المبيعات... الخ) بضغطة زر واحدة.</p>

                                <div className="backup-main-actions">
                                    <button className="btn-modern btn-lg export-all-btn" onClick={handleExportAll}>
                                        <span className="btn-icon">📥</span>
                                        تصدير نسخة كاملة (Backup)
                                    </button>

                                    <label className="btn-modern btn-lg import-all-btn">
                                        <span className="btn-icon">📤</span>
                                        استيراد نسخة كاملة (Restore)
                                        <input type="file" accept=".sql" onChange={handleImportAll} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>

                            <div className="glass-panel danger-zone-red mt-4">
                                <div className="danger-header">
                                    <h3 className="text-danger">📛 منطقة الخطر: تصفير البرنامج</h3>
                                    <p className="panel-hint">تقوم هذه العملية بحذف كافة البيانات من جميع الأقسام والبدء من الصفر. لا يمكن التراجع!</p>
                                </div>

                                {resetStep === 0 ? (
                                    <button className="btn-danger btn-reset-full" onClick={startReset}>
                                        🗑️ تصفير البرنامج وحذف كافة البيانات
                                    </button>
                                ) : (
                                    <div className="reset-challenge-box animate-pop-in">
                                        <p className="challenge-text">⚠️ لتأكيد الحذف النهائي، يرجى كتابة الرقم التالي:</p>
                                        <div className="challenge-number">{challenge}</div>
                                        <div className="challenge-input-row">
                                            <input
                                                type="number"
                                                className="input-glass challenge-input"
                                                placeholder="اكتب الرقم هنا"
                                                value={userInput}
                                                onChange={e => setUserInput(e.target.value)}
                                            />
                                            <button className="btn-danger btn-confirm-reset" onClick={processReset} disabled={resetting}>
                                                {resetting ? 'جاري التصفير...' : '✅ تأكيد الحذف النهائي'}
                                            </button>
                                            <button className="btn-secondary" onClick={() => setResetStep(0)}>إلغاء</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'logs' && (
                        <div className="glass-panel logs-panel">
                            <div className="logs-header">
                                <h3 className="logs-title-group">📜 سجل أحداث النظام</h3>
                                <div className="logs-actions">
                                    <button onClick={() => fetchLogs()} className="log-btn-premium refresh-log-btn">
                                        <span className="btn-icon">🔄</span> تحديث
                                    </button>
                                    <button onClick={clearLogs} className="log-btn-premium clear-log-btn">
                                        <span className="btn-icon">🗑️</span> مسح السجل
                                    </button>
                                </div>
                            </div>

                            <div className="logs-table-wrapper">
                                <table className="table-glass logs-table">
                                    <thead className="logs-thead">
                                        <tr>
                                            <th>الوقت</th>
                                            <th>الرسالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr><td colSpan={2} className="log-empty-cell">لا توجد سجلات حالياً</td></tr>
                                        ) : (
                                            logs.map((log: any) => (
                                                <tr key={log.id} className="log-row">
                                                    <td>{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                                                    <td className={log.level === 'ERROR' ? 'text-danger' : ''}>{log.message}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .settings-layout-grid {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 2rem;
                    align-items: start;
                }
                .sticky-sidebar {
                    position: sticky;
                    top: 24px;
                }
                .nav-item-btn {
                    text-align: right;
                    padding: 15px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    font-weight: 600;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .nav-item-btn.active {
                    background: linear-gradient(135deg, var(--primary-color), #2196f3);
                    color: #fff;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                }
                .hero-backup-panel {
                    text-align: center;
                    padding: 3rem 2rem;
                    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                }
                .backup-header-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    filter: drop-shadow(0 0 15px var(--primary-color));
                }
                .backup-main-title {
                    font-size: 1.8rem;
                    margin-bottom: 1rem;
                    font-weight: 800;
                    background: linear-gradient(to right, #fff, #999);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .backup-description {
                    color: var(--text-muted);
                    max-width: 600px;
                    margin: 0 auto 2rem;
                    line-height: 1.6;
                }
                .backup-main-actions {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }
                .export-all-btn, .import-all-btn {
                    min-width: 250px;
                    height: 60px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    border-radius: 16px;
                }
                .export-all-btn {
                    background: var(--secondary-color);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .danger-zone-red {
                    border: 1px solid rgba(255, 82, 82, 0.3);
                    background: rgba(255, 82, 82, 0.05);
                    padding: 2rem;
                    border-radius: 20px;
                }
                .danger-header {
                    margin-bottom: 1.5rem;
                }
                .btn-reset-full {
                    width: 100%;
                    padding: 1.2rem;
                    font-weight: 800;
                    font-size: 1.1rem;
                    border-radius: 12px;
                }
                .reset-challenge-box {
                    background: rgba(0,0,0,0.4);
                    padding: 2rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.05);
                    text-align: center;
                }
                .challenge-number {
                    font-size: 3rem;
                    font-weight: 900;
                    color: #ff5252;
                    letter-spacing: 5px;
                    margin: 1rem 0;
                    font-family: monospace;
                }
                .challenge-input-row {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 1.5rem;
                }
                .challenge-input {
                    width: 150px;
                    text-align: center;
                    font-size: 1.2rem;
                    font-weight: 800;
                }
                .logs-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    gap: 15px;
                }
                .logs-actions {
                    display: flex;
                    gap: 10px;
                }
                .log-btn-premium {
                    border: none;
                    padding: 10px 18px;
                    border-radius: 12px;
                    color: #fff !important;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 0.9rem;
                    white-space: nowrap;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                }
                .refresh-log-btn {
                    background: linear-gradient(135deg, #2196f3, #1565c0);
                }
                .clear-log-btn {
                    background: linear-gradient(135deg, #f44336, #c62828);
                }
                .log-btn-premium:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                    filter: brightness(1.1);
                }
                .log-btn-premium:active {
                    transform: translateY(0);
                }
                .btn-icon {
                    font-size: 1.1rem;
                    line-height: 1;
                    display: inline-flex;
                }
                @media (max-width: 992px) {
                    .settings-layout-grid {
                        grid-template-columns: 1fr;
                    }
                    .logs-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .logs-actions {
                        width: 100%;
                    }
                    .log-btn-premium {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
