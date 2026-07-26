import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const CategoriesPage = lazy(() => import('@/features/products/pages/CategoriesPage'));
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'));
const LocationsPage = lazy(() => import('@/features/locations/pages/LocationsPage'));
const PartnersPage = lazy(() => import('@/features/partners/pages/PartnersPage'));
const EmployeesPage = lazy(() => import('@/features/staff/pages/EmployeesPage'));
const TransactionsPage = lazy(() => import('@/features/transactions/pages/TransactionsPage'));
const TransactionDetailPage = lazy(() => import('@/features/transactions/pages/TransactionDetailPage'));
const TransfersPage = lazy(() => import('@/features/transfers/pages/TransfersPage'));
const StockCountsPage = lazy(() => import('@/features/stock-counts/pages/StockCountsPage'));
const StockPage = lazy(() => import('@/features/stock/pages/StockPage'));
const QuickReceivePage = lazy(() => import('@/features/quick-receive/pages/QuickReceivePage'));
const BatchesPage = lazy(() => import('@/features/batches/pages/BatchesPage'));
const AlertsPage = lazy(() => import('@/features/alerts/pages/AlertsPage'));
const WarehousesPage = lazy(() => import('@/features/warehouses/pages/WarehousesPage'));
const AuthorizationPage = lazy(() => import('@/features/authorization/pages/AuthorizationPage'));
const InventoryTransactionsPage = lazy(() => import('@/features/inventory-transactions/pages/InventoryTransactionsPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const AuditLogsPage = lazy(() => import('@/features/audit-logs/pages/AuditLogsPage'));
const AttachmentsPage = lazy(() => import('@/features/attachments/pages/AttachmentsPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm font-medium text-slate-500">
      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
      Đang tải màn hình...
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProductsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/:type/:id" element={<TransactionDetailPage />} />
        <Route path="/receipts/:id" element={<TransactionDetailPage />} />
        <Route path="/issues/:id" element={<TransactionDetailPage />} />
        <Route path="/adjustments/:id" element={<TransactionDetailPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/quick-receive" element={<QuickReceivePage />} />
        <Route path="/inventory-transactions" element={<InventoryTransactionsPage />} />
        <Route path="/batches" element={<BatchesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/stock-counts" element={<StockCountsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/authorization" element={<AuthorizationPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/attachments" element={<AttachmentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
