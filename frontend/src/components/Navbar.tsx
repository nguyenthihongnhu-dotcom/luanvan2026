import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar(): ReactNode {
    const location = useLocation();

    const navbarItems = [
        // { label: "Tổng quan", path: "/dashboard" },
        { label: "Kho", path: "/locations" },
        { label: "Hàng hoá", path: "/products" },
        { label: "Giao dịch", path: "/transactions" },
        { label: "Đối tác", path: "/partners" },
        { label: "Nhân viên", path: "/employees" },
        { label: "Danh mục", path: "/categories" }
    ];

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center max-w-7xl mx-auto">
                <div className="flex items-center space-x-1 ml-10">
                    {navbarItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? "bg-pink-50 text-pink-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}