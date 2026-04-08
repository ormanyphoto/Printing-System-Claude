import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Package, Trash2, Box } from "lucide-react";

type PackageTemplate = {
  id: string;
  name: string;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  max_weight_kg: number;
  material: string;
  cost: number;
  enabled: boolean;
};

const MATERIALS = ["cardboard", "wood-crate", "tube", "foam", "custom"];

const emptyForm = {
  name: "",
  width_cm: 0,
  height_cm: 0,
  depth_cm: 0,
  max_weight_kg: 0,
  material: "cardboard",
  cost: 0,
};

const AdminPackages = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: packages = [] } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("package_templates")
        .select("*")
        .order("name");
      return (data ?? []) as PackageTemplate[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        width_cm: form.width_cm,
        height_cm: form.height_cm,
        depth_cm: form.depth_cm,
        max_weight_kg: form.max_weight_kg,
        material: form.material,
        cost: form.cost,
      };
      if (editId) {
        const { error } = await (supabase as any).from("package_templates").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("package_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("package_templates").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("package_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
      toast({ title: "Package deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (p: PackageTemplate) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      width_cm: p.width_cm,
      height_cm: p.height_cm,
      depth_cm: p.depth_cm,
      max_weight_kg: p.max_weight_kg,
      material: p.material,
      cost: p.cost,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const materialLabel = (m: string) => {
    switch (m) {
      case "wood-crate": return "Wood Crate";
      case "cardboard": return "Cardboard";
      case "tube": return "Tube";
      case "foam": return "Foam";
      case "custom": return "Custom";
      default: return m;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-gold">Package Templates</h1>
        <Button variant="outline" onClick={openNew}>+ Add Package</Button>
      </div>

      <p className="font-body text-xs text-muted-foreground mb-6">
        Define reusable package templates for shipping. Each template specifies dimensions, weight capacity, material,
        and packaging cost.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Dimensions (cm)</TableHead>
            <TableHead>Max Weight</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 border border-border rounded flex items-center justify-center bg-secondary/30">
                    <Box className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-display text-sm font-medium block">{p.name}</span>
                    <span className="font-body text-xs text-muted-foreground">
                      {p.width_cm} x {p.height_cm} x {p.depth_cm} cm
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-body text-sm">
                {p.width_cm} x {p.height_cm} x {p.depth_cm}
              </TableCell>
              <TableCell className="font-body text-sm">{p.max_weight_kg} kg</TableCell>
              <TableCell className="font-body text-sm text-muted-foreground">{materialLabel(p.material)}</TableCell>
              <TableCell className="font-body text-sm font-medium">${p.cost.toFixed(2)}</TableCell>
              <TableCell>
                <Switch
                  checked={p.enabled}
                  onCheckedChange={(v) => toggleEnabled.mutate({ id: p.id, enabled: v })}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this package template?")) {
                        remove.mutate(p.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {packages.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-body text-sm text-muted-foreground">No package templates defined yet.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit" : "New"} Package Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Package Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Small Flat, Large Crate"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Width (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.width_cm}
                  onChange={(e) => setForm({ ...form, width_cm: +e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.height_cm}
                  onChange={(e) => setForm({ ...form, height_cm: +e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Depth (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.depth_cm}
                  onChange={(e) => setForm({ ...form, depth_cm: +e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Max Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.max_weight_kg}
                  onChange={(e) => setForm({ ...form, max_weight_kg: +e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Packaging Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: +e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Material</Label>
              <Select value={form.material} onValueChange={(v) => setForm({ ...form, material: v })}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map((m) => (
                    <SelectItem key={m} value={m}>{materialLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
