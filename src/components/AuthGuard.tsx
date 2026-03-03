'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PATHS = ['/login'];

const ROLE_PERMISSIONS: Record<string, string[]> = {
    '/clients': ['ADMIN', 'ACCOUNTANT', 'SALES'],
    '/sales': ['ADMIN', 'ACCOUNTANT', 'SALES'],
    '/jobs': ['ADMIN', 'ACCOUNTANT', 'SALES'],
    '/paint': ['ADMIN', 'ACCOUNTANT'],
    '/inventory': ['ADMIN', 'INVENTORY', 'ACCOUNTANT'],
    '/purchases': ['ADMIN', 'INVENTORY', 'ACCOUNTANT'],
    '/products': ['ADMIN', 'INVENTORY', 'ACCOUNTANT', 'SALES'],
    '/treasury': ['ADMIN', 'ACCOUNTANT'],
    '/employees': ['ADMIN', 'ACCOUNTANT'],
    '/permissions': ['ADMIN'],
    '/database': ['ADMIN'],
    '/settings': ['ADMIN'],
    '/print-template': ['ADMIN'],
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // 1. Initial Sync/Check
        const loggedIn = localStorage.getItem('erp_logged_in');
        const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
        if (isPublic) return;

        if (loggedIn !== 'true') {
            router.replace('/login');
            return;
        }

        const checkPermissions = async () => {
            try {
                // Try getting from localStorage first for speed
                let permsRaw = localStorage.getItem('erp_role_permissions');
                let perms = permsRaw ? JSON.parse(permsRaw) : null;

                // Then fetch from API if not in localStorage or to sync
                if (!perms) {
                    const res = await fetch('/api/settings/permissions');
                    if (res.ok) {
                        perms = await res.json();
                        localStorage.setItem('erp_role_permissions', JSON.stringify(perms));
                    }
                }

                if (!perms) perms = ROLE_PERMISSIONS; // Final fallback

                const userRaw = localStorage.getItem('erp_user');
                const user = userRaw ? JSON.parse(userRaw) : { role: 'ADMIN' };
                const role = (user.role || 'ADMIN').toUpperCase();

                if (role === 'ADMIN') return; // Admin bypass

                // Find matching path requirement
                const requiredRolesKey = Object.keys(perms).find(p => pathname.startsWith(p));
                if (requiredRolesKey) {
                    const allowedRoles = perms[requiredRolesKey];
                    if (!allowedRoles.includes(role)) {
                        alert('⛔ عذراً، ليس لديك صلاحية الوصول لهذه الصفحة.');
                        router.replace('/');
                    }
                }
            } catch (e) {
                console.error('Permission check failed', e);
            }
        };

        checkPermissions();
    }, [pathname, router]);

    return <>{children}</>;
}
