'use client';
/**
 * PrintReportBtn — Native browser print button
 * Uses window.print() so the browser handles fonts, RTL, and page layout.
 * @media print CSS in globals.css hides nav/sidebar and formats the page.
 */
import React from 'react';

interface PrintReportBtnProps {
    label?: string;
    className?: string;
    /** Optional: scroll to top before printing for cleaner output */
    scrollTop?: boolean;
    style?: React.CSSProperties;
}

export default function PrintReportBtn({
    label = '🖨️ طباعة',
    className = '',
    scrollTop = true,
    style,
}: PrintReportBtnProps) {
    const handlePrint = () => {
        if (scrollTop) window.scrollTo(0, 0);
        window.print();
    };

    return (
        <button
            onClick={handlePrint}
            className={className.trim()}
            style={style}
            aria-label="طباعة التقرير"
        >
            {label}
        </button>
    );
}
