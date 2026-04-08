import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { FileText, Trash2, Info, ExternalLink } from "lucide-react";

type HSCode = {
  id: string;
  product_id: string;
  code: string;
  description: string | null;
  country_of_origin: string;
  material_composition: string | null;
};

type Product = {
  id: string;
  name_en: string;
  slug: string;
};

const emptyForm = {
  product_id: "",
  code: "",
  description: "",
  country_of_origin: "IL",
  material_composition: "",
};

const AdminHSCodes = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [productFilter, setProductFilter] = useState<string>("all");

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name_en, slug")
        .order("name_en");
      return (data ?? []) as Product[];
    },
  });

  const { data: hsCodes = [] } = useQuery({
    queryKey: ["admin-hs-codes"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("hs_codes")
        .select("*, products(name_en)")
        .order("code");
      return (data ?? []) as (HSCode & { products: { name_en: string } | null })[];
    },
  });

  const filtered = useMemo(
    () => productFilter === "all" ? hsCodes : hsCodes.filter((h) => h.product_id === productFilter),
    [hsCodes, productFilter]
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        product_id: form.product_id,
        code: form.code.trim(),
        description: form.description?.trim() || null,
        country_of_origin: form.country_of_origin.toUpperCase().trim(),
        material_composition: form.material_composition?.trim() || null,
      };
      if (editId) {
        const { error } = await (supabase as any).from("hs_codes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("hs_codes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hs-codes"] });
      setOpen(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("hs_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hs-codes"] });
      toast({ title: "HS code deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openEdit = (h: HSCode & { products: { name_en: string } | null }) => {
    setEditId(h.id);
    setForm({
      product_id: h.product_id,
      code: h.code,
      description: h.description ?? "",
      country_of_origin: h.country_of_origin,
      material_composition: h.material_composition ?? "",
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({
      ...emptyForm,
      product_id: productFilter !== "all" ? productFilter : (products[0]?.id ?? ""),
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-gold">HS Codes</h1>
        <Button variant="outline" onClick={openNew} disabled={products.length === 0}>+ Add HS Code</Button>
      </div>

      {/* Info panel */}
      <div className="border border-border rounded-md p-4 bg-secondary/30 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-gold mt-0.5 shrink-0" />
          <div>
            <p className="font-body text-xs text-muted-foreground mb-2">
              The Harmonized System (HS) is an internationally standardized system of names and numbers to classify
              traded products. HS codes are required on customs declarations for international shipments. Each product
              should have an HS code matching its material composition and intended use.
            </p>
            <a
              href="https://www.trade.gov/harmonized-system-hs-codes"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-xs text-gold hover:underline inline-flex items-center gap-1"
            >
              HS Code Lookup Reference <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Product filter */}
      <div className="mb-6 flex items-center gap-2">
        <span className="font-body text-xs text-muted-foreground">Filter by product:</span>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-56 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="font-body text-xs text-muted-foreground ml-2">
          {filtered.length} code{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>HS Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Material</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="font-display text-sm font-medium">
                {h.products?.name_en ?? "Unknown"}
              </TableCell>
              <TableCell className="font-body text-sm font-mono font-medium">{h.code}</TableCell>
              <TableCell className="font-body text-xs text-muted-foreground max-w-[250px] truncate">
                {h.description || "-"}
              </TableCell>
              <TableCell className="font-body text-sm">{h.country_of_origin}</TableCell>
              <TableCell className="font-body text-xs text-muted-foreground max-w-[200px] truncate">
                {h.material_composition || "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEdit(h)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this HS code entry?")) {
                        remove.mutate(h.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-body text-sm text-muted-foreground">
                  {productFilter !== "all" ? "No HS codes for this product." : "No HS codes defined yet."}
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Edit" : "New"} HS Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Product</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">HS Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. 4911.91.00"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Country of Origin</Label>
                <Input
                  value={form.country_of_origin}
                  onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })}
                  placeholder="e.g. IL"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description for customs declaration"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Material Composition</Label>
              <Textarea
                value={form.material_composition}
                onChange={(e) => setForm({ ...form, material_composition: e.target.value })}
                placeholder="e.g. Aluminum panel with polymer coating, UV-printed photographic reproduction"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={save.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHSCodes;
