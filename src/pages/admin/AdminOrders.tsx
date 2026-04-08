import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatILS } from "@/lib/pricing";

const AdminOrders = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-6">Orders</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No orders yet</TableCell>
            </TableRow>
          )}
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium">{o.customer_name ?? "-"}</TableCell>
              <TableCell className="text-muted-foreground">{o.customer_email ?? "-"}</TableCell>
              <TableCell>{formatILS(o.total_price_ils)}</TableCell>
              <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminOrders;
