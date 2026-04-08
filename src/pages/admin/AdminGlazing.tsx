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

const AdminGlazing = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_en: "", name_he: "", price_sqm: 0, sort_order: 0 });

  const { data: options = [] } = useQuery({
    queryKey: ["admin-glazing"],
    queryFn: async () => {
      const { data } = await supabase.from("glazing_options").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("glazing_options").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("glazing_options").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-glazing"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("glazing_options").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-glazing"] }),
  });

  const openEdit = (g: any) => {
    setEditId(g.id);
    setForm({ name_en: g.name_en, name_he: g.name_he, price_sqm: g.price_sqm, sort_order: g.sort_order });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Glazing Options</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ name_en: "", name_he: "", price_sqm: 0, sort_order: 0 }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Glazing</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Glazing Name (English)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Glazing Name (Hebrew)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Price per m² (₪)</Label><Input type="number" step="0.01" value={form.price_sqm} onChange={(e) => setForm({ ...form, price_sqm: +e.target.value })} required /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Glazing cost = area (m²) × price per m²</p>
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>₪/m²</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((g) => (
            <TableRow key={g.id}>
              <TableCell className="font-medium">{g.name_en}</TableCell>
              <TableCell>₪{Number(g.price_sqm).toFixed(0)}</TableCell>
              <TableCell>{g.sort_order}</TableCell>
              <TableCell><Switch checked={g.enabled} onCheckedChange={(v) => toggleEnabled.mutate({ id: g.id, enabled: v })} /></TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminGlazing;
