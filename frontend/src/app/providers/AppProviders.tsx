import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { SidebarProvider } from './SidebarProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}
