import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  extraContent: ReactNode | null;
  setExtraContent: (content: ReactNode | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [extraContent, setExtraContent] = useState<ReactNode | null>(null);

  return (
    <SidebarContext.Provider value={{ extraContent, setExtraContent }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}