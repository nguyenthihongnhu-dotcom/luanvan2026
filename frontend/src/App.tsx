import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SidebarProvider } from './context/Sidebarcontext'; // Thêm dòng này
import Login from './pages/common/Login';
import ProductsPage from './pages/shared/Products/Products';
import Transactions from './pages/shared/Transactions/index';
import Partners from './pages/shared/Partners/index';
import { Employees } from './pages/admin/StaffManagement/Employees';
import Categories from './pages/shared/Products/Categories';
import Locations from './pages/shared/Locations/Locations';

const App: React.FC = () => {
  return (
    <SidebarProvider> {/* Bọc toàn bộ ở đây */}
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProductsPage />} /> {/* Placeholder cho Dashboard */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/locations" element={<Locations />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}

export default App;