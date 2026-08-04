import { useMemo } from 'react';
import { useAuth } from '@/features/auth/context/useAuth';

export function usePermissions() {
    const { user } = useAuth();
    const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);

    const isAdmin = user?.role === 'ADMIN' || permissions.includes('*');

    return useMemo(() => ({
        permissions,
        hasPermission: (permission: string) => isAdmin || permissions.includes(permission),
        hasAnyPermission: (items: string[]) => isAdmin || items.some((permission) => permissions.includes(permission)),
    }), [permissions, isAdmin]);
}
