import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import CategoriesPage from '@/features/products/pages/CategoriesPage';
import ProductsPage from '@/features/products/pages/ProductsPage';
import LocationsPage from '@/features/locations/pages/LocationsPage';
import PartnersPage from '@/features/partners/pages/PartnersPage';
import EmployeesPage from '@/features/staff/pages/EmployeesPage';
import TransactionsPage from '@/features/transactions/pages/TransactionsPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProductsPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/partners" element={<PartnersPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/locations" element={<LocationsPage />} />
    </Routes>
  );
}
