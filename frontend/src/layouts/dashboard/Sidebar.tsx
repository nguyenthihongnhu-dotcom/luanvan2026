import type { ReactNode } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/useAuth";
import { useSidebar } from "@/app/providers/useSidebar";

const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    WAREHOUSE_MANAGER: "Quản lý kho",
    STAFF: "Nhân viên",
    AUDITOR: "Kiểm kê",
    KHACHHANG: "Khách hàng",
};

export default function Sidebar(): ReactNode {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { extraContent, isSidebarCollapsed, toggleSidebar } = useSidebar();
    const userRole = roleLabels[user?.role ?? "STAFF"] ?? "Nhân viên";
    const displayName = user?.ten ?? "Nhân viên PHS";
    const isSidebarCompact = isSidebarCollapsed || !extraContent;
    const ToggleIcon = isSidebarCompact ? MenuUnfoldOutlined : MenuFoldOutlined;

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <aside className={`fixed left-0 top-0 z-40 hidden h-screen flex-col justify-between border-r border-gray-200 bg-white shadow-sm transition-[width] duration-200 md:flex ${isSidebarCompact ? "w-20" : "w-64"}`}>
            <div className="flex min-h-0 flex-1 flex-col">
                <div className={`flex h-16 flex-shrink-0 items-center border-b border-gray-200 ${isSidebarCompact ? "justify-center px-2" : "justify-between px-5"}`}>
                    {!isSidebarCompact && (
                        <span className="truncate text-xl font-bold tracking-wider text-pink-600">Bambi WMS</span>
                    )}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                        title={isSidebarCompact ? "Mở sidebar" : "Thu gọn sidebar"}
                        aria-label={isSidebarCompact ? "Mở sidebar" : "Thu gọn sidebar"}
                        aria-pressed={isSidebarCompact}
                    >
                        <ToggleIcon />
                    </button>
                </div>

                <div className={`flex-1 overflow-y-auto py-6 ${isSidebarCompact ? "px-2" : "px-4"}`}>
                    {!isSidebarCompact && extraContent && (
                        <div className="space-y-4">
                            <h2 className="mb-4 border-b border-gray-100 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Bộ lọc dữ liệu</h2>
                            {extraContent}
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex flex-shrink-0 border-t border-gray-100 bg-white p-4 ${isSidebarCompact ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
                <div className={`flex items-center ${isSidebarCompact ? "justify-center" : "space-x-3"}`}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">U</div>
                    {!isSidebarCompact && (
                        <div>
                            <p className="w-32 truncate text-xs font-semibold text-gray-700">{displayName}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{userRole}</p>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Đăng xuất"
                    aria-label="Đăng xuất"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}