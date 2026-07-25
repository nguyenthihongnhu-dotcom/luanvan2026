import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* 1. SIDEBAR CỐ ĐỊNH BÊN TRÁI */}
            {/* Do Sidebar của bạn dùng class fixed w-64, nó sẽ chiếm trọn lề trái */}
            <Sidebar />

            {/* 2. KHỐI CHỨA NỘI DUNG CHÍNH (Gồm Navbar trên cùng và Main Content dưới) */}
            {/* Sử dụng pl-64 để đẩy toàn bộ khối này sang phải, không bị Sidebar đè lên */}
            <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-0 md:pl-64">

                {/* NAVBAR PHÍA TRÊN */}
                {/* Nên thêm class sticky top-0 z-30 để thanh cuộn dọc không làm trôi mất Navbar */}
                <div className="sticky top-0 z-30">
                    <Navbar />
                </div>

                {/* NỘI DUNG CHÍNH CỦA TỪNG TRANG */}
                {/* p-6 hoặc p-8 để tạo khoảng cách đệm cho đẹp mắt */}
                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}

