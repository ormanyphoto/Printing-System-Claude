import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { formatILS } from "@/lib/pricing";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country_code: string;
  tags: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  country_code: "",
  tags: "",
  notes: "",
};

const AdminCustomers = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>({ ...emptyForm });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers", search],
    queryFn: async () => {
      let query = (supabase as any).from("customers").select("*").order("created_at", { ascending: false });
      if (search.trim()) {
        const s = search.trim();
        query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
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
        notes: form.notes || null,
      };
      if (editId) {
        const { error } = await (supabase as any).from("customers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      setOpen(false);
      toast({ title: editId ? "Customer updated" : "Customer added" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      toast({ title: "Customer deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const exportCSV = () => {
    if (!customers.length) return;
    const headers = ["Name", "Email", "Phone", "Company", "City", "Country", "Total Orders", "Total Spent (ILS)", "Tags", "Created"];
    const rows = customers.map((c: any) => [
      c.name ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.company ?? "",
      c.city ?? "",
      c.country_code ?? "",
      c.total_orders?.toString() ?? "0",
      c.total_spent?.toString() ?? "0",
      Array.isArray(c.tags) ? c.tags.join("; ") : "",
      c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      company: c.company ?? "",
      address: c.address ?? "",
      city: c.city ?? "",
      country_code: c.country_code ?? "",
      tags: Array.isArray(c.tags) ? c.tags.join(", ") : "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="font-body text-sm" onClick={exportCSV}>Export CSV</Button>
          <Button variant="outline" className="font-body text-sm" onClick={openAdd}>+ Add Customer</Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by name, email, or phone..."
          className="h-9 text-sm max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Name</TableHead>
              <TableHead className="font-body">Email</TableHead>
              <TableHead className="font-body">Phone</TableHead>
              <TableHead className="font-body">City</TableHead>
              <TableHead className="font-body">Country</TableHead>
              <TableHead className="font-body">Orders</TableHead>
              <TableHead className="font-body">Total Spent</TableHead>
              <TableHead className="font-body">Tags</TableHead>
              <TableHead className="font-body">Created</TableHead>
              <TableHead className="font-body">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground font-body py-8">Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground font-body py-8">No customers found</TableCell>
              </TableRow>
            )}
            {customers.map((c: any) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/customer/${c.id}`)}
              >
                <TableCell className="font-body text-sm font-medium">{c.name ?? "-"}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{c.email ?? "-"}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{c.phone ?? "-"}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{c.city ?? "-"}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{c.country_code ?? "-"}</TableCell>
                <TableCell className="font-body text-sm">{c.total_orders ?? 0}</TableCell>
                <TableCell className="font-body text-sm">{formatILS(c.total_spent ?? 0)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {Array.isArray(c.tags) && c.tags.map((t: string) => (
                      <Badge key={t} variant="secondary" className="font-body text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-body text-xs text-muted-foreground">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(c)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-body text-xs text-destructive"
                      onClick={() => {
                        if (confirm("Delete this customer?")) deleteCustomer.mutate(c.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
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
            {editId && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
            )}
            <Button type="submit" className="w-full font-body" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
