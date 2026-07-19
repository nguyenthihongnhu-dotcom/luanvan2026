import { createContext } from 'react';
import type { AuthUser } from '@/features/auth/types';

export interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (user: AuthUser) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
