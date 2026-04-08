import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { formatILS } from "@/lib/pricing";
import { useState, useEffect } from "react";

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country_code: string;
  tags: string;
}

const AdminCustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [notes, setNotes] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CustomerForm>({
    name: "", email: "", phone: "", company: "", address: "", city: "", country_code: "", tags: "",
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("customers").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-customer-orders", customer?.email],
    queryFn: async () => {
      if (!customer?.email) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", customer.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customer?.email,
  });

  useEffect(() => {
    if (customer) {
      setNotes(customer.notes ?? "");
    }
  }, [customer]);

  const updateCustomer = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await (supabase as any).from("customers").update(updates).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customer", id] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      toast({ title: "Customer updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        company: form.company || null,
        address: form.address || null,
        city: form.city || null,
        country_code: form.country_code || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      const { error } = await (supabase as any).from("customers").update(payload).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customer", id] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      setEditOpen(false);
      toast({ title: "Customer updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="font-body text-muted-foreground py-8">Loading customer...</div>;
  }

  if (!customer) {
    return <div className="font-body text-muted-foreground py-8">Customer not found.</div>;
  }

  const tags: string[] = Array.isArray(customer.tags) ? customer.tags : [];
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total_price_ils ?? 0), 0);
  const firstOrder = orders.length > 0 ? orders[orders.length - 1] : null;
  const lastOrder = orders.length > 0 ? orders[0] : null;

  const openEditDialog = () => {
    setForm({
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      company: customer.company ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      country_code: customer.country_code ?? "",
      tags: tags.join(", "),
    });
    setEditOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" className="font-body text-sm" onClick={() => navigate("/admin/customers")}>
          &larr; Back
        </Button>
        <h1 className="font-display text-2xl text-gold">{customer.name ?? "Unnamed Customer"}</h1>
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="font-body text-xs">{t}</Badge>
        ))}
      </div>
      <p className="font-body text-sm text-muted-foreground mb-6">{customer.email}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Customer Info</CardTitle>
            <Button variant="ghost" size="sm" className="font-body text-xs" onClick={openEditDialog}>Edit</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Name" value={customer.name} />
            <Row label="Email" value={customer.email} />
            <Row label="Phone" value={customer.phone} />
            <Row label="Company" value={customer.company} />
            <Row label="Address" value={customer.address} />
            <Row label="City" value={customer.city} />
            <Row label="Country" value={customer.country_code} />
            <Row label="Created" value={customer.created_at ? new Date(customer.created_at).toLocaleDateString() : null} />
          </CardContent>
        </Card>

        {/* Stats card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Total Orders" value={totalOrders.toString()} />
            <Row label="Total Spent" value={formatILS(totalSpent)} />
            <Row label="First Order" value={firstOrder ? new Date(firstOrder.created_at).toLocaleDateString() : "-"} />
            <Row label="Last Order" value={lastOrder ? new Date(lastOrder.created_at).toLocaleDateString() : "-"} />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="text-sm font-body"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this customer..."
            />
            <Button
              size="sm"
              className="font-body text-sm w-full"
              disabled={updateCustomer.isPending}
              onClick={() => updateCustomer.mutate({ notes: notes || null })}
            >
              Save Notes
            </Button>
          </CardContent>
        </Card>

        {/* Newsletter toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Newsletter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm">Subscribed to newsletter</span>
              <Switch
                checked={!!customer.subscribed_newsletter}
                onCheckedChange={(v) => updateCustomer.mutate({ subscribed_newsletter: v })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order history */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">#</TableHead>
                <TableHead className="font-body">Date</TableHead>
                <TableHead className="font-body">Total</TableHead>
                <TableHead className="font-body">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground font-body py-6">No orders found</TableCell>
                </TableRow>
              )}
              {orders.map((o: any) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/order/${o.id}`)}
                >
                  <TableCell className="font-body text-sm font-mono">{o.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-body text-sm">{formatILS(o.total_price_ils ?? 0)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-body text-xs">
                      {(o.production_status ?? o.status ?? "pending").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveEdit.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Country Code</Label>
                <Input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} placeholder="IL" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vip, wholesale" />
            </div>
            <Button type="submit" className="w-full font-body" disabled={saveEdit.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="font-body text-sm text-muted-foreground">{label}</span>
      <span className="font-body text-sm">{value ?? "-"}</span>
    </div>
  );
}

export default AdminCustomerDetail;
