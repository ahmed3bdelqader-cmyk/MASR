'use client';
import React, { useEffect, useState, useMemo } from 'react';

type Product = {
    id: string, code: string, name: string, stock: number, price: number, description: string | null,
    height: string | null, width: string | null, depth: string | null
};

const SYM = (() => { try { return JSON.parse(localStorage.getItem('erp_settings') || '{}').currencySymbol || 'ج.م'; } catch { return 'ج.م'; } });

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'ALL' | number>(5);
    const [formData, setFormData] = useState({ code: '', name: '', price: '', stock: '', description: '', height: '', width: '', depth: '' });
    const [editId, setEditId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchProducts();

        const saved = localStorage.getItem('erp_products_pageSize');
        if (saved) setPageSize(saved === 'ALL' ? 'ALL' : parseInt(saved, 10));

        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin((u?.role || '').toUpperCase() === 'ADMIN' || !u?.role);
        } catch { }
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editId ? 'PUT' : 'POST';
            const payload = editId ? { ...formData, id: editId } : formData;
            const res = await fetch('/api/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setFormData({ code: '', name: '', price: '', stock: '', description: '', height: '', width: '', depth: '' });
                setEditId(null);
                fetchProducts();
            }
        } catch (e) { console.error(e); }
    };

    const handleEditClick = (p: Product) => {
        setEditId(p.id);
        setFormData({
            code: p.code, name: p.name, price: p.price.toString(), stock: p.stock.toString(),
            description: p.description || '', height: p.height || '', width: p.width || '', depth: p.depth || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف المنتج "${name}"? سيتختفي نهائياً.`)) return;
        try {
            const res = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchProducts();
            else {
                const data = await res.json();
                alert(data.error || 'فشل الحذف');
            }
        } catch { alert('خطأ في الاتصال'); }
    };

    const handlePageSizeChange = (val: string) => {
        const newSize = val === 'ALL' ? 'ALL' : parseInt(val, 10);
        setPageSize(newSize);
        localStorage.setItem('erp_products_pageSize', val);
        setCurrentPage(1);
    };

    // ── Filtering and Pagination ──────────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.includes(searchTerm) ||
            p.code.includes(searchTerm) ||
            (p.description && p.description.includes(searchTerm))
        );
    }, [products, searchTerm]);

    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredProducts.length / pageSize);
    const paginatedProducts = useMemo(() => {
        if (pageSize === 'ALL') return filteredProducts;
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // ── Import/Export Logic ──────────────────────────────────────────────────
    const exportToCSV = () => {
        const headers = ['الكود', 'اسم المنتج', 'السعر', 'المخزون', 'الارتفاع', 'العرض', 'العمق', 'الوصف'];
        const rows = products.map(p => [
            p.code, p.name, p.price, p.stock, p.height || '', p.width || '', p.depth || '', p.description || ''
        ]);
        let csvContent = "\uFEFF"; // BOM
        csvContent += headers.join(",") + "\n";
        rows.forEach(row => {
            const escapedRow = row.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += escapedRow.join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `كتالوج_المنتجات_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/);
                if (lines.length < 2) return;
                const items = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
                    if (cells.length >= 2) {
                        items.push({
                            code: cells[0], name: cells[1], price: cells[2], stock: cells[3] || '0',
                            height: cells[4] || null, width: cells[5] || null, depth: cells[6] || null,
                            description: cells[7] || ''
                        });
                    }
                }
                if (items.length > 0) {
                    if (!confirm(`سيتم استيراد ${items.length} منتج. استمرار؟`)) return;
                    setLoading(true);
                    const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
                    if (res.ok) { alert('✅ تم الاستيراد بنجاح'); fetchProducts(); }
                    else alert('❌ فشل الاستيراد');
                }
            } catch { alert('❌ خطأ في معالجة الملف'); } finally { setLoading(false); if (e.target) e.target.value = ''; }
        };
        reader.readAsText(file, "UTF-8");
    };

    const sym = SYM();

    return (
        <div className="unified-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">🏷️ الكتالوج والمنتجات</h1>
                    <p className="page-subtitle">
                        إدارة <strong style={{ color: 'var(--text-primary)' }}>{products.length}</strong> موديل | القيمة التقديرية للمخزون:{" "}
                        <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>
                            {mounted ? products.reduce((a, b) => a + (b.price * b.stock), 0).toLocaleString('en-US') : '0'} {mounted ? SYM() : 'ج.م'}
                        </span>
                    </p>
                </div>
            </header>

            {/* ── Main Grid: sidebar (form) + content (table) ── */}
            <div className="reports-grid" style={{ alignItems: 'start' }}>

                {/* ─────────────── RIGHT SIDEBAR ─────────────── */}
                <div className="glass-panel report-sidebar-menu" style={{ position: 'sticky', top: '20px' }}>

                    {/* Add / Edit Form — admin only */}
                    {isAdmin ? (
                        <>
                            <h4 style={{ margin: '0 0 14px', color: editId ? '#ffa726' : '#919398', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {editId ? '✏️ تعديل الموديل' : '✨ إضافة موديل جديد'}
                            </h4>
                            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* Code + Name */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ flex: '0 0 80px' }}>
                                        <label htmlFor="p_code" style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>الكود</label>
                                        <input id="p_code" type="text" className="input-glass" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label htmlFor="p_name" style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>اسم الموديل</label>
                                        <input id="p_name" type="text" className="input-glass" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                </div>

                                {/* Dimensions */}
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>المقاسات (ط × ع × ع)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                        <input id="p_h" type="number" className="input-glass" placeholder="طول" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                                        <input id="p_w" type="number" className="input-glass" placeholder="عرض" value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} />
                                        <input id="p_d" type="number" className="input-glass" placeholder="عمق" value={formData.depth} onChange={e => setFormData({ ...formData, depth: e.target.value })} />
                                    </div>
                                </div>

                                {/* Price + Stock */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label htmlFor="p_prc" style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>السعر ({sym})</label>
                                        <input id="p_prc" type="number" className="input-glass" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label htmlFor="p_stk" style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>الرصيد</label>
                                        <input id="p_stk" type="number" className="input-glass" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="p_desc" style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '4px' }}>الوصف</label>
                                    <textarea id="p_desc" className="input-glass" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ resize: 'none' }} />
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-modern btn-primary" style={{ flex: 1, background: editId ? '#ffa726' : undefined, boxShadow: editId ? '0 4px 14px rgba(255,167,38,0.3)' : undefined }}>
                                        {editId ? '💾 حفظ التعديل' : '➕ إضافة'}
                                    </button>
                                    {editId && (
                                        <button type="button" className="btn-modern btn-secondary" style={{ flex: '0 0 auto', width: '42px' }}
                                            onClick={() => { setEditId(null); setFormData({ code: '', name: '', price: '', stock: '', description: '', height: '', width: '', depth: '' }); }}>
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Import / Export divider */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '16px 0 12px' }} />
                            <h4 style={{ margin: '0 0 10px', color: '#919398', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>استيراد وتصدير</h4>
                        </>
                    ) : (
                        <h4 style={{ margin: '0 0 14px', color: '#919398', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>الإجراءات</h4>
                    )}

                    {/* Export CSV */}
                    <button onClick={exportToCSV} className="btn-modern btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', color: '#29b6f6', borderColor: 'rgba(41,182,246,0.25)', marginBottom: '8px' }}>
                        📥 تصدير الكتالوج CSV
                    </button>

                    {/* Import CSV */}
                    {isAdmin && (
                        <label className="btn-modern btn-secondary"
                            style={{ width: '100%', justifyContent: 'center', color: '#66bb6a', borderColor: 'rgba(102,187,106,0.25)', display: 'flex', alignItems: 'center', cursor: 'pointer', boxSizing: 'border-box' }}>
                            📤 استيراد من CSV
                            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                        </label>
                    )}
                </div>

                {/* ─────────────── MAIN CONTENT ─────────────── */}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Search bar */}
                    <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
                        <label htmlFor="p_search" style={{ fontSize: '0.75rem', color: '#919398', display: 'block', marginBottom: '6px' }}>البحث في الكتالوج</label>
                        <input
                            id="p_search"
                            type="text"
                            className="input-glass"
                            placeholder="🔍 ابحث بالكود أو اسم الموديل أو الوصف..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Products Table */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        {loading ? (
                            <p style={{ textAlign: 'center', color: '#555', padding: '3rem' }}>⏳ جاري تحميل الكتالوج...</p>
                        ) : (
                            <>
                                <div className="smart-table-container">
                                    <table className="smart-table">
                                        <thead>
                                            <tr>
                                                <th className="hide-on-tablet text-right">الكود</th>
                                                <th className="text-right">الموديل</th>
                                                <th className="hide-on-tablet text-center">المقاسات</th>
                                                <th className="text-center">السعر</th>
                                                <th className="text-center">المخزون</th>
                                                {isAdmin && <th className="text-center">إجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedProducts.map(p => (
                                                <tr key={p.id}>
                                                    <td className="hide-on-tablet" data-label="الكود">
                                                        <code className="text-primary font-bold p-1 bg-dark">{p.code}</code>
                                                    </td>
                                                    <td data-label="الموديل">
                                                        <div className="mobile-card-title">{p.name}</div>
                                                        {p.description && <div className="text-muted text-sm mt-1">{p.description}</div>}
                                                    </td>
                                                    <td className="hide-on-tablet text-center text-sm" data-label="المقاسات">
                                                        {p.height ? `${p.height}×${p.width}×${p.depth}` : <span>—</span>}
                                                    </td>
                                                    <td className="text-center" data-label="السعر">
                                                        <div className="mobile-card-balance balance-green">
                                                            {Number(p.price).toLocaleString('en-US')} <span className="text-sm font-normal">{sym}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center" data-label="المخزون">
                                                        <span className={`sh-badge ${p.stock <= 5 ? 'unpaid' : 'partial'}`}>
                                                            {p.stock}
                                                        </span>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="text-center" data-label="إجراءات">
                                                            <div className="action-bar-cell mobile-card-actions">
                                                                <button onClick={() => handleEditClick(p)} className="btn-modern btn-secondary btn-sm" title="تعديل">✏️</button>
                                                                <button onClick={() => handleDelete(p.id, p.name)} className="btn-modern btn-danger btn-sm" title="حذف">🗑️</button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredProducts.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                                            لا توجد موديلات تطابق بحثك.
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap-reverse', gap: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px 15px', borderRadius: '20px' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>عدد النتائج:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => handlePageSizeChange(e.target.value)}
                                            style={{ padding: '0px', fontSize: '0.9rem', width: 'auto', border: 'none', background: 'transparent', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                                            aria-label="Items per page"
                                        >
                                            <option style={{ color: '#000' }} value={5}>5</option>
                                            <option style={{ color: '#000' }} value={10}>10</option>
                                            <option style={{ color: '#000' }} value={20}>20</option>
                                            <option style={{ color: '#000' }} value={50}>50</option>
                                            <option style={{ color: '#000' }} value="ALL">الكل</option>
                                        </select>
                                    </div>

                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flex: '1 1 auto', maxWidth: '350px' }}>
                                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-modern btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>&rarr; السابق</button>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', background: 'rgba(227,94,53,0.1)', color: 'var(--primary-color)', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr', whiteSpace: 'nowrap', border: '1px solid rgba(227,94,53,0.2)' }}>
                                                {currentPage} / {totalPages}
                                            </div>
                                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-modern btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1, padding: '8px 15px', flex: 1, justifyContent: 'center' }}>التالي &larr;</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


