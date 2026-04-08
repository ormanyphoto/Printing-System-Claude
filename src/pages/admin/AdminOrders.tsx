import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { formatILS } from "@/lib/pricing";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type ProductionStatus = "pending" | "confirmed" | "in_production" | "shipped" | "delivered" | "completed";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_production", label: "In Production" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  in_production: "bg-orange-100 text-orange-800 border-orange-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const PAGE_SIZE = 20;

const AdminOrders = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, search, dateFrom, dateTo, page],
    queryFn: async () => {
      let query = (supabase as any)
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "all") {
        query = query.eq("production_status", statusFilter);
      }
      if (search.trim()) {
        const s = search.trim();
        query = query.or(`customer_name.ilike.%${s}%,customer_email.ilike.%${s}%,id.ilike.%${s}%`);
      }
      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo + "T23:59:59");
      }

      const { data: rows, count, error } = await query;
      if (error) throw error;
      return { rows: (rows ?? []) as any[], total: count ?? 0 };
    },
  });

  const orders = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("orders").update({ production_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await (supabase as any).from("orders").update({ production_status: status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelected(new Set());
      setBulkStatus("");
      toast({ title: "Bulk status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  };

  const exportCSV = () => {
    if (!orders.length) return;
    const headers = ["ID", "Date", "Customer", "Email", "Total (ILS)", "Production Status", "Tracking #"];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.created_at).toLocaleDateString(),
      o.customer_name ?? "",
      o.customer_email ?? "",
      o.total_price_ils?.toString() ?? "0",
      o.production_status ?? o.status ?? "",
      o.tracking_number ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Orders</h1>
        <Button variant="outline" className="font-body text-sm" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="w-44">
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Status</label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Search</label>
          <Input
            placeholder="Customer name, email, or order ID..."
            className="h-9 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">From</label>
          <Input type="date" className="h-9 text-sm w-36" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">To</label>
          <Input type="date" className="h-9 text-sm w-36" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} />
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-md">
          <span className="font-body text-sm text-muted-foreground">{selected.size} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="h-8 w-44 text-sm"><SelectValue placeholder="Change status..." /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.filter((s) => s.value !== "all").map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="font-body text-xs"
            disabled={!bulkStatus || bulkUpdateStatus.isPending}
            onClick={() => bulkUpdateStatus.mutate({ ids: Array.from(selected), status: bulkStatus })}
          >
            Apply
          </Button>
        </div>
      )}

      {/* Orders table */}
      <div className="border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={orders.length > 0 && selected.size === orders.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="font-body">#</TableHead>
              <TableHead className="font-body">Date</TableHead>
              <TableHead className="font-body">Customer</TableHead>
              <TableHead className="font-body">Email</TableHead>
              <TableHead className="font-body">Total</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body">Tracking #</TableHead>
              <TableHead className="font-body">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground font-body py-8">Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground font-body py-8">No orders found</TableCell>
              </TableRow>
            )}
            {orders.map((o) => {
              const status = (o.production_status ?? o.status ?? "pending") as string;
              return (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/order/${o.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} />
                  </TableCell>
                  <TableCell className="font-body text-sm font-mono">{o.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{o.customer_name ?? "-"}</TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{o.customer_email ?? "-"}</TableCell>
                  <TableCell className="font-body text-sm">{formatILS(o.total_price_ils ?? 0)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={status}
                      onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs border-0 p-0">
                        <Badge className={`${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800"} font-body text-xs`}>
                          {status.replace(/_/g, " ")}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((s) => s.value !== "all").map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{o.tracking_number ?? "-"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => navigate(`/admin/order/${o.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="font-body text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} ({total} orders)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-body" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" className="font-body" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
