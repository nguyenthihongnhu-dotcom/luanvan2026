import { useMemo } from 'react';
import { useAuth } from '@/features/auth/context/useAuth';

export function usePermissions() {
    const { user } = useAuth();
    const permissions = user?.permissions ?? [];

    return useMemo(() => ({
        permissions,
        hasPermission: (permission: string) => permissions.includes(permission),
        hasAnyPermission: (items: string[]) => items.some((permission) => permissions.includes(permission)),
    }), [permissions]);
}
