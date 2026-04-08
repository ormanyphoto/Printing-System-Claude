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

const AdminFrameStyles = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_en: "", name_he: "", material: "", price_per_cm: 0, sort_order: 0 });

  const { data: styles = [] } = useQuery({
    queryKey: ["admin-frame-styles"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_styles").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price_per_cm: form.price_per_cm / 100 };
      if (editId) {
        const { error } = await supabase.from("frame_styles").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("frame_styles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-frame-styles"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("frame_styles").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-frame-styles"] }),
  });

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ name_en: s.name_en, name_he: s.name_he, material: s.material, price_per_cm: Number(s.price_per_cm) * 100, sort_order: s.sort_order });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Frame Styles</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ name_en: "", name_he: "", material: "", price_per_cm: 0, sort_order: 0 }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Frame Style</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Frame Style Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Frame Style Name (Hebrew)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Frame Material (e.g. Wood, Aluminum)</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Price per meter (₪)</Label><Input type="number" step="0.01" value={form.price_per_cm} onChange={(e) => setForm({ ...form, price_per_cm: +e.target.value })} required /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Frame cost = 2 × (width + height) × price per meter ÷ 100</p>
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
            <TableHead>₪/m</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {styles.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name_en}</TableCell>
              <TableCell className="text-muted-foreground">{s.material}</TableCell>
              <TableCell>₪{(Number(s.price_per_cm) * 100).toFixed(2)}</TableCell>
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

export default AdminFrameStyles;
