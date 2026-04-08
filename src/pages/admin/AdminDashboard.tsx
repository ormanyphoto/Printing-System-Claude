import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, DollarSign, Clock, Users } from "lucide-react";
import { formatILS } from "@/lib/pricing";

const AdminDashboard = () => {
  const { data: orderStats } = useQuery({
    queryKey: ["admin-dashboard-orders"],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_price_ils, status, customer_name, customer_email, created_at");
      if (!orders) return { total: 0, revenue: 0, pending: 0, recent: [] };
      const total = orders.length;
      const revenue = orders.reduce((sum, o) => sum + (o.total_price_ils ?? 0), 0);
      const pending = orders.filter((o) => o.status === "pending" || o.status === "draft").length;
      const recent = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      return { total, revenue, pending, recent };
    },
  });

  const { data: customerCount = 0 } = useQuery({
    queryKey: ["admin-dashboard-customers"],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("customers")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = orderStats ?? { total: 0, revenue: 0, pending: 0, recent: [] };

  const kpis = [
    { label: "Total Orders", value: stats.total.toLocaleString(), icon: Package, color: "text-blue-500" },
    { label: "Revenue (ILS)", value: formatILS(stats.revenue), icon: DollarSign, color: "text-emerald-500" },
    { label: "Pending Orders", value: stats.pending.toLocaleString(), icon: Clock, color: "text-amber-500" },
    { label: "Total Customers", value: customerCount.toLocaleString(), icon: Users, color: "text-violet-500" },
  ];

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "default" as const;
      case "pending":
      case "draft":
        return "secondary" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-body text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <h2 className="font-display text-lg text-foreground mb-4">Recent Orders</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Order ID</TableHead>
                <TableHead className="font-body">Customer</TableHead>
                <TableHead className="font-body">Email</TableHead>
                <TableHead className="font-body">Total</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground font-body py-8">
                    No orders yet
                  </TableCell>
                </TableRow>
              )}
              {stats.recent.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-body text-xs text-muted-foreground font-mono">
                    {o.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-body font-medium">{o.customer_name ?? "-"}</TableCell>
                  <TableCell className="font-body text-muted-foreground">{o.customer_email ?? "-"}</TableCell>
                  <TableCell className="font-body">{formatILS(o.total_price_ils ?? 0)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="font-body text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-lg text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/orders">
            <Button variant="outline" className="font-body gap-2">
              <Package className="h-4 w-4" /> Manage Orders
            </Button>
          </Link>
          <Link to="/admin/products">
            <Button variant="outline" className="font-body gap-2">
              <Package className="h-4 w-4" /> Manage Products
            </Button>
          </Link>
          <Link to="/admin/blog">
            <Button variant="outline" className="font-body gap-2">
              <DollarSign className="h-4 w-4" /> Blog Posts
            </Button>
          </Link>
          <Link to="/admin/pages">
            <Button variant="outline" className="font-body gap-2">
              <Clock className="h-4 w-4" /> Pages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
