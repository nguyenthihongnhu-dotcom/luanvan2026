import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navbarItems = [
    { label: 'Sơ đồ kho', path: '/locations' },
    { label: 'Kho master', path: '/warehouses' },
    { label: 'Tồn kho', path: '/stock' },
    { label: 'Log tồn', path: '/inventory-transactions' },
    { label: 'Lô hàng', path: '/batches' },
    { label: 'Cảnh báo', path: '/alerts' },
    { label: 'Thông báo', path: '/notifications' },
    { label: 'Hàng hoá', path: '/products' },

    { label: 'Giao dịch', path: '/transactions' },
    { label: 'Chuyển kho', path: '/transfers' },
    { label: 'Kiểm kê', path: '/stock-counts' },
    { label: 'Đối tác', path: '/partners' },
    { label: 'Nhân viên', path: '/employees' },
    { label: 'Danh mục', path: '/categories' },
    { label: 'Báo cáo', path: '/reports' },
    { label: 'Phân quyền', path: '/authorization' },
    { label: 'Audit', path: '/audit-logs' },
    { label: 'File', path: '/attachments' },
    { label: 'Cấu hình', path: '/settings' },
];

export default function Navbar(): ReactNode {
    const location = useLocation();

    return (
        <nav className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center">
                <div className="ml-10 flex items-center space-x-1 overflow-x-auto">
                    {navbarItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-pink-50 text-pink-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
