import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { SidebarContext } from "./SidebarContext";

interface SidebarProviderProps {
  children: ReactNode;
}

const sidebarStorageKey = "bambi-wms-sidebar-collapsed";

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [extraContent, setExtraContent] = useState<ReactNode | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(sidebarStorageKey) !== "false";
  });

  useEffect(() => {
    window.localStorage.setItem(sidebarStorageKey, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ extraContent, setExtraContent, isSidebarCollapsed, setSidebarCollapsed, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}