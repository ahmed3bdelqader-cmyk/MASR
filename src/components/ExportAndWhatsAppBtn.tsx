'use client';
/**
 * ExportAndWhatsAppBtn — LEGACY SHIM (Phase 1 cleanup)
 *
 * The original complex PDF+WhatsApp button has been replaced by:
 *   - PrintReportBtn  → window.print() for paper output
 *   - WhatsAppBtn     → clean WhatsApp messaging with DB templates
 *
 * This shim keeps old call-sites working without crashing during migration.
 * It renders a WhatsApp button if a phone number is provided, and a print
 * button for the PDF action — NO more jsPDF / html2canvas dependencies.
 */

import React from 'react';
import PrintReportBtn from './PrintReportBtn';
import WhatsAppBtn from './WhatsAppBtn';

export interface ExportAndWhatsAppBtnProps {
    documentTitle?: string;
    fileName?: string;
    tableHeaders?: string[];
    tableRows?: (string | number)[][];
    metaInfo?: [string, string][];
    summaryRows?: [string, string][];
    clientPhone?: string;
    whatsappMessage?: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'icon-only';
    className?: string;
    pdfOnly?: boolean;
    whatsappOnly?: boolean;
    extraContent?: string;
    whatsappTemplateType?: string;
    whatsappData?: Record<string, string>;
}

export default function ExportAndWhatsAppBtn({
    documentTitle = 'تقرير',
    clientPhone,
    whatsappMessage,
    label = '🖨️ طباعة',
    className = '',
    pdfOnly = false,
    whatsappOnly = false,
    whatsappTemplateType,
    whatsappData,
}: ExportAndWhatsAppBtnProps) {

    if (whatsappOnly && clientPhone) {
        return (
            <WhatsAppBtn
                phone={clientPhone}
                templateType={whatsappTemplateType}
                templateData={whatsappData}
                fallbackMessage={whatsappMessage || `مرحباً، هذا ${documentTitle}`}
                showLabel
                className={className}
            />
        );
    }

    if (pdfOnly) {
        return <PrintReportBtn label={label} className={className} />;
    }

    // Both: show print + WhatsApp side by side
    return (
        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
            <PrintReportBtn label={label} className={className} />
            {clientPhone && (
                <WhatsAppBtn
                    phone={clientPhone}
                    templateType={whatsappTemplateType}
                    templateData={whatsappData}
                    fallbackMessage={whatsappMessage || `مرحباً، هذا ${documentTitle}`}
                    showLabel
                />
            )}
        </span>
    );
}
