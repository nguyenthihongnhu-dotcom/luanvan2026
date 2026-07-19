import { createContext } from "react";
import type { ReactNode } from "react";

export interface SidebarContextType {
  extraContent: ReactNode | null;
  setExtraContent: (content: ReactNode | null) => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
