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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [formData, setFormData] = useState({ code: '', name: '', price: '', stock: '', description: '', height: '', width: '', depth: '' });
    const [editId, setEditId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetchProducts();
        try {
            const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
            setIsAdmin(u.role === 'ADMIN' || !u.role);
        } catch { }
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
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

    // ── Filtering and Pagination ──────────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.includes(searchTerm) ||
            p.code.includes(searchTerm) ||
            (p.description && p.description.includes(searchTerm))
        );
    }, [products, searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const paginatedProducts = useMemo(() => {
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
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--primary-color)' }}>🏷️ الكتالوج والمنتجات</h1>
                <p style={{ color: '#919398' }}>إدارة {products.length} موديل | القيمة التقديرية للمخزون: <span style={{ color: '#fff' }}>{products.reduce((a, b) => a + (b.price * b.stock), 0).toLocaleString()} {sym}</span></p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'minmax(300px, 350px) 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Form Section */}
                {isAdmin && (
                    <div className="glass-panel" style={{ position: 'sticky', top: '20px' }}>
                        <h3 style={{ marginBottom: '1.2rem', color: editId ? '#ffa726' : '#fff' }}>
                            {editId ? '✏️ تعديل المنتج' : '✨ إضافة موديل'}
                        </h3>
                        <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label htmlFor="p_code">الكود</label><input id="p_code" type="text" className="input-glass" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required title="كود المنتج" /></div>
                                <div style={{ flex: 2 }}><label htmlFor="p_name">اسم الموديل</label><input id="p_name" type="text" className="input-glass" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required title="اسم الموديل" /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div><label htmlFor="p_h">طول</label><input id="p_h" type="number" className="input-glass" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} title="الارتفاع" /></div>
                                <div><label htmlFor="p_w">عرض</label><input id="p_w" type="number" className="input-glass" value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} title="العرض" /></div>
                                <div><label htmlFor="p_d">عمق</label><input id="p_d" type="number" className="input-glass" value={formData.depth} onChange={e => setFormData({ ...formData, depth: e.target.value })} title="العمق" /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div><label htmlFor="p_prc">السعر ({sym})</label><input id="p_prc" type="number" className="input-glass" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required title="السعر" /></div>
                                <div><label htmlFor="p_stk">الرصيد</label><input id="p_stk" type="number" className="input-glass" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} title="الرصيد" /></div>
                            </div>
                            <div><label htmlFor="p_desc">الوصف</label><textarea id="p_desc" className="input-glass" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} title="الوصف" /></div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 2, background: editId ? '#ffa726' : 'var(--primary-color)' }}>{editId ? 'حفظ' : 'إضافة'}</button>
                                {editId && <button type="button" onClick={() => { setEditId(null); setFormData({ code: '', name: '', price: '', stock: '', description: '', height: '', width: '', depth: '' }) }} className="btn-secondary" style={{ flex: 1 }}>إغلاق</button>}
                            </div>
                        </form>
                    </div>
                )}

                {/* Table Section */}
                <div className="glass-panel" style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <label htmlFor="p_search" className="sr-only">ابحث عن موديل</label>
                            <input id="p_search" type="text" className="input-glass" placeholder="🔍 ابحث بالكود أو الاسم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} title="البحث في الكتالوج" />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button onClick={exportToCSV} className="btn-secondary" style={{ color: '#29b6f6', borderColor: 'rgba(41, 182, 246, 0.3)' }}>
                                📥 تصدير
                            </button>
                            {isAdmin && (
                                <label className="btn-secondary" style={{ color: '#66bb6a', borderColor: 'rgba(102, 187, 106, 0.3)', margin: 0 }}>
                                    📤 استيراد
                                    <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>
                    </div>

                    {loading ? <p>جاري التحميل...</p> : (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table-glass" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <thead>
                                        <tr>
                                            <th>الكود</th>
                                            <th>المنتج</th>
                                            <th>المقاسات</th>
                                            <th>السعر</th>
                                            <th>المخزون</th>
                                            {isAdmin && <th>إجراءات</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedProducts.map(p => (
                                            <tr key={p.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '12px' }}><code style={{ color: '#888' }}>{p.code}</code></td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                    {p.description && <div style={{ fontSize: '0.7rem', color: '#666' }}>{p.description}</div>}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '0.85rem' }}>{p.height ? `${p.height}×${p.width}×${p.depth}` : '-'}</td>
                                                <td style={{ padding: '12px', fontWeight: 800, color: 'var(--primary-color)' }}>{Number(p.price).toLocaleString()} {sym}</td>
                                                <td style={{ padding: '12px' }}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>{p.stock}</span></td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleEditClick(p)}
                                                            className="btn-secondary btn-sm"
                                                            style={{ color: '#ffa726', borderColor: 'rgba(255, 167, 38, 0.2)' }}
                                                            title="تعديل"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id, p.name)}
                                                            className="btn-danger btn-sm"
                                                            title="حذف"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredProducts.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>لا توجد منتجات تطابق بحثك.</p>}
                            </div>

                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn-secondary" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>السابق</button>
                                    <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>{currentPage} / {totalPages}</span>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn-secondary" style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>التالي</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
