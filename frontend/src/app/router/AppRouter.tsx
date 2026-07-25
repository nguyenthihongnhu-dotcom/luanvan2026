import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import CategoriesPage from '@/features/products/pages/CategoriesPage';
import ProductsPage from '@/features/products/pages/ProductsPage';
import LocationsPage from '@/features/locations/pages/LocationsPage';
import PartnersPage from '@/features/partners/pages/PartnersPage';
import EmployeesPage from '@/features/staff/pages/EmployeesPage';
import TransactionsPage from '@/features/transactions/pages/TransactionsPage';
import TransactionDetailPage from '@/features/transactions/pages/TransactionDetailPage';
import TransfersPage from '@/features/transfers/pages/TransfersPage';
import StockCountsPage from '@/features/stock-counts/pages/StockCountsPage';
import StockPage from '@/features/stock/pages/StockPage';
import QuickReceivePage from '@/features/quick-receive/pages/QuickReceivePage';
import BatchesPage from '@/features/batches/pages/BatchesPage';
import AlertsPage from '@/features/alerts/pages/AlertsPage';
import WarehousesPage from '@/features/warehouses/pages/WarehousesPage';
import AuthorizationPage from '@/features/authorization/pages/AuthorizationPage';
import InventoryTransactionsPage from '@/features/inventory-transactions/pages/InventoryTransactionsPage';
import ReportsPage from '@/features/reports/pages/ReportsPage';
import AuditLogsPage from '@/features/audit-logs/pages/AuditLogsPage';
import AttachmentsPage from '@/features/attachments/pages/AttachmentsPage';
import NotificationsPage from '@/features/notifications/pages/NotificationsPage';
import SettingsPage from '@/features/settings/pages/SettingsPage';

export default function AppRouter() {
  return (
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
  );
}

