import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import NavLink from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Package, Ruler, Truck, Frame, Palette, Maximize,
  Layers, Square, Paintbrush, Tag, DollarSign, ShoppingCart, Plug, Info, LogOut, Menu, X,
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/admin/products', icon: Package, label: 'products' },
  { to: '/admin/sizes', icon: Ruler, label: 'sizes' },
  { to: '/admin/shipping', icon: Truck, label: 'shipping' },
  { to: '/admin/frame-styles', icon: Frame, label: 'frameStyles' },
  { to: '/admin/frame-colors', icon: Palette, label: 'frameColors' },
  { to: '/admin/frame-widths', icon: Maximize, label: 'frameWidths' },
  { to: '/admin/glazing', icon: Layers, label: 'glazing' },
  { to: '/admin/subframes', icon: Square, label: 'subframes' },
  { to: '/admin/finishes', icon: Paintbrush, label: 'finishes' },
  { to: '/admin/subtypes', icon: Tag, label: 'subtypes' },
  { to: '/admin/price-tiers', icon: DollarSign, label: 'priceTiers' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'orders' },
  { to: '/admin/integrations', icon: Plug, label: 'integrations' },
  { to: '/admin/tooltips', icon: Info, label: 'tooltips' },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    const { data } = await (supabase as any).rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!data) {
      navigate('/login');
      return;
    }
    setIsAdmin(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/admin" className="text-lg font-bold">Admin Panel</Link>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1 p-3">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to}>
                <item.icon className="h-4 w-4" />
                {t(`admin.${item.label}`)}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
