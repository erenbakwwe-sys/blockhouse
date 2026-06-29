/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StoreProvider } from './store/StoreContext';
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminTables from './pages/AdminTables';
import AdminMenu from './pages/AdminMenu';
import AdminCalls from './pages/AdminCalls';
import AdminHistory from './pages/AdminHistory';
import AdminFinance from './pages/AdminFinance';
import AdminPOS from './pages/AdminPOS';
import AdminStock from './pages/AdminStock';
import AdminStaff from './pages/AdminStaff';
import AdminCoupons from './pages/AdminCoupons';
import AdminAITheme from './pages/AdminAITheme';
import AdminCampaigns from './pages/AdminCampaigns';
import AdminLayout from './components/AdminLayout';
import CustomerLayout from './components/CustomerLayout';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Toaster 
          position="top-center" 
          toastOptions={{ 
            style: { background: '#222', color: '#fff', border: '1px solid #333' } 
          }} 
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Customer Routes */}
          <Route element={<CustomerLayout />}>
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-status" element={<OrderStatusPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pos" element={<AdminPOS />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="ai-theme" element={<AdminAITheme />} />
            <Route path="calls" element={<AdminCalls />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="finance" element={<AdminFinance />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
