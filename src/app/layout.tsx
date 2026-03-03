import "./globals.css";
import "./responsive-core.css";
import "./print.css";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import SettingsApplier from '@/components/SettingsApplier';
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: "Stand Masr | ERP Dashboard",
  description: "Modern Metal Furniture Manufacturing ERP System",
};

import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E35E35',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Outfit:wght@300;400;500;700&family=Tajawal:wght@300;400;500;700&family=Almarai:wght@300;400;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SettingsApplier />
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </body>
    </html>
  );
}
