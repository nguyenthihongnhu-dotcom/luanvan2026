import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import type { AuthUser } from '@/features/auth/types';
import { setAccessToken } from '@/shared/services/httpClient';
import { disconnectNotificationSocket } from '@/shared/services/socketClient';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: user !== null,
        login: setUser,
        logout: () => {
            disconnectNotificationSocket();
            setAccessToken(null);
            setUser(null);
        },
    }), [user]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

