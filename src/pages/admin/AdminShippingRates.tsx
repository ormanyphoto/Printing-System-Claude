import { useState, useMemo } from "react";
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
import { Truck, Trash2 } from "lucide-react";

type ShippingRate = {
  id: string;
  zone_id: string;
  provider: string;
  service_name: string;
  rate_type: string;
  flat_rate: number | null;
  per_kg_rate: number | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  enabled: boolean;
};

type ShippingZone = {
  id: string;
  name: string;
};

const PROVIDERS = ["DHL", "FedEx", "UPS", "Israel Post", "Custom"];
const RATE_TYPES = ["flat", "weight", "dimension", "api"];

const emptyForm = {
  zone_id: "",
  provider: "DHL",
  service_name: "",
  rate_type: "flat",
  flat_rate: 0,
  per_kg_rate: 0,
  min_weight_kg: 0,
  max_weight_kg: 0,
  estimated_days_min: 0,
  estimated_days_max: 0,
};

const AdminShippingRates = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [zoneFilter, setZoneFilter] = useState<string>("");

  const { data: zones = [] } = useQuery({
    queryKey: ["admin-shipping-zones-list"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("shipping_zones")
        .select("id, name")
        .order("name");
      return (data ?? []) as ShippingZone[];
    },
  });

  // Default to the first zone when zones load
  const activeZoneId = zoneFilter || zones[0]?.id || "";

  const { data: rates = [] } = useQuery({
    queryKey: ["admin-shipping-rates", activeZoneId],
    queryFn: async () => {
      if (!activeZoneId) return [];
      const { data } = await (supabase as any).from("shipping_rates")
        .select("*")
        .eq("zone_id", activeZoneId)
        .order("provider")
        .order("service_name");
      return (data ?? []) as ShippingRate[];
    },
    enabled: !!activeZoneId,
  });

  const activeZoneName = useMemo(
    () => zones.find((z) => z.id === activeZoneId)?.name ?? "Select a zone",
    [zones, activeZoneId]
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        zone_id: form.zone_id || activeZoneId,
        provider: form.provider,
        service_name: form.service_name,
        rate_type: form.rate_type,
        flat_rate: form.rate_type === "flat" ? form.flat_rate || null : null,
        per_kg_rate: form.rate_type === "weight" ? form.per_kg_rate || null : null,
        min_weight_kg: form.min_weight_kg || null,
        max_weight_kg: form.max_weight_kg || null,
        estimated_days_min: form.estimated_days_min || null,
        estimated_days_max: form.estimated_days_max || null,
      };
      if (editId) {
        const { error } = await (supabase as any).from("shipping_rates").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("shipping_rates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("shipping_rates").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-rates"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("shipping_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
      toast({ title: "Rate deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (r: ShippingRate) => {
    setEditId(r.id);
    setForm({
      zone_id: r.zone_id,
      provider: r.provider,
      service_name: r.service_name,
      rate_type: r.rate_type,
      flat_rate: r.flat_rate ?? 0,
      per_kg_rate: r.per_kg_rate ?? 0,
      min_weight_kg: r.min_weight_kg ?? 0,
      max_weight_kg: r.max_weight_kg ?? 0,
      estimated_days_min: r.estimated_days_min ?? 0,
      estimated_days_max: r.estimated_days_max ?? 0,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, zone_id: activeZoneId });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-gold">Shipping Rates</h1>
        <Button variant="outline" onClick={openNew} disabled={!activeZoneId}>+ Add Rate</Button>
      </div>

      <p className="font-body text-xs text-muted-foreground mb-4">
        Configure shipping rates per zone. Select a zone to view and manage its rates.
      </p>

      {/* Zone filter */}
      <div className="mb-6 flex items-center gap-2">
        <span className="font-body text-xs text-muted-foreground">Zone:</span>
        <Select value={activeZoneId} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-56 h-8 text-sm">
            <SelectValue placeholder="Select zone..." />
          </SelectTrigger>
          <SelectContent>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeZoneId && (
          <span className="font-body text-sm font-medium text-foreground ml-2">
            {activeZoneName} - {rates.length} rate{rates.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Rate Type</TableHead>
            <TableHead>Flat Rate</TableHead>
            <TableHead>Per kg</TableHead>
            <TableHead>Est. Days</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-display text-sm font-medium">{r.provider}</TableCell>
              <TableCell className="font-body text-sm">{r.service_name}</TableCell>
              <TableCell className="font-body text-xs text-muted-foreground uppercase">{r.rate_type}</TableCell>
              <TableCell className="font-body text-sm">
                {r.flat_rate != null ? `$${r.flat_rate.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="font-body text-sm">
                {r.per_kg_rate != null ? `$${r.per_kg_rate.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="font-body text-xs text-muted-foreground">
                {r.estimated_days_min != null && r.estimated_days_max != null
                  ? `${r.estimated_days_min}-${r.estimated_days_max} days`
                  : "-"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={r.enabled}
                  onCheckedChange={(v) => toggleEnabled.mutate({ id: r.id, enabled: v })}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this shipping rate?")) {
                        remove.mutate(r.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rates.length === 0 && activeZoneId && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <Truck className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-body text-sm text-muted-foreground">No rates for this zone yet.</p>
              </TableCell>
            </TableRow>
          )}
          {!activeZoneId && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <p className="font-body text-sm text-muted-foreground">Select a zone above to view rates.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit" : "New"} Shipping Rate</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Zone</Label>
              <Select
                value={form.zone_id || activeZoneId}
                onValueChange={(v) => setForm({ ...form, zone_id: v })}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Service Name</Label>
                <Input
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  placeholder="e.g. Express, Economy"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Rate Type</Label>
              <Select value={form.rate_type} onValueChange={(v) => setForm({ ...form, rate_type: v })}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.rate_type === "flat" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Flat Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.flat_rate}
                  onChange={(e) => setForm({ ...form, flat_rate: +e.target.value })}
                />
              </div>
            )}

            {form.rate_type === "weight" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Per kg Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.per_kg_rate}
                  onChange={(e) => setForm({ ...form, per_kg_rate: +e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Min Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.min_weight_kg}
                  onChange={(e) => setForm({ ...form, min_weight_kg: +e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Max Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.max_weight_kg}
                  onChange={(e) => setForm({ ...form, max_weight_kg: +e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Est. Days (min)</Label>
                <Input
                  type="number"
                  value={form.estimated_days_min}
                  onChange={(e) => setForm({ ...form, estimated_days_min: +e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Est. Days (max)</Label>
                <Input
                  type="number"
                  value={form.estimated_days_max}
                  onChange={(e) => setForm({ ...form, estimated_days_max: +e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShippingRates;
