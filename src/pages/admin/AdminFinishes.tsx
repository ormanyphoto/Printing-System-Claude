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
import ThumbnailUpload from "@/components/admin/ThumbnailUpload";

const AdminFinishes = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ subtype_id: "", name_en: "", name_he: "", surcharge_pct: 0, sort_order: 0, thumbnail_url: "" });

  const { data: subtypes = [] } = useQuery({
    queryKey: ["admin-subtypes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("product_subtypes").select("*, products(name_en)").order("sort_order");
      return data ?? [];
    },
  });

  const { data: finishes = [] } = useQuery({
    queryKey: ["admin-finishes"],
    queryFn: async () => {
      const { data } = await supabase.from("finishes").select("*, product_subtypes(name_en)").order("sort_order");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("finishes").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finishes").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-finishes"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("finishes").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-finishes"] }),
  });

  const openEdit = (f: any) => {
    setEditId(f.id);
    setForm({ subtype_id: f.subtype_id, name_en: f.name_en, name_he: f.name_he, surcharge_pct: f.surcharge_pct, sort_order: f.sort_order, thumbnail_url: f.thumbnail_url || "" });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Finishes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ subtype_id: subtypes[0]?.id ?? "", name_en: "", name_he: "", surcharge_pct: 0, sort_order: 0, thumbnail_url: "" }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Finish</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Product Subtype</Label><select className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={form.subtype_id} onChange={(e) => setForm({ ...form, subtype_id: e.target.value })} required>{subtypes.map((s: any) => <option key={s.id} value={s.id}>{s.products?.name_en} → {s.name_en}</option>)}</select></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Finish Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Finish Name (Hebrew)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Surcharge (%)</Label><Input type="number" value={form.surcharge_pct} onChange={(e) => setForm({ ...form, surcharge_pct: +e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              </div>
              <ThumbnailUpload
                value={form.thumbnail_url}
                onChange={(url) => setForm({ ...form, thumbnail_url: url })}
                folder="finishes"
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
            <TableHead>Subtype</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Surcharge</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {finishes.map((f: any) => (
            <TableRow key={f.id}>
              <TableCell className="text-muted-foreground">{f.product_subtypes?.name_en}</TableCell>
              <TableCell className="font-medium">{f.name_en}</TableCell>
              <TableCell>{f.surcharge_pct}%</TableCell>
              <TableCell>{f.sort_order}</TableCell>
              <TableCell><Switch checked={f.enabled} onCheckedChange={(v) => toggleEnabled.mutate({ id: f.id, enabled: v })} /></TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(f)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminFinishes;
