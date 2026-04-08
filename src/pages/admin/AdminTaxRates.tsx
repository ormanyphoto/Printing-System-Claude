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
import { Receipt, Trash2 } from "lucide-react";

type TaxRate = {
  id: string;
  country_code: string;
  region: string | null;
  tax_name: string;
  rate_pct: number;
  applies_to: string;
  enabled: boolean;
};

const COMMON_COUNTRIES = ["IL", "US", "DE", "GB", "FR", "NL", "AU", "CA", "IT", "ES"];
const APPLIES_TO_OPTIONS = ["all", "products", "shipping"];

const emptyForm = {
  country_code: "IL",
  region: "",
  tax_name: "",
  rate_pct: 0,
  applies_to: "all",
};

const AdminTaxRates = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: taxes = [] } = useQuery({
    queryKey: ["admin-tax-rates"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("tax_rates")
        .select("*")
        .order("country_code")
        .order("region");
      return (data ?? []) as TaxRate[];
    },
  });

  // Group by country
  const grouped = useMemo(() => {
    const groups: { country: string; items: TaxRate[]; totalRate: number }[] = [];
    const map = new Map<string, TaxRate[]>();
    taxes.forEach((t) => {
      const existing = map.get(t.country_code) ?? [];
      existing.push(t);
      map.set(t.country_code, existing);
    });
    map.forEach((items, country) => {
      const enabledRates = items.filter((t) => t.enabled);
      const totalRate = enabledRates.reduce((sum, t) => sum + t.rate_pct, 0);
      groups.push({ country, items, totalRate });
    });
    groups.sort((a, b) => a.country.localeCompare(b.country));
    return groups;
  }, [taxes]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        country_code: form.country_code.toUpperCase().trim(),
        region: form.region?.trim() || null,
        tax_name: form.tax_name,
        rate_pct: form.rate_pct,
        applies_to: form.applies_to,
      };
      if (editId) {
        const { error } = await (supabase as any).from("tax_rates").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("tax_rates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tax-rates"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("tax_rates").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tax-rates"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("tax_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tax-rates"] });
      toast({ title: "Tax rate deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (t: TaxRate) => {
    setEditId(t.id);
    setForm({
      country_code: t.country_code,
      region: t.region ?? "",
      tax_name: t.tax_name,
      rate_pct: t.rate_pct,
      applies_to: t.applies_to,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const appliesToLabel = (v: string) => {
    switch (v) {
      case "all": return "All";
      case "products": return "Products only";
      case "shipping": return "Shipping only";
      default: return v;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-gold">Tax Rates</h1>
        <Button variant="outline" onClick={openNew}>+ Add Tax Rate</Button>
      </div>

      <p className="font-body text-xs text-muted-foreground mb-6">
        Configure tax rates by country and optional region. Rates can apply to products, shipping, or both.
        Multiple tax rates per country are supported (e.g. federal + state).
      </p>

      {grouped.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-body text-sm text-muted-foreground">No tax rates defined yet.</p>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.country} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg text-foreground font-semibold flex items-center gap-2">
              {group.country}
              <span className="font-body text-xs font-normal text-muted-foreground">
                ({group.items.length} rate{group.items.length !== 1 ? "s" : ""})
              </span>
            </h2>
            <span className="font-body text-sm text-gold font-medium">
              Effective: {group.totalRate.toFixed(2)}%
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Tax Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-body text-sm text-muted-foreground">
                    {t.region || "All regions"}
                  </TableCell>
                  <TableCell className="font-display text-sm font-medium">{t.tax_name}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{t.rate_pct.toFixed(2)}%</TableCell>
                  <TableCell className="font-body text-xs text-muted-foreground">
                    {appliesToLabel(t.applies_to)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={(v) => toggleEnabled.mutate({ id: t.id, enabled: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(t)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this tax rate?")) {
                            remove.mutate(t.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit" : "New"} Tax Rate</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Country Code</Label>
                <Select
                  value={COMMON_COUNTRIES.includes(form.country_code) ? form.country_code : "__custom"}
                  onValueChange={(v) => {
                    if (v !== "__custom") setForm({ ...form, country_code: v });
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value="__custom">Other...</SelectItem>
                  </SelectContent>
                </Select>
                {(!COMMON_COUNTRIES.includes(form.country_code)) && (
                  <Input
                    className="mt-2"
                    value={form.country_code}
                    onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                    placeholder="e.g. JP, BR"
                    maxLength={2}
                  />
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Region (optional)</Label>
                <Input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="e.g. California, Bavaria"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tax Name</Label>
                <Input
                  value={form.tax_name}
                  onChange={(e) => setForm({ ...form, tax_name: e.target.value })}
                  placeholder="e.g. VAT, Sales Tax, GST"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.rate_pct}
                  onChange={(e) => setForm({ ...form, rate_pct: +e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Applies To</Label>
              <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLIES_TO_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{appliesToLabel(o)}</SelectItem>
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

export default AdminTaxRates;
