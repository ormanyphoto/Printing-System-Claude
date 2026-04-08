import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// Pages
import Index from './pages/Index';
import Order from './pages/Order';
import Login from './pages/Login';
import OrderHistory from './pages/OrderHistory';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductDetail from './pages/admin/AdminProductDetail';
import AdminSizes from './pages/admin/AdminSizes';
import AdminShipping from './pages/admin/AdminShipping';
import AdminFrameStyles from './pages/admin/AdminFrameStyles';
import AdminFrameColors from './pages/admin/AdminFrameColors';
import AdminFrameWidths from './pages/admin/AdminFrameWidths';
import AdminGlazing from './pages/admin/AdminGlazing';
import AdminSubframes from './pages/admin/AdminSubframes';
import AdminFinishes from './pages/admin/AdminFinishes';
import AdminSubtypes from './pages/admin/AdminSubtypes';
import AdminPriceTiers from './pages/admin/AdminPriceTiers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminIntegrations from './pages/admin/AdminIntegrations';
import AdminTooltips from './pages/admin/AdminTooltips';

// Layout
import AdminLayout from './components/admin/AdminLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/order" element={<Order />} />
          <Route path="/login" element={<Login />} />
          <Route path="/order-history" element={<OrderHistory />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="product/:slug" element={<AdminProductDetail />} />
            <Route path="sizes" element={<AdminSizes />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="frame-styles" element={<AdminFrameStyles />} />
            <Route path="frame-colors" element={<AdminFrameColors />} />
            <Route path="frame-widths" element={<AdminFrameWidths />} />
            <Route path="glazing" element={<AdminGlazing />} />
            <Route path="subframes" element={<AdminSubframes />} />
            <Route path="finishes" element={<AdminFinishes />} />
            <Route path="subtypes" element={<AdminSubtypes />} />
            <Route path="price-tiers" element={<AdminPriceTiers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="integrations" element={<AdminIntegrations />} />
            <Route path="tooltips" element={<AdminTooltips />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
