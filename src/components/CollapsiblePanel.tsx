'use client';
import React, { useState } from 'react';

interface CollapsiblePanelProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    style?: React.CSSProperties;
    headerStyle?: React.CSSProperties;
}

export default function CollapsiblePanel({
    title,
    children,
    defaultOpen = true,
    style = {},
    headerStyle = {}
}: CollapsiblePanelProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', ...style }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: isOpen ? '1px solid var(--border-color)' : 'none',
                    transition: 'all 0.3s',
                    ...headerStyle
                }}
            >
                <div style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {title}
                </div>
                <button
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'transform 0.3s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                    title={isOpen ? 'طي (إخفاء)' : 'توسيع (إظهار)'}
                >
                    ▼
                </button>
            </div>

            <div
                style={{
                    maxHeight: isOpen ? '5000px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s ease-in-out',
                }}
            >
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
