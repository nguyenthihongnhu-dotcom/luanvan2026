import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import type { AuthUser } from '@/features/auth/types';
import { getAccessToken, setAccessToken } from '@/shared/services/httpClient';
import { disconnectNotificationSocket } from '@/shared/services/socketClient';

interface AuthProviderProps {
    children: ReactNode;
}

const authUserKey = 'bambi_wms_user';

/**
 * Khôi phục user đã đăng nhập sau khi refresh trang. Access token nằm ở
 * sessionStorage nên chỉ giữ state React sẽ mất role + permissions khi F5,
 * khiến tài khoản admin bị tụt về fallback "Nhân viên" và mất hết nút thao tác.
 * Chỉ khôi phục khi token còn — không có token thì coi như đã đăng xuất.
 */
function readStoredUser(): AuthUser | null {
    if (!getAccessToken()) {
        return null;
    }

    const raw = window.sessionStorage.getItem(authUserKey);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        window.sessionStorage.removeItem(authUserKey);
        return null;
    }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(readStoredUser);

    const login = useCallback((nextUser: AuthUser) => {
        window.sessionStorage.setItem(authUserKey, JSON.stringify(nextUser));
        setUser(nextUser);
    }, []);

    const logout = useCallback(() => {
        disconnectNotificationSocket();
        setAccessToken(null);
        window.sessionStorage.removeItem(authUserKey);
        setUser(null);
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: user !== null,
        login,
        logout,
    }), [user, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
