import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";

const AdminSizes = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ product_id: "", width_cm: 0, height_cm: 0, aspect_ratio: "", sort_order: 0, pack_width_cm: null as number | null, pack_height_cm: null as number | null, pack_depth_cm: null as number | null, pack_weight_kg: null as number | null });
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterRatio, setFilterRatio] = useState<string>("all");

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["admin-sizes"],
    queryFn: async () => {
      const { data } = await supabase.from("size_presets").select("*, products(name_en)").order("sort_order");
      return data ?? [];
    },
  });

  const filteredSizes = sizes.filter((s: any) => {
    if (filterProduct !== "all" && s.product_id !== filterProduct) return false;
    if (filterRatio !== "all" && s.aspect_ratio !== filterRatio) return false;
    return true;
  });

  const uniqueRatios = [...new Set(sizes.map((s: any) => s.aspect_ratio))].sort();

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("size_presets").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("size_presets").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sizes"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("size_presets").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sizes"] }),
  });

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ product_id: s.product_id, width_cm: s.width_cm, height_cm: s.height_cm, aspect_ratio: s.aspect_ratio, sort_order: s.sort_order, pack_width_cm: s.pack_width_cm, pack_height_cm: s.pack_height_cm, pack_depth_cm: s.pack_depth_cm, pack_weight_kg: s.pack_weight_kg });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Size Presets</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ product_id: products[0]?.id ?? "", width_cm: 0, height_cm: 0, aspect_ratio: "1:1", sort_order: 0, pack_width_cm: null, pack_height_cm: null, pack_depth_cm: null, pack_weight_kg: null }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Size Preset</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Product</Label>
                <select className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Width (cm)</Label>
                  <Input type="number" value={form.width_cm} onChange={(e) => setForm({ ...form, width_cm: +e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</Label>
                  <Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: +e.target.value })} required />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Aspect Ratio</Label>
                  <Input placeholder="e.g. 3:2" value={form.aspect_ratio} onChange={(e) => setForm({ ...form, aspect_ratio: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order (lower = first)</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} />
              </div>
              <p className="font-body text-xs text-muted-foreground mt-4 mb-2 font-semibold uppercase tracking-wider">Shipping / Packaging (internal only)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Pack Width (cm)</Label>
                  <Input type="number" step="0.1" placeholder="e.g. 35" value={form.pack_width_cm ?? ""} onChange={(e) => setForm({ ...form, pack_width_cm: e.target.value ? +e.target.value : null })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Pack Height (cm)</Label>
                  <Input type="number" step="0.1" placeholder="e.g. 45" value={form.pack_height_cm ?? ""} onChange={(e) => setForm({ ...form, pack_height_cm: e.target.value ? +e.target.value : null })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Pack Depth (cm)</Label>
                  <Input type="number" step="0.1" placeholder="e.g. 8" value={form.pack_depth_cm ?? ""} onChange={(e) => setForm({ ...form, pack_depth_cm: e.target.value ? +e.target.value : null })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</Label>
                  <Input type="number" step="0.1" placeholder="e.g. 2.5" value={form.pack_weight_kg ?? ""} onChange={(e) => setForm({ ...form, pack_weight_kg: e.target.value ? +e.target.value : null })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Filter by Product</Label>
          <select className="border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
            <option value="all">All Products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Filter by Ratio</Label>
          <select className="border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={filterRatio} onChange={(e) => setFilterRatio(e.target.value)}>
            <option value="all">All Ratios</option>
            {uniqueRatios.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Size (W×H cm)</TableHead>
            <TableHead>Ratio</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSizes.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell className="text-muted-foreground">{s.products?.name_en}</TableCell>
              <TableCell className="font-medium">{s.width_cm}×{s.height_cm} cm</TableCell>
              <TableCell>{s.aspect_ratio}</TableCell>
              <TableCell>{s.sort_order}</TableCell>
              <TableCell><Switch checked={s.enabled} onCheckedChange={(v) => toggleEnabled.mutate({ id: s.id, enabled: v })} /></TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminSizes;
