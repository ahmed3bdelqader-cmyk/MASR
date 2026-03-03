'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', direction: 'rtl' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ حدث خطأ غير متوقع أثناء المعاينة</h2>
                    <p style={{ fontSize: '14px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {this.state.error?.message || 'Unknown error'}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
