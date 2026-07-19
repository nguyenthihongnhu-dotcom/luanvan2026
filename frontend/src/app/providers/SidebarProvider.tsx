import { useState } from "react";
import type { ReactNode } from "react";
import { SidebarContext } from "./SidebarContext";

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [extraContent, setExtraContent] = useState<ReactNode | null>(null);

  return (
    <SidebarContext.Provider value={{ extraContent, setExtraContent }}>
      {children}
    </SidebarContext.Provider>
  );
}

