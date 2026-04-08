import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import Order from "./pages/Order";
import Login from "./pages/Login";
import OrderHistory from "./pages/OrderHistory";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductDetail from "./pages/admin/AdminProductDetail";
import AdminSizes from "./pages/admin/AdminSizes";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminFrameStyles from "./pages/admin/AdminFrameStyles";
import AdminFrameColors from "./pages/admin/AdminFrameColors";
import AdminFrameWidths from "./pages/admin/AdminFrameWidths";
import AdminGlazing from "./pages/admin/AdminGlazing";
import AdminSubframes from "./pages/admin/AdminSubframes";
import AdminFinishes from "./pages/admin/AdminFinishes";
import AdminSubtypes from "./pages/admin/AdminSubtypes";
import AdminPriceTiers from "./pages/admin/AdminPriceTiers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminTooltips from "./pages/admin/AdminTooltips";

import "./i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/order" element={<Order />} />
          <Route path="/login" element={<Login />} />
          <Route path="/order-history" element={<OrderHistory />} />

          {/* Admin routes */}
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

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
