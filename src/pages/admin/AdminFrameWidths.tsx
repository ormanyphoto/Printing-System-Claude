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

const AdminFrameWidths = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ width_cm: 0, surcharge_pct: 0, sort_order: 0 });

  const { data: widths = [] } = useQuery({
    queryKey: ["admin-frame-widths"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_widths").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("frame_widths").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("frame_widths").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-frame-widths"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("frame_widths").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-frame-widths"] }),
  });

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ width_cm: s.width_cm, surcharge_pct: s.surcharge_pct, sort_order: s.sort_order });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Frame Widths</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ width_cm: 0, surcharge_pct: 0, sort_order: 0 }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Frame Width</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Width (cm)</Label><Input type="number" step="0.1" value={form.width_cm} onChange={(e) => setForm({ ...form, width_cm: +e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Surcharge (%)</Label><Input type="number" step="1" value={form.surcharge_pct} onChange={(e) => setForm({ ...form, surcharge_pct: +e.target.value })} required /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Surcharge is applied as a percentage of the base print price</p>
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Width (cm)</TableHead>
            <TableHead>Surcharge %</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {widths.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="font-medium">{Number(w.width_cm)} cm</TableCell>
              <TableCell>{Number(w.surcharge_pct)}%</TableCell>
              <TableCell>{w.sort_order}</TableCell>
              <TableCell><Switch checked={w.enabled} onCheckedChange={(v) => toggleEnabled.mutate({ id: w.id, enabled: v })} /></TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(w)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminFrameWidths;
