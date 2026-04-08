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
import ThumbnailUpload from "@/components/admin/ThumbnailUpload";
import { getSafeErrorMessage } from "@/lib/error-messages";

const AdminSubtypes = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ product_id: "", name_en: "", name_he: "", description_en: "", description_he: "", thickness_mm: 0, sort_order: 0, thumbnail_url: "" });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: subtypes = [] } = useQuery({
    queryKey: ["admin-subtypes"],
    queryFn: async () => {
      const { data } = await supabase.from("product_subtypes").select("*, products(name_en)").order("sort_order");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, thickness_mm: form.thickness_mm || null };
      if (editId) {
        const { error } = await supabase.from("product_subtypes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_subtypes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subtypes"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("product_subtypes").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subtypes"] }),
  });

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ product_id: s.product_id, name_en: s.name_en, name_he: s.name_he, description_en: s.description_en ?? "", description_he: s.description_he ?? "", thickness_mm: s.thickness_mm ?? 0, sort_order: s.sort_order, thumbnail_url: s.thumbnail_url ?? "" });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Product Subtypes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ product_id: products[0]?.id ?? "", name_en: "", name_he: "", description_en: "", description_he: "", thickness_mm: 0, sort_order: 0, thumbnail_url: "" }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Subtype</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Parent Product</Label><select className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>{products.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}</select></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Subtype Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Subtype Name (Hebrew)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Description (English)</Label><Input value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Thickness (mm)</Label><Input type="number" value={form.thickness_mm} onChange={(e) => setForm({ ...form, thickness_mm: +e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              </div>
              <ThumbnailUpload
                value={form.thumbnail_url}
                onChange={(url) => setForm({ ...form, thumbnail_url: url })}
                folder="subtypes"
                label="Thumbnail"
              />
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Thickness</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subtypes.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell className="text-muted-foreground">{s.products?.name_en}</TableCell>
              <TableCell className="font-medium">{s.name_en}</TableCell>
              <TableCell>{s.thickness_mm ?? "-"}</TableCell>
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

export default AdminSubtypes;
