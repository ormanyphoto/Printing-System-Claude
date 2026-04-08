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

const AdminSubframes = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_en: "", name_he: "", material: "", color: "", surcharge_pct: 0, width_cm: 0, height_cm: 0, inset_cm: 0 });

  const { data: options = [] } = useQuery({
    queryKey: ["admin-subframes"],
    queryFn: async () => {
      const { data } = await supabase.from("subframe_options").select("*");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("subframe_options").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subframe_options").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subframes"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("subframe_options").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subframes"] }),
  });

  const openEdit = (o: any) => {
    setEditId(o.id);
    setForm({ name_en: o.name_en, name_he: o.name_he, material: o.material, color: o.color, surcharge_pct: o.surcharge_pct, width_cm: o.width_cm, height_cm: o.height_cm, inset_cm: o.inset_cm });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Subframe Options</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ name_en: "", name_he: "", material: "", color: "", surcharge_pct: 0, width_cm: 0, height_cm: 0, inset_cm: 0 }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Subframe</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Subframe Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Subframe Name (Hebrew)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Material (e.g. PVC, Aluminum)</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} required /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Surcharge (%)</Label><Input type="number" value={form.surcharge_pct} onChange={(e) => setForm({ ...form, surcharge_pct: +e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Width (cm)</Label><Input type="number" value={form.width_cm} onChange={(e) => setForm({ ...form, width_cm: +e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</Label><Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: +e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Inset (cm)</Label><Input type="number" value={form.inset_cm} onChange={(e) => setForm({ ...form, inset_cm: +e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Auto-assigned by size: PVC for ≤50cm, Plastic/Aluminum for 50-120cm, Aluminum for &gt;120cm.</p>
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Surcharge</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.name_en}</TableCell>
              <TableCell className="text-muted-foreground">{o.material}</TableCell>
              <TableCell>{o.surcharge_pct}%</TableCell>
              <TableCell><Switch checked={o.enabled} onCheckedChange={(v) => toggleEnabled.mutate({ id: o.id, enabled: v })} /></TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(o)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminSubframes;
