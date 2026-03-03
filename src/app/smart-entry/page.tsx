'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import './smart-entry.css';

interface ExtractedItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export default function SmartEntryPage() {
    const [mounted, setMounted] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const [invoiceType, setInvoiceType] = useState<'PURCHASE' | 'SALE'>('PURCHASE');

    // Extracted Data State
    const [partyName, setPartyName] = useState('');
    const [partyPhone, setPartyPhone] = useState('');
    const [items, setItems] = useState<ExtractedItem[]>([]);
    const [invoiceTotal, setInvoiceTotal] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);

    // Side Panel state for Sales
    const [showPriceHistory, setShowPriceHistory] = useState(false);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null); // Document icon or something
            }
        }
    };

    const startExtraction = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(10);
        setIsReviewMode(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            setProgress(40);

            const resp = await fetch('/api/smart-entry/analyze', {
                method: 'POST',
                body: formData,
            });

            setProgress(80);

            const result = await resp.json();

            if (!resp.ok || !result.success) {
                throw new Error(result.error || 'فشل في تحليل الفاتورة');
            }

            setProgress(100);
            finishExtraction(result.data, result.isFallback);

        } catch (err: any) {
            console.error(err);
            alert('حدث خطأ أثناء الرفع والتحليل: ' + err.message);
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const finishExtraction = (extractedData: any, isFallback: boolean) => {
        setIsProcessing(false);

        if (isFallback) {
            console.warn("Used heuristic fallback due to missing OCR Keys");
        }

        setPartyName(extractedData.partyName || (invoiceType === 'PURCHASE' ? 'مورد مجهول' : 'عميل مجهول'));
        setPartyPhone(extractedData.partyPhone || '');
        setItems(extractedData.items || []);
        setInvoiceTotal(extractedData.total || 0);

        setIsReviewMode(true);

        if (invoiceType === 'SALE') {
            setPriceHistory([
                {
                    date: new Date().toLocaleDateString('ar-EG'),
                    item: extractedData.items?.[0]?.name || 'بند مصنع',
                    price: extractedData.items?.[0]?.unitPrice || 0
                },
            ]);
        }
    };

    const updateItem = (id: string, field: keyof ExtractedItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = updated.quantity * updated.unitPrice;
                }
                return updated;
            }
            return item;
        }));
    };

    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        setInvoiceTotal(total);
    }, [items]);

    const handleSave = async (status: string) => {
        if (!partyName || items.length === 0) {
            alert('لا توجد بيانات كافية للحفظ');
            return;
        }

        setIsProcessing(true);

        // Here we would use FormData to upload the file along with payload
        const payload = {
            type: invoiceType,
            partyName,
            partyPhone,
            items,
            total: invoiceTotal,
            documentStatus: status
        };

        try {
            const resp = await fetch('/api/smart-entry/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await resp.json();
            if (result.success) {
                alert('تم حفظ البيانات وتنفيذ العمليات بنجاح!');
                // Reset
                setFile(null);
                setPreview(null);
                setIsReviewMode(false);
                setPartyName('');
                setPartyPhone('');
                setItems([]);
            } else {
                alert('حدث خطأ أثناء الحفظ');
            }
        } catch (err) {
            console.error(err);
            alert('خطأ في الشبكة');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="smart-entry-container animate-fade-in">
            {/* Header */}
            <header className="se-header glass-panel">
                <div className="se-title-container">
                    <div className="se-icon">⚡</div>
                    <div>
                        <h1 className="se-title">المدخل الذكي (Smart Entry)</h1>
                        <p className="se-subtitle">قراءة وإدخال الفواتير بالـ AI</p>
                    </div>
                </div>
                <Link href="/" className="se-back-btn">رجوع للرئيسية</Link>
            </header>

            <div className={`se-main-grid ${!isReviewMode ? 'se-centered-mode' : ''}`}>
                {/* Left Side (or Top on Mobile): Actions */}
                <div className="se-actions-panel">
                    <label className="se-label">نوع العملية</label>
                    <div className="se-type-selector">
                        <button
                            className={`se-type-btn ${invoiceType === 'PURCHASE' ? 'active' : ''}`}
                            onClick={() => setInvoiceType('PURCHASE')}
                        >
                            🛒 فاتورة مشتريات
                        </button>
                        <button
                            className={`se-type-btn ${invoiceType === 'SALE' ? 'active' : ''}`}
                            onClick={() => setInvoiceType('SALE')}
                        >
                            💵 فاتورة مبيعات
                        </button>
                    </div>

                    {!isReviewMode && (
                        <div className="se-upload-area">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*,.pdf,.xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            <input
                                type="file"
                                ref={cameraInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                            />

                            <div className="se-upload-buttons">
                                <button className="se-action-btn primary" onClick={() => cameraInputRef.current?.click()}>
                                    📷 تصوير الكاميرا
                                </button>
                                <button className="se-action-btn secondary" onClick={() => fileInputRef.current?.click()}>
                                    📁 رفع ملف (PDF / صورة)
                                </button>
                            </div>

                            {preview && (
                                <div className="se-preview-container">
                                    <img src={preview} alt="Preview" className="se-preview-img" />
                                </div>
                            )}
                            {file && !preview && (
                                <div className="se-file-badge">📄 {file.name}</div>
                            )}

                            {file && (
                                <button className="se-analyze-btn" onClick={startExtraction} disabled={isProcessing}>
                                    {isProcessing ? 'جاري التحليل...' : '🔍 بدء التحليل بالذكاء الاصطناعي'}
                                </button>
                            )}
                        </div>
                    )}

                    {isProcessing && progress > 0 && progress < 100 && (
                        <div className="se-progress-container">
                            <div className="se-progress-bar" style={{ width: `${progress}%` }}></div>
                            <p className="se-progress-text">جاري استخراج البيانات... {progress}%</p>
                        </div>
                    )}

                    {isReviewMode && invoiceType === 'SALE' && (
                        <button className="se-history-btn" onClick={() => setShowPriceHistory(!showPriceHistory)}>
                            📜 {showPriceHistory ? 'إخفاء تاريخ الأسعار' : 'عرض تاريخ الأسعار لهذا العميل'}
                        </button>
                    )}

                    {isReviewMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="se-save-btn" onClick={() => handleSave('POSTED')} disabled={isProcessing}>
                                {isProcessing ? 'جاري الحفظ...' : '✅ تأكيد واعتماد وتحديث الأرصدة'}
                            </button>
                            <button className="se-action-btn secondary" onClick={() => handleSave('ARCHIVED')} disabled={isProcessing} style={{ background: '#2c3e50', borderColor: '#34495e', color: '#ecf0f1' }}>
                                {isProcessing ? 'جاري الحفظ...' : '💾 حفظ كمسودة / أرشيف فقط'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side (or Bottom on Mobile): Review Area */}
                {isReviewMode && (
                    <div className="se-review-panel glass-panel">
                        <h2 className="se-panel-title">مراجعة البيانات المستخرجة</h2>

                        <div className="se-form-group">
                            <label htmlFor="partyName" className="se-label">{invoiceType === 'PURCHASE' ? 'اسم المورد' : 'اسم العميل'}</label>
                            <input
                                id="partyName"
                                type="text"
                                className="se-input"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                            />
                        </div>

                        <div className="se-form-group">
                            <label htmlFor="partyPhone" className="se-label">رقم الهاتف</label>
                            <input
                                id="partyPhone"
                                type="text"
                                className="se-input"
                                value={partyPhone}
                                onChange={(e) => setPartyPhone(e.target.value)}
                            />
                        </div>

                        <label className="se-label">قائمة الأصناف المستخرجة</label>
                        <div className="se-table-container">
                            <table className="se-table">
                                <thead>
                                    <tr>
                                        <th>الصنف</th>
                                        <th>الكمية</th>
                                        <th>السعر</th>
                                        <th>الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td data-label="الصنف">
                                                <input
                                                    type="text"
                                                    className="se-td-input"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td data-label="الكمية">
                                                <input
                                                    type="number"
                                                    className="se-td-input"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td data-label="السعر">
                                                <input
                                                    type="number"
                                                    className="se-td-input"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td data-label="الإجمالي" className="se-td-total">
                                                {item.total.toLocaleString('en-US')} ج.م
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="se-total-banner">
                            الإجمالي النهائي: {invoiceTotal.toLocaleString('en-US')} ج.م
                        </div>
                    </div>
                )}

                {/* Side Panel specific to Sales */}
                {isReviewMode && invoiceType === 'SALE' && showPriceHistory && (
                    <div className="se-side-panel glass-panel">
                        <h3 className="se-panel-title">تاريخ الأسعار للعميل</h3>
                        <p className="se-text-muted">آخر المعاملات مع {partyName}</p>
                        <div className="se-history-list">
                            {priceHistory.map((ph, i) => (
                                <div key={i} className="se-history-item">
                                    <div className="se-history-details">
                                        <span className="se-history-date">{ph.date}</span>
                                        <span className="se-history-name">{ph.item}</span>
                                    </div>
                                    <div className="se-history-price">{ph.price} ج.م</div>
                                </div>
                            ))}
                            {priceHistory.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>لا توجد معاملات سابقة</div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
