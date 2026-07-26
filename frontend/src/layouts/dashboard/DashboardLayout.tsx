import type { ReactNode } from "react";
import { useSidebar } from "@/app/providers/useSidebar";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { extraContent, isSidebarCollapsed } = useSidebar();
    const isSidebarCompact = isSidebarCollapsed || !extraContent;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200 pl-0 ${isSidebarCompact ? "md:pl-20" : "md:pl-64"}`}>
                <div className="sticky top-0 z-30">
                    <Navbar />
                </div>

                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}