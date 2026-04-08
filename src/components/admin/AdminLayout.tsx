import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { X } from "lucide-react";
import { useEmbed } from "@/hooks/useEmbed";

const NAV_ITEMS = [
  { label: "Products & Pricing", path: "/admin/products" },
  { label: "Sizes", path: "/admin/sizes" },
  { label: "Shipping Data", path: "/admin/shipping" },
  { label: "Frame Styles", path: "/admin/frame-styles" },
  { label: "Frame Colors", path: "/admin/frame-colors" },
  { label: "Glazing", path: "/admin/glazing" },
  { label: "Subframes", path: "/admin/subframes" },
  { label: "Frame Widths", path: "/admin/frame-widths" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Integrations", path: "/admin/integrations" },
  { label: "Tooltips", path: "/admin/tooltips" },
];

const AdminLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isEmbed = useEmbed();

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data ?? [];
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    const checkAccess = async (userId: string) => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!data) {
        navigate("/");
        return;
      }
      setIsAdmin(true);
    };

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (!sessionUser) {
        setLoading(false);
        navigate("/login");
        return;
      }
      checkAccess(sessionUser.id).finally(() => setLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setIsAdmin(false);
        navigate("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">Loading...</div>;
  if (!user || !isAdmin) return null;

  const isActive = (path: string) => location.pathname === path;
  const isProductActive = (slug: string) => location.pathname === `/admin/product/${slug}`;

  return (
    <div className="min-h-screen bg-[hsl(40,20%,97%)] flex flex-col">
      {/* Top header bar — hidden in embed mode */}
      {!isEmbed && (
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-gold">Print Studio — Back Office</h1>
            <p className="font-body text-sm text-muted-foreground mt-0.5">Manage products, pricing, sizes, and integrations</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-body"
            onClick={() => navigate("/")}
          >
            <X className="h-3.5 w-3.5" /> Close
          </Button>
        </header>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 border-r border-border bg-card flex flex-col shrink-0">
          <nav className="flex-1 overflow-y-auto py-4">
            {/* NAVIGATION group */}
            <p className="px-4 pb-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Navigation</p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-1.5 font-body text-sm transition-colors ${
                  isActive(item.path)
                    ? "text-foreground font-semibold bg-secondary/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* PRODUCT group */}
            <p className="px-4 pt-5 pb-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Product</p>
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/admin/product/${p.slug}`}
                className={`block px-4 py-1.5 font-body text-sm transition-colors ${
                  isProductActive(p.slug)
                    ? "text-foreground font-semibold bg-secondary/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {p.name_en}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <p className="font-body text-xs text-muted-foreground truncate mb-2">{user.email}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full font-body"
              onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}
            >
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
