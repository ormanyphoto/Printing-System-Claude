import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download, Package, Truck, Settings } from "lucide-react";

type SizeWithProduct = {
  id: string;
  width_cm: number;
  height_cm: number;
  aspect_ratio: string;
  product_id: string;
  pack_width_cm: number | null;
  pack_height_cm: number | null;
  pack_depth_cm: number | null;
  pack_weight_kg: number | null;
  enabled: boolean;
  products: { name_en: string; slug: string } | null;
};

const AdminShipping = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [importPreview, setImportPreview] = useState<
    { product: string; size: string; w: number; h: number; d: number; kg: number; matchId: string | null }[] | null
  >(null);
  const [dhlLoading, setDhlLoading] = useState(false);
  const [dhlResults, setDhlResults] = useState<any[] | null>(null);
  const [dhlErrors, setDhlErrors] = useState<any[] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    origin_country: "IL",
    origin_city: "Tel Aviv",
    origin_postal: "6100000",
    dest_country: "IL",
    dest_city: "Tel Aviv",
    dest_postal: "6100000",
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["admin-shipping-sizes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("size_presets")
        .select("id, width_cm, height_cm, aspect_ratio, product_id, pack_width_cm, pack_height_cm, pack_depth_cm, pack_weight_kg, enabled, products(name_en, slug)")
        .order("product_id")
        .order("width_cm");
      return (data ?? []) as unknown as SizeWithProduct[];
    },
  });

  const products = useMemo(() => {
    const map = new Map<string, string>();
    sizes.forEach((s) => {
      if (s.products?.name_en) map.set(s.product_id, s.products.name_en);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sizes]);

  const filtered = useMemo(
    () => productFilter === "all" ? sizes : sizes.filter((s) => s.product_id === productFilter),
    [sizes, productFilter]
  );

  // Group by product for display
  const grouped = useMemo(() => {
    const groups: { productName: string; productId: string; items: SizeWithProduct[] }[] = [];
    let current: typeof groups[0] | null = null;
    filtered.forEach((s) => {
      if (!current || current.productId !== s.product_id) {
        current = { productName: s.products?.name_en ?? "Unknown", productId: s.product_id, items: [] };
        groups.push(current);
      }
      current.items.push(s);
    });
    return groups;
  }, [filtered]);

  const updateShipping = useMutation({
    mutationFn: async (row: { id: string; pack_width_cm: number | null; pack_height_cm: number | null; pack_depth_cm: number | null; pack_weight_kg: number | null }) => {
      const { id, ...updates } = row;
      const { error } = await supabase.from("size_presets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-sizes"] }),
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (rows: { id: string; pack_width_cm: number | null; pack_height_cm: number | null; pack_depth_cm: number | null; pack_weight_kg: number | null }[]) => {
      for (const row of rows) {
        const { id, ...updates } = row;
        const { error } = await supabase.from("size_presets").update(updates).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-sizes"] });
      setImportPreview(null);
      toast({ title: "Shipping data imported successfully" });
    },
    onError: (e: any) => toast({ title: "Import failed", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const handleExportCSV = () => {
    const header = "product_name,size_cm,pack_width_cm,pack_height_cm,pack_depth_cm,pack_weight_kg";
    const rows = filtered.map((s) =>
      [
        `"${s.products?.name_en ?? ""}"`,
        `"${s.width_cm}x${s.height_cm}"`,
        s.pack_width_cm ?? "",
        s.pack_height_cm ?? "",
        s.pack_depth_cm ?? "",
        s.pack_weight_kg ?? "",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipping-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    return lines.slice(1).map((line) => {
      const parts: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { parts.push(current.trim()); current = ""; continue; }
        current += ch;
      }
      parts.push(current.trim());
      return {
        product: parts[0] || "",
        size: parts[1] || "",
        w: parseFloat(parts[2]) || 0,
        h: parseFloat(parts[3]) || 0,
        d: parseFloat(parts[4]) || 0,
        kg: parseFloat(parts[5]) || 0,
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      const preview = parsed.map((row) => {
        const [wStr, hStr] = row.size.split("x");
        const w = parseInt(wStr), h = parseInt(hStr);
        const match = sizes.find(
          (s) =>
            s.products?.name_en?.toLowerCase() === row.product.toLowerCase() &&
            s.width_cm === w && s.height_cm === h
        );
        return { ...row, matchId: match?.id ?? null };
      });
      setImportPreview(preview);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    const matched = importPreview.filter((r) => r.matchId);
    bulkUpdate.mutate(matched.map((r) => ({
      id: r.matchId!,
      pack_width_cm: r.w || null,
      pack_height_cm: r.h || null,
      pack_depth_cm: r.d || null,
      pack_weight_kg: r.kg || null,
    })));
  };

  const handleDhlLookup = async () => {
    setDhlLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/dhl-rates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            ...apiSettings,
            sizes: filtered.map((s) => ({
              id: s.id,
              width_cm: s.width_cm,
              height_cm: s.height_cm,
              product_name: s.products?.name_en ?? "",
              pack_width_cm: s.pack_width_cm,
              pack_height_cm: s.pack_height_cm,
              pack_depth_cm: s.pack_depth_cm,
              pack_weight_kg: s.pack_weight_kg,
            })),
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const result = await resp.json();
      setDhlResults(result.rates || []);
      setDhlErrors(result.errors || []);
      if (result.rates?.length) {
        toast({ title: `DHL returned rates for ${result.rates.length} sizes` });
      } else {
        toast({ title: "DHL returned no rates", description: result.message || "Check your DHL configuration" });
      }
    } catch (err: any) {
      toast({ title: "DHL API Error", description: err.message, variant: "destructive" });
    } finally {
      setDhlLoading(false);
    }
  };

  const matchedCount = importPreview?.filter((r) => r.matchId).length ?? 0;
  const unmatchedCount = importPreview ? importPreview.length - matchedCount : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-gold">Shipping Data</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-body gap-1.5" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" /> API Settings
          </Button>
          <Button variant="outline" size="sm" className="font-body gap-1.5" onClick={handleDhlLookup} disabled={dhlLoading}>
            <Truck className="h-3.5 w-3.5" /> {dhlLoading ? "Fetching..." : "DHL Rates"}
          </Button>
          <Button variant="outline" size="sm" className="font-body gap-1.5" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="font-body gap-1.5" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
        </div>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">
        Enter estimated packed dimensions (L×W×H in cm) and weight (kg) for each size preset. For production use, click "DHL Rates" to fetch live shipping quotes.
      </p>

      {/* Product filter */}
      <div className="mb-4 flex items-center gap-2">
        <span className="font-body text-xs text-muted-foreground">Filter by product:</span>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Import preview */}
      {importPreview && (
        <div className="border border-border rounded-md p-4 mb-6 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-body text-sm font-semibold">CSV Import Preview</p>
              <p className="font-body text-xs text-muted-foreground">
                {matchedCount} matched, {unmatchedCount} unmatched
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="font-body" onClick={() => setImportPreview(null)}>Cancel</Button>
              <Button size="sm" className="font-body" disabled={matchedCount === 0 || bulkUpdate.isPending} onClick={handleConfirmImport}>
                {bulkUpdate.isPending ? "Importing..." : `Import ${matchedCount} rows`}
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>W (cm)</TableHead>
                <TableHead>H (cm)</TableHead>
                <TableHead>D (cm)</TableHead>
                <TableHead>Wt (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importPreview.map((row, i) => (
                <TableRow key={i} className={row.matchId ? "" : "opacity-50"}>
                  <TableCell className="font-body text-xs">{row.matchId ? "✅ Matched" : "⚠️ Not found"}</TableCell>
                  <TableCell className="font-body text-sm">{row.product}</TableCell>
                  <TableCell className="font-body text-sm">{row.size}</TableCell>
                  <TableCell className="font-body text-sm">{row.w || "–"}</TableCell>
                  <TableCell className="font-body text-sm">{row.h || "–"}</TableCell>
                  <TableCell className="font-body text-sm">{row.d || "–"}</TableCell>
                  <TableCell className="font-body text-sm">{row.kg || "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DHL Results */}
      {dhlResults && dhlResults.length > 0 && (
        <div className="border border-border rounded-md p-4 mb-6 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-body text-sm font-semibold">🚚 DHL Rate Quotes</p>
              <p className="font-body text-xs text-muted-foreground">
                {dhlResults.length} rates fetched{dhlErrors && dhlErrors.length > 0 ? `, ${dhlErrors.length} errors` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="font-body" onClick={() => { setDhlResults(null); setDhlErrors(null); }}>Dismiss</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Pack Dims</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dhlResults.map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-body text-sm">{r.product_name}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{r.size}</TableCell>
                  <TableCell className="font-body text-xs text-muted-foreground">{r.pack_dimensions} cm</TableCell>
                  <TableCell className="font-body text-xs">{r.weight_kg} kg</TableCell>
                  <TableCell className="font-body text-xs">{r.service || "–"}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{r.cheapest_rate != null ? `${r.cheapest_rate} ${r.currency}` : "–"}</TableCell>
                  <TableCell className="font-body text-xs text-muted-foreground">{r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {dhlErrors && dhlErrors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="font-body text-xs text-destructive font-semibold mb-1">Errors ({dhlErrors.length})</p>
              {dhlErrors.map((e: any, i: number) => (
                <p key={i} className="font-body text-xs text-muted-foreground">{e.size}: {e.error?.substring(0, 100)}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grouped tables */}
      {grouped.map((group) => (
        <div key={group.productId} className="mb-8">
          <h2 className="font-display text-lg text-foreground font-semibold mb-2">{group.productName}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size (cm)</TableHead>
                <TableHead>Ratio</TableHead>
                <TableHead>Pack W (cm)</TableHead>
                <TableHead>Pack H (cm)</TableHead>
                <TableHead>Pack D (cm)</TableHead>
                <TableHead>Weight (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((s) => (
                <ShippingRow key={s.id} size={s} onSave={(updates) => updateShipping.mutate({ id: s.id, ...updates })} />
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {sizes.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-body text-sm text-muted-foreground">No size presets found. Add sizes first.</p>
        </div>
      )}

      {/* API Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Shipping API Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Provider info */}
            <div className="border border-border rounded-md p-4 bg-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-gold" />
                <p className="font-body text-sm font-semibold">DHL Express</p>
                <span className="ml-auto font-body text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Connected</span>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                Using MyDHL Express API for live rate quotes. API key and account number are securely stored.
              </p>
            </div>

            {/* Origin address */}
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Origin Address (Ship From)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
                  <Input className="h-8 text-sm" value={apiSettings.origin_country} onChange={(e) => setApiSettings({ ...apiSettings, origin_country: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">City</Label>
                  <Input className="h-8 text-sm" value={apiSettings.origin_city} onChange={(e) => setApiSettings({ ...apiSettings, origin_city: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Postal Code</Label>
                  <Input className="h-8 text-sm" value={apiSettings.origin_postal} onChange={(e) => setApiSettings({ ...apiSettings, origin_postal: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Destination address */}
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Destination Address (Ship To)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
                  <Input className="h-8 text-sm" value={apiSettings.dest_country} onChange={(e) => setApiSettings({ ...apiSettings, dest_country: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">City</Label>
                  <Input className="h-8 text-sm" value={apiSettings.dest_city} onChange={(e) => setApiSettings({ ...apiSettings, dest_city: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Postal Code</Label>
                  <Input className="h-8 text-sm" value={apiSettings.dest_postal} onChange={(e) => setApiSettings({ ...apiSettings, dest_postal: e.target.value })} />
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-muted-foreground italic">
              Set origin and destination to get rate quotes for a specific shipping route. Changes apply to the next "DHL Rates" fetch.
            </p>

            <Button className="w-full font-body" onClick={() => { setSettingsOpen(false); toast({ title: "Settings saved" }); }}>
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ShippingRow({
  size,
  onSave,
}: {
  size: SizeWithProduct;
  onSave: (u: { pack_width_cm: number | null; pack_height_cm: number | null; pack_depth_cm: number | null; pack_weight_kg: number | null }) => void;
}) {
  const [w, setW] = useState(size.pack_width_cm ?? 0);
  const [h, setH] = useState(size.pack_height_cm ?? 0);
  const [d, setD] = useState(size.pack_depth_cm ?? 0);
  const [kg, setKg] = useState(size.pack_weight_kg ?? 0);

  const save = (field: string, value: number) => {
    const current = { pack_width_cm: w || null, pack_height_cm: h || null, pack_depth_cm: d || null, pack_weight_kg: kg || null };
    onSave({ ...current, [field]: value || null });
  };

  return (
    <TableRow className={size.enabled ? "" : "opacity-50"}>
      <TableCell className="font-body text-sm font-medium">{size.width_cm}×{size.height_cm}</TableCell>
      <TableCell className="font-body text-xs text-muted-foreground">{size.aspect_ratio}</TableCell>
      <TableCell><Input type="number" step="0.1" className="w-20 h-8 text-sm" value={w} onChange={(e) => setW(+e.target.value)} onBlur={() => save("pack_width_cm", w)} /></TableCell>
      <TableCell><Input type="number" step="0.1" className="w-20 h-8 text-sm" value={h} onChange={(e) => setH(+e.target.value)} onBlur={() => save("pack_height_cm", h)} /></TableCell>
      <TableCell><Input type="number" step="0.1" className="w-20 h-8 text-sm" value={d} onChange={(e) => setD(+e.target.value)} onBlur={() => save("pack_depth_cm", d)} /></TableCell>
      <TableCell><Input type="number" step="0.1" className="w-20 h-8 text-sm" value={kg} onChange={(e) => setKg(+e.target.value)} onBlur={() => save("pack_weight_kg", kg)} /></TableCell>
    </TableRow>
  );
}

export default AdminShipping;
