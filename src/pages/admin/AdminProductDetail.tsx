import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ThumbnailUpload from "@/components/admin/ThumbnailUpload";
import { getSafeErrorMessage } from "@/lib/error-messages";

const AdminProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();

  // --- Product ---
  const { data: product } = useQuery({
    queryKey: ["admin-product-by-slug", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("slug", slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const updateProduct = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!product) return;
      const { error } = await supabase.from("products").update(updates as any).eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product-by-slug", slug] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // --- Subtypes ---
  const { data: subtypes = [] } = useQuery({
    queryKey: ["admin-subtypes-for-product", product?.id],
    queryFn: async () => {
      const { data } = await supabase.from("product_subtypes").select("*").eq("product_id", product!.id).order("sort_order");
      return data ?? [];
    },
    enabled: !!product?.id,
  });

  // --- Price Tiers ---
  const { data: priceTiers = [] } = useQuery({
    queryKey: ["admin-price-tiers-for-product", product?.id],
    queryFn: async () => {
      const { data } = await supabase.from("price_tiers").select("*").eq("product_id", product!.id);
      return data ?? [];
    },
    enabled: !!product?.id,
  });

  // --- Finishes ---
  const { data: allFinishes = [] } = useQuery({
    queryKey: ["admin-finishes-for-product", product?.id],
    queryFn: async () => {
      const subtypeIds = subtypes.map((s) => s.id);
      if (subtypeIds.length === 0) return [];
      const { data } = await supabase.from("finishes").select("*").in("subtype_id", subtypeIds).order("sort_order");
      return data ?? [];
    },
    enabled: subtypes.length > 0,
  });

  const updatePriceTier = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("price_tiers").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-price-tiers-for-product", product?.id] }),
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleSubtypeEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("product_subtypes").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subtypes-for-product", product?.id] }),
  });

  const toggleFinishEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("finishes").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-finishes-for-product", product?.id] }),
  });

  // --- Inline editing states for price tiers ---
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState({ tier_threshold_sqm: 0, tier1_price_sqm: 0, tier2_price_sqm: 0 });

  // --- Subtype dialog ---
  const [subtypeDialogOpen, setSubtypeDialogOpen] = useState(false);
  const [subtypeEditId, setSubtypeEditId] = useState<string | null>(null);
  const [subtypeForm, setSubtypeForm] = useState({ name_en: "", name_he: "", description_en: "", thickness_mm: 0, sort_order: 0, pack_width_cm: 0, pack_height_cm: 0, pack_depth_cm: 0, pack_weight_kg: 0, thumbnail_url: "" });

  const saveSubtype = useMutation({
    mutationFn: async () => {
      const payload = {
        ...subtypeForm,
        product_id: product!.id,
        thickness_mm: subtypeForm.thickness_mm || null,
        pack_width_cm: subtypeForm.pack_width_cm || null,
        pack_height_cm: subtypeForm.pack_height_cm || null,
        pack_depth_cm: subtypeForm.pack_depth_cm || null,
        pack_weight_kg: subtypeForm.pack_weight_kg || null,
      };
      if (subtypeEditId) {
        const { error } = await supabase.from("product_subtypes").update(payload).eq("id", subtypeEditId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_subtypes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subtypes-for-product", product?.id] });
      setSubtypeDialogOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // --- Finish dialog ---
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [finishEditId, setFinishEditId] = useState<string | null>(null);
  const [finishForSubtype, setFinishForSubtype] = useState<string>("");
  const [finishForm, setFinishForm] = useState({ name_en: "", name_he: "", surcharge_pct: 0, sort_order: 0, thumbnail_url: "" });

  const saveFinish = useMutation({
    mutationFn: async () => {
      const payload = { ...finishForm, subtype_id: finishForSubtype };
      if (finishEditId) {
        const { error } = await supabase.from("finishes").update(payload).eq("id", finishEditId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("finishes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-finishes-for-product", product?.id] });
      setFinishDialogOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  if (!product) return <div className="text-muted-foreground font-body">Loading...</div>;

  const getSubtypeTiers = (subtypeId: string) => priceTiers.filter((t) => t.subtype_id === subtypeId);
  const getDefaultTiers = () => priceTiers.filter((t) => !t.subtype_id);
  const getSubtypeFinishes = (subtypeId: string) => allFinishes.filter((f) => f.subtype_id === subtypeId);

  return (
    <div>
      {/* Product header */}
      <h1 className="font-display text-2xl text-gold mb-4">{product.name_en}</h1>

      {/* Product-level settings */}
      <div className="flex items-center gap-6 mb-8 flex-wrap">
        <label className="flex items-center gap-2 font-body text-sm">
          <Checkbox
            checked={product.enabled}
            onCheckedChange={(v) => updateProduct.mutate({ enabled: !!v })}
          />
          Product Enabled
        </label>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-muted-foreground">Max Width (cm):</span>
          <Input
            type="number"
            className="w-20 h-8 text-sm"
            defaultValue={product.max_width_cm}
            onBlur={(e) => updateProduct.mutate({ max_width_cm: +e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-muted-foreground">Max Height (cm):</span>
          <Input
            type="number"
            className="w-20 h-8 text-sm"
            defaultValue={product.max_height_cm}
            onBlur={(e) => updateProduct.mutate({ max_height_cm: +e.target.value })}
          />
        </div>
      </div>

      {/* If product has no subtypes, show default pricing */}
      {subtypes.length === 0 && (
        <div className="border border-border rounded-md p-5 mb-6 bg-card">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Price Tiers — Price per sqm (ILS)
          </p>
          <p className="font-body text-xs text-muted-foreground mb-3 italic">
            "Up To" = max sqm for this tier. Last tier applies for anything larger.
          </p>
          {getDefaultTiers().map((tier) => (
            <PriceTierRow
              key={tier.id}
              tier={tier}
              onSave={(updates) => updatePriceTier.mutate({ id: tier.id, ...updates })}
            />
          ))}
        </div>
      )}

      {/* Subtypes with inline pricing and finishes */}
      {subtypes.map((subtype) => {
        const tiers = getSubtypeTiers(subtype.id);
        const finishes = getSubtypeFinishes(subtype.id);
        return (
          <div key={subtype.id} className="border border-border rounded-md p-5 mb-6 bg-card">
            {/* Subtype header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-foreground font-semibold">{subtype.name_en}</h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setSubtypeEditId(subtype.id);
                    setSubtypeForm({
                      name_en: subtype.name_en,
                      name_he: subtype.name_he,
                      description_en: subtype.description_en || "",
                      thickness_mm: subtype.thickness_mm || 0,
                      sort_order: subtype.sort_order,
                      pack_width_cm: (subtype as any).pack_width_cm || 0,
                      pack_height_cm: (subtype as any).pack_height_cm || 0,
                      pack_depth_cm: (subtype as any).pack_depth_cm || 0,
                      pack_weight_kg: (subtype as any).pack_weight_kg || 0,
                      thumbnail_url: subtype.thumbnail_url || "",
                    });
                    setSubtypeDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <label className="flex items-center gap-2 font-body text-sm">
                  <Checkbox
                    checked={subtype.enabled}
                    onCheckedChange={(v) => toggleSubtypeEnabled.mutate({ id: subtype.id, enabled: !!v })}
                  />
                  Enabled
                </label>
              </div>
            </div>
            {/* Shipping info */}
            {((subtype as any).pack_width_cm || (subtype as any).pack_height_cm || (subtype as any).pack_depth_cm || (subtype as any).pack_weight_kg) && (
              <p className="font-body text-xs text-muted-foreground mb-3">
                📦 Shipping: {(subtype as any).pack_width_cm || '–'}×{(subtype as any).pack_height_cm || '–'}×{(subtype as any).pack_depth_cm || '–'} cm, {(subtype as any).pack_weight_kg || '–'} kg
              </p>
            )}

            {/* Price Tiers */}
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Price Tiers — Price per sqm (ILS)
            </p>
            <p className="font-body text-xs text-muted-foreground mb-3 italic">
              "Up To" = max sqm for this tier. Last tier applies for anything larger.
            </p>
            {tiers.length === 0 && (
              <p className="font-body text-xs text-muted-foreground mb-3">No price tiers configured for this subtype.</p>
            )}
            {tiers.map((tier) => (
              <PriceTierRow
                key={tier.id}
                tier={tier}
                onSave={(updates) => updatePriceTier.mutate({ id: tier.id, ...updates })}
              />
            ))}

            {/* Finishes */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Finishes
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setFinishEditId(null);
                    setFinishForSubtype(subtype.id);
                    setFinishForm({ name_en: "", name_he: "", surcharge_pct: 0, sort_order: 0, thumbnail_url: "" });
                    setFinishDialogOpen(true);
                  }}
                >
                  + Add Finish
                </Button>
              </div>
              {finishes.length === 0 && (
                <p className="font-body text-xs text-muted-foreground">No finishes configured.</p>
              )}
              {finishes.map((f) => (
                <div key={f.id} className="flex items-center gap-4 py-1.5">
                  <div className="w-6 h-6 rounded-full border border-border bg-muted" />
                  <span className="font-body text-sm flex-1">{f.name_en}</span>
                  {f.surcharge_pct > 0 && (
                    <span className="font-body text-xs text-muted-foreground">+{f.surcharge_pct}%</span>
                  )}
                  <label className="flex items-center gap-1.5 font-body text-sm">
                    <Checkbox
                      checked={f.enabled}
                      onCheckedChange={(v) => toggleFinishEnabled.mutate({ id: f.id, enabled: !!v })}
                    />
                    Enabled
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setFinishEditId(f.id);
                      setFinishForSubtype(f.subtype_id);
                      setFinishForm({ name_en: f.name_en, name_he: f.name_he, surcharge_pct: f.surcharge_pct, sort_order: f.sort_order, thumbnail_url: f.thumbnail_url || "" });
                      setFinishDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Subtype button */}
        <Button
          variant="outline"
          className="font-body"
          onClick={() => {
            setSubtypeEditId(null);
            setSubtypeForm({ name_en: "", name_he: "", description_en: "", thickness_mm: 0, sort_order: 0, pack_width_cm: 0, pack_height_cm: 0, pack_depth_cm: 0, pack_weight_kg: 0, thumbnail_url: "" });
            setSubtypeDialogOpen(true);
          }}
        >
          + Add Subtype
        </Button>

      {/* Subtype Dialog */}
      <Dialog open={subtypeDialogOpen} onOpenChange={setSubtypeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{subtypeEditId ? "Edit" : "New"} Subtype</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveSubtype.mutate(); }} className="space-y-4">
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Name (English)</Label><Input value={subtypeForm.name_en} onChange={(e) => setSubtypeForm({ ...subtypeForm, name_en: e.target.value })} required /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Name (Hebrew)</Label><Input value={subtypeForm.name_he} onChange={(e) => setSubtypeForm({ ...subtypeForm, name_he: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Thickness (mm)</Label><Input type="number" value={subtypeForm.thickness_mm} onChange={(e) => setSubtypeForm({ ...subtypeForm, thickness_mm: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={subtypeForm.sort_order} onChange={(e) => setSubtypeForm({ ...subtypeForm, sort_order: +e.target.value })} /></div>
            </div>
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2">Shipping Data</p>
            <p className="font-body text-xs text-muted-foreground italic">Enter estimated packed dimensions (L×W×H in cm) and weight (kg) for reference sizes. For production use, connect to your shipping calculator API.</p>
            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Width (cm)</Label><Input type="number" step="0.1" value={subtypeForm.pack_width_cm} onChange={(e) => setSubtypeForm({ ...subtypeForm, pack_width_cm: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</Label><Input type="number" step="0.1" value={subtypeForm.pack_height_cm} onChange={(e) => setSubtypeForm({ ...subtypeForm, pack_height_cm: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Depth (cm)</Label><Input type="number" step="0.1" value={subtypeForm.pack_depth_cm} onChange={(e) => setSubtypeForm({ ...subtypeForm, pack_depth_cm: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</Label><Input type="number" step="0.1" value={subtypeForm.pack_weight_kg} onChange={(e) => setSubtypeForm({ ...subtypeForm, pack_weight_kg: +e.target.value })} /></div>
            </div>
            <ThumbnailUpload
              value={subtypeForm.thumbnail_url}
              onChange={(url) => setSubtypeForm({ ...subtypeForm, thumbnail_url: url })}
              folder="subtypes"
              label="Thumbnail"
            />
            <Button type="submit" className="w-full" disabled={saveSubtype.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Finish Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{finishEditId ? "Edit" : "New"} Finish</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveFinish.mutate(); }} className="space-y-4">
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Name (English)</Label><Input value={finishForm.name_en} onChange={(e) => setFinishForm({ ...finishForm, name_en: e.target.value })} required /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 block">Name (Hebrew)</Label><Input value={finishForm.name_he} onChange={(e) => setFinishForm({ ...finishForm, name_he: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Surcharge (%)</Label><Input type="number" value={finishForm.surcharge_pct} onChange={(e) => setFinishForm({ ...finishForm, surcharge_pct: +e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label><Input type="number" value={finishForm.sort_order} onChange={(e) => setFinishForm({ ...finishForm, sort_order: +e.target.value })} /></div>
            </div>
            <ThumbnailUpload
              value={finishForm.thumbnail_url}
              onChange={(url) => setFinishForm({ ...finishForm, thumbnail_url: url })}
              folder="finishes"
              label="Thumbnail"
            />
            <Button type="submit" className="w-full" disabled={saveFinish.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Inline editable price tier row */
function PriceTierRow({ tier, onSave }: { tier: any; onSave: (u: Record<string, any>) => void }) {
  const [threshold, setThreshold] = useState(tier.tier_threshold_sqm);
  const [price1, setPrice1] = useState(tier.tier1_price_sqm);
  const [price2, setPrice2] = useState(tier.tier2_price_sqm);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2 font-body text-sm">
      <span className="text-muted-foreground">Up to</span>
      <Input
        type="number"
        step="0.01"
        className="w-20 h-8 text-sm"
        value={threshold}
        onChange={(e) => setThreshold(+e.target.value)}
        onBlur={() => onSave({ tier_threshold_sqm: threshold })}
      />
      <span className="text-muted-foreground">sqm →</span>
      <Input
        type="number"
        className="w-24 h-8 text-sm"
        value={price1}
        onChange={(e) => setPrice1(+e.target.value)}
        onBlur={() => onSave({ tier1_price_sqm: price1 })}
      />
      <span className="text-muted-foreground">ILS/sqm</span>
      <span className="text-muted-foreground ml-2">| Above →</span>
      <Input
        type="number"
        className="w-24 h-8 text-sm"
        value={price2}
        onChange={(e) => setPrice2(+e.target.value)}
        onBlur={() => onSave({ tier2_price_sqm: price2 })}
      />
      <span className="text-muted-foreground">ILS/sqm</span>
    </div>
  );
}

export default AdminProductDetail;
