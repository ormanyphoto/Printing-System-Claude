import { lazy, Suspense } from "react";
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

// Public content pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const CmsPage = lazy(() => import("./pages/CmsPage"));

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

// New back office pages
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminTranslations = lazy(() => import("./pages/admin/AdminTranslations"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminPageEdit = lazy(() => import("./pages/admin/AdminPageEdit"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminBlogEdit = lazy(() => import("./pages/admin/AdminBlogEdit"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerDetail = lazy(() => import("./pages/admin/AdminCustomerDetail"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminCheckout = lazy(() => import("./pages/admin/AdminCheckout"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminShippingZones = lazy(() => import("./pages/admin/AdminShippingZones"));
const AdminShippingRates = lazy(() => import("./pages/admin/AdminShippingRates"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const AdminTaxRates = lazy(() => import("./pages/admin/AdminTaxRates"));
const AdminHSCodes = lazy(() => import("./pages/admin/AdminHSCodes"));

import "./i18n";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex items-center justify-center min-h-[200px] text-muted-foreground font-body text-sm">
    Loading...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/order" element={<Order />} />
            <Route path="/login" element={<Login />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/page/:slug" element={<CmsPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />

              {/* Catalog */}
              <Route path="products" element={<AdminProducts />} />
              <Route path="product/:slug" element={<AdminProductDetail />} />
              <Route path="sizes" element={<AdminSizes />} />
              <Route path="frame-styles" element={<AdminFrameStyles />} />
              <Route path="frame-colors" element={<AdminFrameColors />} />
              <Route path="frame-widths" element={<AdminFrameWidths />} />
              <Route path="glazing" element={<AdminGlazing />} />
              <Route path="subframes" element={<AdminSubframes />} />
              <Route path="finishes" element={<AdminFinishes />} />
              <Route path="subtypes" element={<AdminSubtypes />} />
              <Route path="price-tiers" element={<AdminPriceTiers />} />
              <Route path="tooltips" element={<AdminTooltips />} />

              {/* Content */}
              <Route path="pages" element={<AdminPages />} />
              <Route path="pages/:slug" element={<AdminPageEdit />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="blog/new" element={<AdminBlogEdit />} />
              <Route path="blog/:slug" element={<AdminBlogEdit />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="translations" element={<AdminTranslations />} />

              {/* Orders & Customers */}
              <Route path="orders" element={<AdminOrders />} />
              <Route path="order/:id" element={<AdminOrderDetail />} />
              <Route path="checkout" element={<AdminCheckout />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customer/:id" element={<AdminCustomerDetail />} />
              <Route path="subscribers" element={<AdminSubscribers />} />

              {/* Shipping & Tax */}
              <Route path="shipping-zones" element={<AdminShippingZones />} />
              <Route path="shipping-rates" element={<AdminShippingRates />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="tax-rates" element={<AdminTaxRates />} />
              <Route path="hs-codes" element={<AdminHSCodes />} />

              {/* SEO & System */}
              <Route path="seo" element={<AdminSEO />} />
              <Route path="integrations" element={<AdminIntegrations />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
