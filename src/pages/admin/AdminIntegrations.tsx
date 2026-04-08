import { useState, useEffect } from "react";
import VariantMappingsManager from "@/components/admin/VariantMappingsManager";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Send, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatILS } from "@/lib/pricing";
import { getSafeErrorMessage } from "@/lib/error-messages";

const AdminIntegrations = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["shopify-config"],
    queryFn: async () => {
      const { data } = await supabase.from("shopify_config").select("*").limit(1).single();
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-for-sync"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const [storeDomain, setStoreDomain] = useState("");
  const [apiVersion, setApiVersion] = useState("2024-01");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const [prevConfig, setPrevConfig] = useState<typeof config>(null);
  if (config && config !== prevConfig) {
    setPrevConfig(config);
    setStoreDomain(config.store_domain);
    setApiVersion(config.api_version);
    setEnabled(config.enabled);
    setClientId((config as any).client_id || "");
    setClientSecret((config as any).client_secret || "");
  }

  const hasToken = !!(config as any)?.admin_api_token;

  // Listen for OAuth success from popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "shopify-oauth-success") {
        toast({ title: "Shopify authorized!", description: "Access token saved successfully." });
        qc.invalidateQueries({ queryKey: ["shopify-config"] });
        setAuthorizing(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [toast, qc]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (!config) return;
      const updatePayload: Record<string, unknown> = {
        store_domain: storeDomain.trim(),
        api_version: apiVersion.trim(),
        enabled,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("shopify_config")
        .update(updatePayload as any)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopify-config"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const handleAuthorize = async () => {
    setAuthorizing(true);
    setAuthUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-oauth", {
        body: {},
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to initiate OAuth");

      // Show the URL for the user to click (popups are blocked from iframes)
      setAuthUrl(data.auth_url);
      setAuthorizing(false);
    } catch (e: any) {
      toast({ title: "Authorization failed", description: getSafeErrorMessage(e), variant: "destructive" });
      setAuthorizing(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: { action: "test" },
      });
      if (error) throw error;
      if (data?.success) {
        setTestStatus("success");
        toast({ title: "Connection successful", description: `Store: ${data.shop?.name || storeDomain}` });
      } else {
        throw new Error(data?.error || "Connection failed");
      }
    } catch (e: any) {
      setTestStatus("error");
      toast({ title: "Connection failed", description: getSafeErrorMessage(e), variant: "destructive" });
    }
  };

  const handleSyncOrder = async (orderId: string) => {
    setSyncingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: { action: "create_order", orderId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Sync failed");
      toast({ title: "Order synced", description: "Shopify draft order created" });
      qc.invalidateQueries({ queryKey: ["admin-orders-for-sync"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) {
      toast({ title: "Sync failed", description: getSafeErrorMessage(e), variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-foreground">Integrations</h1>

      {/* Shopify Connection */}
      <section className="border border-border rounded-lg p-6 bg-card space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg text-foreground">Shopify Store Connection</h2>
          {enabled && <Badge variant="default" className="bg-green-600">Active</Badge>}
          {!enabled && <Badge variant="secondary">Disabled</Badge>}
        </div>

        <div className="grid gap-4 max-w-md">
          <div>
            <Label className="font-body text-sm">Store Domain</Label>
            <Input
              placeholder="your-store.myshopify.com"
              value={storeDomain}
              onChange={(e) => setStoreDomain(e.target.value)}
              className="font-body"
            />
            <p className="text-xs text-muted-foreground mt-1">e.g. or-many-fine-art-printing.myshopify.com</p>
          </div>

          <div>
            <Label className="font-body text-sm">API Version</Label>
            <Input
              placeholder="2024-01"
              value={apiVersion}
              onChange={(e) => setApiVersion(e.target.value)}
              className="font-body"
            />
          </div>

          <div>
            <Label className="font-body text-sm">Client ID (API Key)</Label>
            <Input
              placeholder="Paste from Shopify Partners → App → Client credentials"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="font-body font-mono text-sm"
            />
          </div>

          <div>
            <Label className="font-body text-sm">Client Secret</Label>
            <div className="flex gap-2">
              <Input
                type={showSecret ? "text" : "password"}
                placeholder="shpss_xxxxxxxxxxxxx"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="font-body font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-body shrink-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From Shopify Partners → Your App → Client credentials → Client secret
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label className="font-body text-sm">Enable Shopify sync</Label>
          </div>
        </div>

        {/* Auth status */}
        <div className="flex items-center gap-2 text-sm font-body">
          <span className="text-muted-foreground">Access Token:</span>
          {hasToken ? (
            <Badge variant="default" className="bg-green-600">Authorized ✓</Badge>
          ) : (
            <Badge variant="secondary">Not authorized</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending} className="font-body">
            {saveConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
          <Button
            variant="default"
            onClick={handleAuthorize}
            disabled={authorizing || !clientId.trim() || !storeDomain.trim()}
            className="font-body gap-1.5"
          >
            {authorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {hasToken ? "Re-authorize with Shopify" : "Authorize with Shopify"}
          </Button>
          <Button variant="outline" onClick={handleTestConnection} disabled={testStatus === "loading" || !hasToken} className="font-body">
            {testStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {testStatus === "success" && <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />}
            {testStatus === "error" && <XCircle className="h-4 w-4 text-destructive mr-2" />}
            Test Connection
          </Button>
        </div>

        {authUrl && (
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
            <p className="text-sm font-body font-medium text-foreground">
              👉 Copy the URL below and paste it in a <strong>new browser tab</strong> (not inside Lovable preview):
            </p>
            <div className="flex gap-2 items-start">
              <code className="text-xs font-mono text-primary bg-muted p-2 rounded break-all flex-1 select-all">
                {authUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 font-body"
                onClick={() => {
                  navigator.clipboard.writeText(authUrl);
                  toast({ title: "Copied!", description: "Paste this URL in a new browser tab." });
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              After approving on Shopify, return here and refresh the page to see the updated status.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground font-body">
          <strong>How it works:</strong> Save your Client ID & Secret, then click "Authorize with Shopify". 
          A link will appear — click it to approve the app on Shopify. Once approved, the access token is stored automatically.
        </p>
      </section>

      {/* Order Sync */}
      <section className="border border-border rounded-lg p-6 bg-card space-y-4">
        <h2 className="font-display text-lg text-foreground">Order Sync</h2>
        <p className="text-sm text-muted-foreground font-body">Push orders to Shopify as draft orders. Orders already synced will show their Shopify ID.</p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shopify</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders yet</TableCell>
              </TableRow>
            )}
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="text-muted-foreground font-body text-sm">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-body font-medium">{o.customer_name ?? "-"}</TableCell>
                <TableCell className="font-body">{formatILS(o.total_price_ils)}</TableCell>
                <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                <TableCell className="font-body text-sm">
                  {o.shopify_order_id ? (
                    <Badge variant="default" className="bg-green-600">{o.shopify_order_id}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Not synced</span>
                  )}
                </TableCell>
                <TableCell>
                  {!o.shopify_order_id && o.status !== "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-body gap-1.5"
                      disabled={syncingId === o.id || !enabled}
                      onClick={() => handleSyncOrder(o.id)}
                    >
                      {syncingId === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Sync
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Variant Mappings */}
      <VariantMappingsManager />
    </div>
  );
};

export default AdminIntegrations;
