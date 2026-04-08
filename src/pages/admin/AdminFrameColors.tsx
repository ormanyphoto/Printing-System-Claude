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

const AdminFrameColors = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ frame_style_id: "", color_name_en: "", color_name_he: "", hex_code: "#000000" });

  const { data: styles = [] } = useQuery({
    queryKey: ["admin-frame-styles"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_styles").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["admin-frame-colors"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_colors").select("*, frame_styles(name_en)");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("frame_colors").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("frame_colors").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-frame-colors"] }); setOpen(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({ frame_style_id: c.frame_style_id, color_name_en: c.color_name_en, color_name_he: c.color_name_he, hex_code: c.hex_code });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Frame Colors</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ frame_style_id: styles[0]?.id ?? "", color_name_en: "", color_name_he: "", hex_code: "#000000" }); setOpen(true); }}>+ Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Frame Color</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Frame Style</Label><select className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm" value={form.frame_style_id} onChange={(e) => setForm({ ...form, frame_style_id: e.target.value })} required>{styles.map((s) => <option key={s.id} value={s.id}>{s.name_en}</option>)}</select></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Color Name (English)</Label><Input value={form.color_name_en} onChange={(e) => setForm({ ...form, color_name_en: e.target.value })} required /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Color Name (Hebrew)</Label><Input value={form.color_name_he} onChange={(e) => setForm({ ...form, color_name_he: e.target.value })} /></div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Color Hex Code</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={form.hex_code} onChange={(e) => setForm({ ...form, hex_code: e.target.value })} className="w-16 h-10 p-1" />
                  <Input value={form.hex_code} onChange={(e) => setForm({ ...form, hex_code: e.target.value })} className="flex-1" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Frame Style</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Hex</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colors.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="text-muted-foreground">{c.frame_styles?.name_en}</TableCell>
              <TableCell className="font-medium flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-border inline-block" style={{ backgroundColor: c.hex_code }} />
                {c.color_name_en}
              </TableCell>
              <TableCell className="text-muted-foreground">{c.hex_code}</TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminFrameColors;
