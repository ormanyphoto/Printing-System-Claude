import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, Frame, Ruler } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, frameStyles: 0, sizes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [products, orders, frames, sizes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('frame_styles').select('id', { count: 'exact', head: true }),
        supabase.from('size_presets').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        frameStyles: frames.count || 0,
        sizes: sizes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Products', value: stats.products, icon: Package, color: 'text-blue-600' },
    { title: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'text-green-600' },
    { title: 'Frame Styles', value: stats.frameStyles, icon: Frame, color: 'text-purple-600' },
    { title: 'Size Presets', value: stats.sizes, icon: Ruler, color: 'text-orange-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
