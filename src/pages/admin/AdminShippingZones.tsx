import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Globe, Info, Trash2 } from "lucide-react";

type ShippingZone = {
  id: string;
  name: string;
  countries: string[];
  is_domestic: boolean;
  enabled: boolean;
  created_at: string;
};

const AdminShippingZones = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", countries_text: "", is_domestic: false });

  const { data: zones = [] } = useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("shipping_zones")
        .select("*")
        .order("name");
      return (data ?? []) as ShippingZone[];
    },
  });

  const { data: rateCounts = {} } = useQuery({
    queryKey: ["admin-shipping-rate-counts"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("shipping_rates")
        .select("zone_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        counts[r.zone_id] = (counts[r.zone_id] || 0) + 1;
      });
      return counts;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const countries = form.countries_text
        .split("\n")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      const payload = { name: form.name, countries, is_domestic: form.is_domestic };
      if (editId) {
        const { error } = await (supabase as any).from("shipping_zones").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("shipping_zones").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("shipping_zones").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      qc.invalidateQueries({ queryKey: ["admin-shipping-rate-counts"] });
      toast({ title: "Zone deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (z: ShippingZone) => {
    setEditId(z.id);
    setForm({
      name: z.name,
      countries_text: (z.countries ?? []).join("\n"),
      is_domestic: z.is_domestic,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", countries_text: "", is_domestic: false });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-gold">Shipping Zones</h1>
        <Button variant="outline" onClick={openNew}>+ Add Zone</Button>
      </div>

      <div className="border border-border rounded-md p-4 bg-secondary/30 mb-6 flex items-start gap-3">
        <Info className="h-4 w-4 text-gold mt-0.5 shrink-0" />
        <p className="font-body text-xs text-muted-foreground">
          Shipping zones group countries together for rate calculation. Each zone can have multiple shipping rates
          (providers and services). Mark a zone as "Domestic" for local delivery rules. Countries use ISO 3166-1
          alpha-2 codes (e.g. IL, US, DE, GB).
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zone Name</TableHead>
            <TableHead>Countries</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Rates</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zones.map((z) => (
            <TableRow key={z.id}>
              <TableCell className="font-display text-sm font-medium">{z.name}</TableCell>
              <TableCell className="font-body text-xs text-muted-foreground max-w-[300px] truncate">
                {(z.countries ?? []).join(", ") || "None"}
              </TableCell>
              <TableCell>
                {z.is_domestic ? (
                  <Badge variant="default" className="font-body text-xs">Domestic</Badge>
                ) : (
                  <Badge variant="secondary" className="font-body text-xs">International</Badge>
                )}
              </TableCell>
              <TableCell className="font-body text-sm">
                {rateCounts[z.id] ?? 0} rate{(rateCounts[z.id] ?? 0) !== 1 ? "s" : ""}
              </TableCell>
              <TableCell>
                <Switch
                  checked={z.enabled}
                  onCheckedChange={(v) => toggleEnabled.mutate({ id: z.id, enabled: v })}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(z)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this shipping zone? This cannot be undone.")) {
                        remove.mutate(z.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {zones.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-body text-sm text-muted-foreground">No shipping zones defined yet.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit" : "New"} Shipping Zone</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Zone Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Europe, Middle East, Domestic"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Countries (one code per line)
              </Label>
              <Textarea
                value={form.countries_text}
                onChange={(e) => setForm({ ...form, countries_text: e.target.value })}
                placeholder={"IL\nDE\nFR\nGB"}
                rows={5}
              />
              <p className="font-body text-xs text-muted-foreground mt-1">
                Use ISO 3166-1 alpha-2 codes. One per line.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_domestic"
                checked={form.is_domestic}
                onCheckedChange={(v) => setForm({ ...form, is_domestic: !!v })}
              />
              <Label htmlFor="is_domestic" className="text-sm font-body cursor-pointer">
                Domestic zone (local delivery rules apply)
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShippingZones;
