import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";

const AdminPriceTiers = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ product_id: "", subtype_id: "", tier1_price_sqm: 0, tier2_price_sqm: 0, tier_threshold_sqm: 0.25 });
  const [filterProduct, setFilterProduct] = useState<string>("all");

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: subtypes = [] } = useQuery({
    queryKey: ["admin-subtypes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("product_subtypes").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["admin-price-tiers"],
    queryFn: async () => {
      const { data } = await supabase.from("price_tiers").select("*, products(name_en), product_subtypes(name_en)");
      return data ?? [];
    },
  });

  const filteredTiers = tiers.filter((t: any) => {
    if (filterProduct !== "all" && t.product_id !== filterProduct) return false;
    return true;
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, subtype_id: form.subtype_id || null };
      if (editId) {
        const { error } = await supabase.from("price_tiers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("price_tiers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-price-tiers"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({ product_id: t.product_id, subtype_id: t.subtype_id ?? "", tier1_price_sqm: t.tier1_price_sqm, tier2_price_sqm: t.tier2_price_sqm, tier_threshold_sqm: t.tier_threshold_sqm });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Price Tiers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ product_id: products[0]?.id ?? "", subtype_id: "", tier1_price_sqm: 0, tier2_price_sqm: 0, tier_threshold_sqm: 0.25 }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Price Tier</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Product</Label>
                <select className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Subtype (optional — leave empty for default pricing)</Label>
                <select className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={form.subtype_id} onChange={(e) => setForm({ ...form, subtype_id: e.target.value })}>
                  <option value="">No subtype (default)</option>
                  {subtypes.filter((s) => s.product_id === form.product_id).map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tier 1 Price (₪/m²)</Label>
                  <Input type="number" step="0.01" value={form.tier1_price_sqm} onChange={(e) => setForm({ ...form, tier1_price_sqm: +e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tier 2 Price (₪/m²)</Label>
                  <Input type="number" step="0.01" value={form.tier2_price_sqm} onChange={(e) => setForm({ ...form, tier2_price_sqm: +e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Threshold (m²)</Label>
                  <Input type="number" step="0.01" value={form.tier_threshold_sqm} onChange={(e) => setForm({ ...form, tier_threshold_sqm: +e.target.value })} required />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tier 1 applies when print area ≤ threshold. Tier 2 applies for larger prints.</p>
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground mb-1 block">Filter by Product</Label>
        <select className="border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
          <option value="all">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Subtype</TableHead>
            <TableHead>Tier 1 (₪/m²)</TableHead>
            <TableHead>Tier 2 (₪/m²)</TableHead>
            <TableHead>Threshold (m²)</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTiers.map((t: any) => (
            <TableRow key={t.id}>
              <TableCell>{t.products?.name_en}</TableCell>
              <TableCell className="text-muted-foreground">{t.product_subtypes?.name_en ?? "Default"}</TableCell>
              <TableCell>₪{t.tier1_price_sqm}</TableCell>
              <TableCell>₪{t.tier2_price_sqm}</TableCell>
              <TableCell>{t.tier_threshold_sqm}</TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminPriceTiers;
