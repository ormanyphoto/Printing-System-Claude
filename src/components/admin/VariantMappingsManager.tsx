import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Copy, Download, Upload, Zap, Eye, PlayCircle, PauseCircle, RotateCcw, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSafeErrorMessage } from "@/lib/error-messages";

/** Build mapping key the same way the edge function does */
function buildMappingKey(sel: Record<string, string | boolean | undefined>): string {
  const parts = [
    sel.productId || "",
    sel.subtypeId || "",
    sel.sizeId || "",
    sel.finishId || "",
    sel.frameStyleId || "",
    sel.frameColorId || "",
    sel.frameWidthId || "",
    sel.glazingId || "",
    sel.subframeId || "",
    sel.canvasEdgeWrapId || "",
    sel.addFrame ? "frame" : "noframe",
  ];
  return parts.join("|");
}

const NONE = "__none__";

interface SyncJobState {
  jobId: string | null;
  status: "idle" | "starting" | "running" | "paused" | "completed" | "error";
  total: number;
  syncedCount: number;
  processedBatches: number;
  totalBatches: number;
  skipped: number;
  errors: string[];
}

const initialJobState: SyncJobState = {
  jobId: null,
  status: "idle",
  total: 0,
  syncedCount: 0,
  processedBatches: 0,
  totalBatches: 0,
  skipped: 0,
  errors: [],
};

const VariantMappingsManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef(false);

  // Form state
  const [productId, setProductId] = useState("");
  const [subtypeId, setSubtypeId] = useState(NONE);
  const [sizeId, setSizeId] = useState(NONE);
  const [finishId, setFinishId] = useState(NONE);
  const [frameStyleId, setFrameStyleId] = useState(NONE);
  const [frameColorId, setFrameColorId] = useState(NONE);
  const [frameWidthId, setFrameWidthId] = useState(NONE);
  const [glazingId, setGlazingId] = useState(NONE);
  const [subframeId, setSubframeId] = useState(NONE);
  const [canvasEdgeWrapId, setCanvasEdgeWrapId] = useState(NONE);
  const [addFrame, setAddFrame] = useState(false);
  const [shopifyVariantId, setShopifyVariantId] = useState("");

  // Generate state
  const [previewing, setPreviewing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCombinations, setPreviewCombinations] = useState<any[]>([]);
  const [generateProductId, setGenerateProductId] = useState("");
  const [importing, setImporting] = useState(false);

  // Batched sync job state
  const [syncJob, setSyncJob] = useState<SyncJobState>(initialJobState);

  // Data queries
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: subtypes = [] } = useQuery({
    queryKey: ["admin-subtypes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("product_subtypes").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["admin-sizes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("size_presets").select("*").order("width_cm");
      return data ?? [];
    },
  });

  const { data: finishes = [] } = useQuery({
    queryKey: ["admin-finishes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("finishes").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: frameStyles = [] } = useQuery({
    queryKey: ["admin-frame-styles-all"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_styles").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: frameColors = [] } = useQuery({
    queryKey: ["admin-frame-colors-all"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_colors").select("*");
      return data ?? [];
    },
  });

  const { data: frameWidths = [] } = useQuery({
    queryKey: ["admin-frame-widths-all"],
    queryFn: async () => {
      const { data } = await supabase.from("frame_widths").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: glazingOptions = [] } = useQuery({
    queryKey: ["admin-glazing-all"],
    queryFn: async () => {
      const { data } = await supabase.from("glazing_options").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: subframes = [] } = useQuery({
    queryKey: ["admin-subframes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("subframe_options").select("*");
      return data ?? [];
    },
  });

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["variant-mappings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shopify_variant_mappings" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shopify_variant_mappings" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-mappings"] });
      toast({ title: "Mapping deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("shopify_variant_mappings" as any).update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["variant-mappings"] }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!productId || !shopifyVariantId.trim()) throw new Error("Product and Shopify Variant ID are required");
      const sel = {
        productId,
        subtypeId: subtypeId === NONE ? "" : subtypeId,
        sizeId: sizeId === NONE ? "" : sizeId,
        finishId: finishId === NONE ? "" : finishId,
        frameStyleId: frameStyleId === NONE ? "" : frameStyleId,
        frameColorId: frameColorId === NONE ? "" : frameColorId,
        frameWidthId: frameWidthId === NONE ? "" : frameWidthId,
        glazingId: glazingId === NONE ? "" : glazingId,
        subframeId: subframeId === NONE ? "" : subframeId,
        canvasEdgeWrapId: canvasEdgeWrapId === NONE ? "" : canvasEdgeWrapId,
        addFrame,
      };
      const mappingKey = buildMappingKey(sel);
      const row: Record<string, any> = {
        product_id: productId,
        shopify_variant_id: shopifyVariantId.trim(),
        mapping_key: mappingKey,
        add_frame: addFrame,
        enabled: true,
      };
      if (subtypeId !== NONE) row.subtype_id = subtypeId;
      if (sizeId !== NONE) row.size_id = sizeId;
      if (finishId !== NONE) row.finish_id = finishId;
      if (frameStyleId !== NONE) row.frame_style_id = frameStyleId;
      if (frameColorId !== NONE) row.frame_color_id = frameColorId;
      if (frameWidthId !== NONE) row.frame_width_id = frameWidthId;
      if (glazingId !== NONE) row.glazing_id = glazingId;
      if (subframeId !== NONE) row.subframe_id = subframeId;
      if (canvasEdgeWrapId !== NONE) row.canvas_edge_wrap_id = canvasEdgeWrapId;

      const { error } = await supabase.from("shopify_variant_mappings" as any).insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-mappings"] });
      toast({ title: "Mapping created" });
      setShopifyVariantId("");
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // ── Preview ──
  const handlePreview = async () => {
    setPreviewing(true);
    setPreviewCount(null);
    setPreviewCombinations([]);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-generate-variants", {
        body: { action: "preview", productId: generateProductId || undefined },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Preview failed");
      setPreviewCount(data.total);
      setPreviewCombinations(data.combinations ?? []);
      toast({
        title: `${data.total} combinations found`,
        description: `Showing first ${Math.min(data.combinations?.length ?? 0, data.total)} of ${data.total}.`,
      });
    } catch (e: any) {
      toast({ title: "Preview failed", description: getSafeErrorMessage(e), variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  // ── Batched Generate: process one batch then continue ──
  const processBatch = useCallback(async (currentJobId: string) => {
    if (pauseRef.current) {
      setSyncJob(prev => ({ ...prev, status: "paused" }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("shopify-generate-variants", {
        body: { action: "generate_batch", jobId: currentJobId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Batch failed");

      const newErrors = data.errors_this_call || [];
      setSyncJob(prev => ({
        ...prev,
        syncedCount: data.synced_count,
        processedBatches: data.processed_batches,
        totalBatches: data.total_batches,
        total: data.total,
        errors: [...prev.errors, ...newErrors],
        status: data.is_complete ? "completed" : "running",
      }));

      if (data.is_complete) {
        toast({ title: "Sync completed!", description: `${data.synced_count} variants synced to Shopify.` });
        qc.invalidateQueries({ queryKey: ["variant-mappings"] });
      } else if (!pauseRef.current) {
        // Continue with next batch after a short delay
        setTimeout(() => processBatch(currentJobId), 500);
      }
    } catch (e: any) {
      const safeMsg = getSafeErrorMessage(e);
      setSyncJob(prev => ({ ...prev, status: "error", errors: [...prev.errors, safeMsg] }));
      toast({ title: "Sync error", description: safeMsg, variant: "destructive" });
    }
  }, [toast, qc]);

  // ── Start generate ──
  const handleGenerateStart = async () => {
    if (!confirm(
      `This will create Shopify products and variants for ${generateProductId ? "the selected product" : "ALL products"}. Already-synced variants will be skipped. Continue?`
    )) return;

    pauseRef.current = false;
    setSyncJob({ ...initialJobState, status: "starting" });

    try {
      const { data, error } = await supabase.functions.invoke("shopify-generate-variants", {
        body: { action: "generate_start", productId: generateProductId || undefined },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Start failed");

      if (!data.job_id) {
        // All already synced
        toast({ title: data.message || "All variants already synced" });
        setSyncJob({ ...initialJobState, status: "completed", total: data.total, skipped: data.skipped });
        return;
      }

      setSyncJob(prev => ({
        ...prev,
        jobId: data.job_id,
        total: data.new_count,
        skipped: data.skipped,
        status: "running",
      }));

      toast({ title: `Starting sync: ${data.new_count} new variants`, description: `${data.skipped} already synced, skipped.` });

      // Start processing batches
      setTimeout(() => processBatch(data.job_id), 300);
    } catch (e: any) {
      const safeMsg = getSafeErrorMessage(e);
      setSyncJob(prev => ({ ...prev, status: "error", errors: [safeMsg] }));
      toast({ title: "Start failed", description: safeMsg, variant: "destructive" });
    }
  };

  const handlePause = () => {
    pauseRef.current = true;
    setSyncJob(prev => ({ ...prev, status: "paused" }));
  };

  const handleResume = () => {
    if (!syncJob.jobId) return;
    pauseRef.current = false;
    setSyncJob(prev => ({ ...prev, status: "running" }));
    processBatch(syncJob.jobId);
  };

  const handleReset = () => {
    pauseRef.current = true;
    setSyncJob(initialJobState);
  };

  const progressPct = syncJob.totalBatches > 0
    ? Math.round((syncJob.processedBatches / syncJob.totalBatches) * 100)
    : 0;

  // ── CSV Export ──
  const handleExportCSV = () => {
    if (mappings.length === 0) {
      toast({ title: "No mappings to export" });
      return;
    }
    const headers = [
      "mapping_key", "shopify_variant_id", "product_id", "subtype_id", "size_id",
      "finish_id", "frame_style_id", "frame_color_id", "frame_width_id", "glazing_id",
      "subframe_id", "canvas_edge_wrap_id", "add_frame", "enabled",
    ];
    const rows = mappings.map((m: any) =>
      headers.map((h) => {
        const val = m[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "boolean") return val ? "true" : "false";
        return String(val).includes(",") ? `"${val}"` : String(val);
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `variant-mappings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  // ── CSV Import ──
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
      const headers = lines[0].split(",").map((h) => h.trim());
      const requiredHeaders = ["mapping_key", "shopify_variant_id", "product_id"];
      for (const rh of requiredHeaders) {
        if (!headers.includes(rh)) throw new Error(`Missing required column: ${rh}`);
      }
      const rows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          const val = values[idx] || "";
          if (h === "add_frame") row[h] = val === "true";
          else if (h === "enabled") row[h] = val !== "false";
          else if (["subtype_id", "size_id", "finish_id", "frame_style_id", "frame_color_id", "frame_width_id", "glazing_id", "subframe_id", "canvas_edge_wrap_id"].includes(h)) row[h] = val || null;
          else row[h] = val;
        });
        if (row.mapping_key && row.shopify_variant_id && row.product_id) rows.push(row);
      }
      if (rows.length === 0) throw new Error("No valid rows found in CSV");
      let inserted = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from("shopify_variant_mappings" as any).upsert(batch, { onConflict: "mapping_key" });
        if (error) throw error;
        inserted += batch.length;
      }
      toast({ title: `Imported ${inserted} mappings from CSV` });
      qc.invalidateQueries({ queryKey: ["variant-mappings"] });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const productName = (id: string) => products.find((p) => p.id === id)?.name_en ?? id.slice(0, 8);

  const refreshPauseRef = useRef(false);
  const [refreshJob, setRefreshJob] = useState<{
    status: "idle" | "starting" | "running" | "paused" | "completed" | "error";
    jobId: string | null;
    total: number;
    updated: number;
    skipped: number;
    processed: number;
    errors: string[];
    updatedVariants: { vid: string; title: string; price: string }[];
  }>({
    status: "idle", jobId: null, total: 0, updated: 0, skipped: 0, processed: 0, errors: [], updatedVariants: [],
  });

  const pollRefreshStatus = useCallback(async (jId: string) => {
    if (refreshPauseRef.current) {
      setRefreshJob(prev => ({ ...prev, status: "paused" }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("shopify-generate-variants", {
        body: { action: "job_status", jobId: jId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Status check failed");

      const job = data.job;
      const isComplete = job.status === "completed";
      const isPaused = job.status === "paused";
      const errorLog = (job.error_log as string[]) || [];

      setRefreshJob(prev => ({
        ...prev,
        updated: job.synced_count,
        processed: job.last_batch_index,
        total: job.total_combinations,
        errors: errorLog,
        status: isComplete ? "completed" : isPaused ? "paused" : "running",
      }));

      if (isComplete) {
        toast({ title: "Prices refreshed!", description: `${job.synced_count} of ${job.total_combinations} Shopify variants updated.` });
      } else if (!isPaused && !refreshPauseRef.current) {
        // Poll again in 3 seconds — the server is doing the work
        setTimeout(() => pollRefreshStatus(jId), 3000);
      }
    } catch (e: any) {
      const safeMsg = getSafeErrorMessage(e);
      setRefreshJob(prev => ({ ...prev, status: "error", errors: [...prev.errors, safeMsg] }));
      toast({ title: "Status check error", description: safeMsg, variant: "destructive" });
    }
  }, [toast]);

  const handleRefreshPrices = async () => {
    if (!confirm(
      `This will recalculate prices for ${generateProductId ? "the selected product" : "ALL products"} and update all existing Shopify variants. Continue?`
    )) return;

    refreshPauseRef.current = false;
    setRefreshJob({ status: "starting", jobId: null, total: 0, updated: 0, skipped: 0, processed: 0, errors: [], updatedVariants: [] });
    try {
      const { data, error } = await supabase.functions.invoke("shopify-generate-variants", {
        body: { action: "refresh_prices_start", productId: generateProductId || undefined },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Start failed");

      if (!data.job_id) {
        toast({ title: data.message || "No variants to update" });
        setRefreshJob(prev => ({ ...prev, status: "completed" }));
        return;
      }

      setRefreshJob(prev => ({ ...prev, jobId: data.job_id, total: data.total, status: "running" }));
      toast({ title: `Refreshing prices for ${data.total} variants… (runs in background — you can close this page)` });
      // Kick off the first batch, then the server self-continues
      await supabase.functions.invoke("shopify-generate-variants", {
        body: { action: "refresh_prices_batch", jobId: data.job_id },
      });
      // Start polling for status
      setTimeout(() => pollRefreshStatus(data.job_id), 3000);
    } catch (e: any) {
      const safeMsg = getSafeErrorMessage(e);
      setRefreshJob(prev => ({ ...prev, status: "error", errors: [safeMsg] }));
      toast({ title: "Start failed", description: safeMsg, variant: "destructive" });
    }
  };

  const refreshingPrices = refreshJob.status === "starting" || refreshJob.status === "running";
  const refreshPaused = refreshJob.status === "paused";
  const refreshPct = refreshJob.total > 0 ? Math.round((refreshJob.processed / refreshJob.total) * 100) : 0;

  const handleRefreshPause = async () => {
    refreshPauseRef.current = true;
    setRefreshJob(prev => ({ ...prev, status: "paused" }));
    // Tell the server to stop after current batch
    if (refreshJob.jobId) {
      await supabase.from("shopify_sync_jobs").update({ status: "paused" }).eq("id", refreshJob.jobId);
    }
  };

  const handleRefreshResume = async () => {
    if (!refreshJob.jobId) return;
    refreshPauseRef.current = false;
    setRefreshJob(prev => ({ ...prev, status: "running" }));
    // Re-kick a batch (server will self-continue), then poll
    await supabase.functions.invoke("shopify-generate-variants", {
      body: { action: "refresh_prices_batch", jobId: refreshJob.jobId },
    });
    setTimeout(() => pollRefreshStatus(refreshJob.jobId!), 3000);
  };

  const handleRefreshReset = () => {
    refreshPauseRef.current = true;
    setRefreshJob({ status: "idle", jobId: null, total: 0, updated: 0, skipped: 0, processed: 0, errors: [], updatedVariants: [] });
  };

  const isGenerating = syncJob.status === "starting" || syncJob.status === "running";

  return (
    <section className="border border-border rounded-lg p-6 bg-card space-y-5">
      <h2 className="font-display text-lg text-foreground">Cart Variant Mappings</h2>
      <p className="text-sm text-muted-foreground font-body">
        Map each product configuration to a pre-created Shopify variant ID. When a customer clicks "Add to Cart", the system looks up the matching variant and adds it to the Shopify cart.
      </p>

      {/* ── Generate & Sync Section ── */}
      <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-3">
        <h3 className="font-body font-medium text-sm text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Auto-Generate Variants
        </h3>
        <p className="text-xs text-muted-foreground font-body">
          Automatically generate all possible product combinations, create Shopify products &amp; variants, and add them to the "Uploader" collection. Already-synced variants are skipped.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[200px]">
            <Label className="text-xs">Product (or All)</Label>
            <Select value={generateProductId || "__all__"} onValueChange={(v) => setGenerateProductId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="font-body text-sm">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewing || isGenerating}
            className="font-body gap-1.5"
          >
            {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview Combinations
          </Button>

          {syncJob.status === "idle" || syncJob.status === "completed" || syncJob.status === "error" ? (
            <Button
              onClick={handleGenerateStart}
              disabled={isGenerating}
              className="font-body gap-1.5"
            >
              <Zap className="h-4 w-4" />
              Generate &amp; Sync to Shopify
            </Button>
          ) : null}

          {(syncJob.status === "idle" || syncJob.status === "completed" || syncJob.status === "error") && refreshJob.status === "idle" && (
            <Button
              variant="outline"
              onClick={handleRefreshPrices}
              disabled={refreshingPrices || isGenerating}
              className="font-body gap-1.5"
            >
              {refreshingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Prices
            </Button>
          )}

          {refreshJob.status === "running" && (
            <Button variant="outline" onClick={handleRefreshPause} className="font-body gap-1.5">
              <PauseCircle className="h-4 w-4" />
              Pause Refresh
            </Button>
          )}

          {refreshJob.status === "paused" && (
            <>
              <Button onClick={handleRefreshResume} className="font-body gap-1.5">
                <PlayCircle className="h-4 w-4" />
                Resume Refresh
              </Button>
              <Button variant="ghost" onClick={handleRefreshReset} className="font-body gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}

          {(refreshJob.status === "completed" || refreshJob.status === "error") && (
            <Button variant="ghost" onClick={handleRefreshReset} className="font-body gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Clear Refresh
            </Button>
          )}

          {syncJob.status === "running" && (
            <Button variant="outline" onClick={handlePause} className="font-body gap-1.5">
              <PauseCircle className="h-4 w-4" />
              Pause
            </Button>
          )}

          {syncJob.status === "paused" && (
            <>
              <Button onClick={handleResume} className="font-body gap-1.5">
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
              <Button variant="ghost" onClick={handleReset} className="font-body gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Progress indicator */}
        {syncJob.status !== "idle" && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
              <span>
                {syncJob.status === "starting" && "Preparing sync job…"}
                {syncJob.status === "running" && `Syncing batch ${syncJob.processedBatches} of ${syncJob.totalBatches}…`}
                {syncJob.status === "paused" && `Paused at batch ${syncJob.processedBatches} of ${syncJob.totalBatches}`}
                {syncJob.status === "completed" && "Sync completed!"}
                {syncJob.status === "error" && "Sync stopped due to error"}
              </span>
              <span>
                {syncJob.syncedCount} synced
                {syncJob.skipped > 0 && ` · ${syncJob.skipped} skipped`}
                {syncJob.errors.length > 0 && ` · ${syncJob.errors.length} errors`}
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
            {syncJob.status === "running" && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-body">Processing…</span>
              </div>
            )}
            {syncJob.errors.length > 0 && (
              <details className="text-xs text-destructive font-mono">
                <summary className="cursor-pointer font-body text-destructive">
                  {syncJob.errors.length} error(s) — click to expand
                </summary>
                <div className="mt-1 max-h-32 overflow-auto bg-destructive/5 p-2 rounded">
                  {syncJob.errors.map((err, i) => (
                    <div key={i} className="py-0.5">{err}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Refresh Prices Progress */}
        {refreshJob.status !== "idle" && (
          <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
            <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingPrices ? "animate-spin text-primary" : ""}`} />
                {refreshJob.status === "starting" && "Preparing price refresh…"}
                {refreshJob.status === "running" && `Updating prices: ${refreshJob.processed} of ${refreshJob.total}…`}
                {refreshJob.status === "paused" && `Paused at ${refreshJob.processed} of ${refreshJob.total}`}
                {refreshJob.status === "completed" && "Price refresh completed!"}
                {refreshJob.status === "error" && "Price refresh stopped due to error"}
              </span>
              <span>
                {refreshJob.updated} updated
                {refreshJob.skipped > 0 && ` · ${refreshJob.skipped} skipped (unchanged)`}
                {refreshJob.errors.length > 0 && ` · ${refreshJob.errors.length} errors`}
              </span>
            </div>
            <Progress value={refreshPct} className="h-2" />
            {refreshJob.errors.length > 0 && (
              <details className="text-xs text-destructive font-mono">
                <summary className="cursor-pointer font-body text-destructive">
                  {refreshJob.errors.length} error(s) — click to expand
                </summary>
                <div className="mt-1 max-h-32 overflow-auto bg-destructive/5 p-2 rounded">
                  {refreshJob.errors.map((err, i) => (
                    <div key={i} className="py-0.5">{err}</div>
                  ))}
                </div>
              </details>
            )}
            {refreshJob.updatedVariants.length > 0 && (
              <details className="text-xs font-body">
                <summary className="cursor-pointer text-muted-foreground">
                  ✓ {refreshJob.updatedVariants.length} variant(s) updated — click to view
                </summary>
                <div className="mt-1 max-h-[300px] overflow-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Variant</TableHead>
                        <TableHead className="text-xs text-right">New Price</TableHead>
                        <TableHead className="text-xs">Shopify ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refreshJob.updatedVariants.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-body">{v.title}</TableCell>
                          <TableCell className="text-xs font-mono text-right">₪{v.price}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{v.vid}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </details>
            )}
          </div>
        )}

        {previewCount !== null && syncJob.status === "idle" && (
          <div className="space-y-3">
            <Badge variant="secondary" className="font-mono text-xs">
              {previewCount} total combinations
            </Badge>
            {previewCombinations.length > 0 && (
              <div className="max-h-[400px] overflow-auto border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Subtype</TableHead>
                      <TableHead className="text-xs">Size</TableHead>
                      <TableHead className="text-xs">Finish</TableHead>
                      <TableHead className="text-xs">Frame</TableHead>
                      <TableHead className="text-xs">Edge Wrap</TableHead>
                      <TableHead className="text-xs">Mapping Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewCombinations.map((c: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs">{c.productName}</TableCell>
                        <TableCell className="text-xs">{c.subtypeName || "—"}</TableCell>
                        <TableCell className="text-xs">{c.sizeName || "—"}</TableCell>
                        <TableCell className="text-xs">{c.finishName || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {c.addFrame
                            ? `${c.frameStyleName} ${c.frameColorName} ${c.frameWidthName}${c.glazingName ? ` / ${c.glazingName}` : ""}`
                            : c.subframeName ? `SF: ${c.subframeName}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{c.canvasEdgeWrapId || "—"}</TableCell>
                        <TableCell>
                          <code className="text-[10px] text-muted-foreground truncate max-w-[180px] block">{c.mappingKey}</code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewCount > previewCombinations.length && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing {previewCombinations.length} of {previewCount} combinations
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CSV Import/Export ── */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleExportCSV} className="font-body gap-1.5">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="font-body gap-1.5"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Import CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImportCSV}
        />
      </div>

      {/* ── Add new mapping form ── */}
      <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
        <h3 className="font-body font-medium text-sm text-foreground">Manual Mapping</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Product *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subtype</Label>
            <Select value={subtypeId} onValueChange={setSubtypeId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {subtypes.filter((s) => !productId || s.product_id === productId).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Size</Label>
            <Select value={sizeId} onValueChange={setSizeId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {sizes.filter((s) => !productId || s.product_id === productId).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.width_cm}×{s.height_cm}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Finish</Label>
            <Select value={finishId} onValueChange={setFinishId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {finishes.map((f) => <SelectItem key={f.id} value={f.id}>{f.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Frame Style</Label>
            <Select value={frameStyleId} onValueChange={setFrameStyleId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {frameStyles.map((f) => <SelectItem key={f.id} value={f.id}>{f.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Frame Color</Label>
            <Select value={frameColorId} onValueChange={setFrameColorId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {frameColors.map((c) => <SelectItem key={c.id} value={c.id}>{c.color_name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Frame Width</Label>
            <Select value={frameWidthId} onValueChange={setFrameWidthId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {frameWidths.map((w) => <SelectItem key={w.id} value={w.id}>{w.width_cm} cm</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Glazing</Label>
            <Select value={glazingId} onValueChange={setGlazingId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {glazingOptions.map((g) => <SelectItem key={g.id} value={g.id}>{g.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subframe</Label>
            <Select value={subframeId} onValueChange={setSubframeId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {subframes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Canvas Edge Wrap</Label>
            <Select value={canvasEdgeWrapId} onValueChange={setCanvasEdgeWrapId}>
              <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
                <SelectItem value="mirrored">Mirrored</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch checked={addFrame} onCheckedChange={setAddFrame} />
            <Label className="text-xs">Add Frame</Label>
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-xs">Shopify Variant ID *</Label>
            <Input
              placeholder="e.g. 44012345678901"
              value={shopifyVariantId}
              onChange={(e) => setShopifyVariantId(e.target.value)}
              className="font-body font-mono text-sm"
            />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !productId || !shopifyVariantId.trim()} className="font-body gap-1.5">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Mapping
          </Button>
        </div>
      </div>

      {/* ── Existing mappings ── */}
      <div className="flex items-center justify-between">
        <h3 className="font-body font-medium text-sm text-foreground">
          Existing Mappings ({mappings.length})
        </h3>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading mappings…</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Shopify Variant</TableHead>
              <TableHead>Mapping Key</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No mappings yet</TableCell>
              </TableRow>
            )}
            {mappings.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="font-body text-sm">{productName(m.product_id)}</TableCell>
                <TableCell className="font-mono text-xs">{m.shopify_variant_id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-muted-foreground truncate max-w-[200px]">{m.mapping_key}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(m.mapping_key);
                        toast({ title: "Copied!" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={m.enabled}
                    onCheckedChange={(val) => toggleMutation.mutate({ id: m.id, enabled: val })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
};

export default VariantMappingsManager;
