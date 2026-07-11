import { ReactNode } from "react";
import { useSidebar } from "../context/Sidebarcontext"; // Import hook vừa tạo

export default function Sidebar(): ReactNode {
    const userRole = localStorage.getItem("role") || "STAFF";
    const { extraContent } = useSidebar(); // Lấy nội dung động từ các trang gửi lên

    return (
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex-1 flex flex-col min-h-0"> {/*kiểm soát cuộn */}
                {/* Phần Logo Tiêu Đề */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
                    <span className="text-xl font-bold text-pink-600 tracking-wider">Bambi WMS</span>
                </div>

                {/* Vùng cuộn menu và bộ lọc */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    {/* HIỂN THỊ NỘI DUNG ĐỘNG (BỘ LỌC TỪNG TRANG) */}
                    {extraContent && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Bộ lọc dữ liệu</h2>
                            {extraContent}
                        </div>
                    )}
                </div>
            </div>

            {/* Phần thông tin user dưới đáy Sidebar */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">U</div>
                    <div>
                        <p className="text-xs font-semibold text-gray-700 truncate w-32">Nhân viên PHS</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{userRole}</p>
                    </div>
                </div>
                <button
                    onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                    title="Đăng xuất"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}