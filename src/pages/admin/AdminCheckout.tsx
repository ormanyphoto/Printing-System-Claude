import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { useState, useEffect } from "react";

interface CheckoutSettings {
  currency: string;
  min_order_amount: number;
  guest_checkout: boolean;
  auto_save_drafts: boolean;
  show_order_notes: boolean;
  require_phone: boolean;
  require_company: boolean;
  require_notes: boolean;
  terms_url: string;
  privacy_url: string;
  refund_policy_en: string;
  refund_policy_he: string;
  order_confirmation_email: boolean;
  admin_notification_email: string;
}

const defaultSettings: CheckoutSettings = {
  currency: "ILS",
  min_order_amount: 0,
  guest_checkout: true,
  auto_save_drafts: true,
  show_order_notes: true,
  require_phone: false,
  require_company: false,
  require_notes: false,
  terms_url: "",
  privacy_url: "",
  refund_policy_en: "",
  refund_policy_he: "",
  order_confirmation_email: true,
  admin_notification_email: "",
};

interface DiscountCodeForm {
  code: string;
  type: string;
  value: number;
  min_order: number;
  max_uses: number;
  valid_from: string;
  valid_until: string;
}

const emptyCodeForm: DiscountCodeForm = {
  code: "",
  type: "percentage",
  value: 0,
  min_order: 0,
  max_uses: 0,
  valid_from: "",
  valid_until: "",
};

const AdminCheckout = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [settings, setSettings] = useState<CheckoutSettings>({ ...defaultSettings });
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeEditId, setCodeEditId] = useState<string | null>(null);
  const [codeForm, setCodeForm] = useState<DiscountCodeForm>({ ...emptyCodeForm });

  // Load checkout settings
  const { data: settingsData } = useQuery({
    queryKey: ["admin-checkout-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("checkout_settings").select("*").limit(1).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setSettings({
        currency: settingsData.currency ?? "ILS",
        min_order_amount: settingsData.min_order_amount ?? 0,
        guest_checkout: settingsData.guest_checkout ?? true,
        auto_save_drafts: settingsData.auto_save_drafts ?? true,
        show_order_notes: settingsData.show_order_notes ?? true,
        require_phone: settingsData.require_phone ?? false,
        require_company: settingsData.require_company ?? false,
        require_notes: settingsData.require_notes ?? false,
        terms_url: settingsData.terms_url ?? "",
        privacy_url: settingsData.privacy_url ?? "",
        refund_policy_en: settingsData.refund_policy_en ?? "",
        refund_policy_he: settingsData.refund_policy_he ?? "",
        order_confirmation_email: settingsData.order_confirmation_email ?? true,
        admin_notification_email: settingsData.admin_notification_email ?? "",
      });
    }
  }, [settingsData]);

  // Save settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("checkout_settings").upsert({
        id: settingsData?.id ?? undefined,
        ...settings,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-checkout-settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  // Discount codes
  const { data: codes = [] } = useQuery({
    queryKey: ["admin-discount-codes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("discount_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveCode = useMutation({
    mutationFn: async () => {
      const payload = {
        code: codeForm.code.toUpperCase(),
        type: codeForm.type,
        value: codeForm.value,
        min_order: codeForm.min_order || null,
        max_uses: codeForm.max_uses || null,
        valid_from: codeForm.valid_from || null,
        valid_until: codeForm.valid_until || null,
      };
      if (codeEditId) {
        const { error } = await (supabase as any).from("discount_codes").update(payload).eq("id", codeEditId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("discount_codes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      setCodeOpen(false);
      toast({ title: codeEditId ? "Code updated" : "Code created" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleCodeEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase as any).from("discount_codes").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-discount-codes"] }),
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("discount_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast({ title: "Code deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const openAddCode = () => {
    setCodeEditId(null);
    setCodeForm({ ...emptyCodeForm });
    setCodeOpen(true);
  };

  const openEditCode = (c: any) => {
    setCodeEditId(c.id);
    setCodeForm({
      code: c.code ?? "",
      type: c.type ?? "percentage",
      value: c.value ?? 0,
      min_order: c.min_order ?? 0,
      max_uses: c.max_uses ?? 0,
      valid_from: c.valid_from ? c.valid_from.slice(0, 10) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : "",
    });
    setCodeOpen(true);
  };

  const updateField = <K extends keyof CheckoutSettings>(key: K, value: CheckoutSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Checkout Settings</h1>
        <Button className="font-body text-sm" disabled={saveSettings.isPending} onClick={() => saveSettings.mutate()}>
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="font-body text-sm">General</TabsTrigger>
          <TabsTrigger value="fields" className="font-body text-sm">Customer Fields</TabsTrigger>
          <TabsTrigger value="policies" className="font-body text-sm">Policies</TabsTrigger>
          <TabsTrigger value="notifications" className="font-body text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="discounts" className="font-body text-sm">Discount Codes</TabsTrigger>
        </TabsList>

        {/* Tab 1: General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Currency</Label>
                <Select value={settings.currency} onValueChange={(v) => updateField("currency", v)}>
                  <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ILS">ILS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Minimum Order Amount</Label>
                <Input
                  type="number"
                  className="h-9 text-sm w-40"
                  value={settings.min_order_amount}
                  onChange={(e) => updateField("min_order_amount", +e.target.value)}
                />
              </div>
              <ToggleRow label="Guest Checkout" checked={settings.guest_checkout} onChange={(v) => updateField("guest_checkout", v)} />
              <ToggleRow label="Auto-save Drafts" checked={settings.auto_save_drafts} onChange={(v) => updateField("auto_save_drafts", v)} />
              <ToggleRow label="Show Order Notes" checked={settings.show_order_notes} onChange={(v) => updateField("show_order_notes", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Customer Fields */}
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Customer Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ToggleRow label="Require Phone" checked={settings.require_phone} onChange={(v) => updateField("require_phone", v)} />
              <ToggleRow label="Require Company" checked={settings.require_company} onChange={(v) => updateField("require_company", v)} />
              <ToggleRow label="Require Notes" checked={settings.require_notes} onChange={(v) => updateField("require_notes", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Policies */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Terms URL</Label>
                <Input className="h-9 text-sm" value={settings.terms_url} onChange={(e) => updateField("terms_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Privacy URL</Label>
                <Input className="h-9 text-sm" value={settings.privacy_url} onChange={(e) => updateField("privacy_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Refund Policy (English)</Label>
                <Textarea className="text-sm font-body" rows={4} value={settings.refund_policy_en} onChange={(e) => updateField("refund_policy_en", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Refund Policy (Hebrew)</Label>
                <Textarea className="text-sm font-body" rows={4} dir="rtl" value={settings.refund_policy_he} onChange={(e) => updateField("refund_policy_he", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ToggleRow label="Order Confirmation Email" checked={settings.order_confirmation_email} onChange={(v) => updateField("order_confirmation_email", v)} />
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Admin Notification Email</Label>
                <Input className="h-9 text-sm" type="email" value={settings.admin_notification_email} onChange={(e) => updateField("admin_notification_email", e.target.value)} placeholder="admin@example.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Discount Codes */}
        <TabsContent value="discounts">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-foreground">Discount Codes</h2>
            <Button variant="outline" className="font-body text-sm" onClick={openAddCode}>+ Add Code</Button>
          </div>

          <div className="border border-border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Code</TableHead>
                  <TableHead className="font-body">Type</TableHead>
                  <TableHead className="font-body">Value</TableHead>
                  <TableHead className="font-body">Min Order</TableHead>
                  <TableHead className="font-body">Uses</TableHead>
                  <TableHead className="font-body">Valid From</TableHead>
                  <TableHead className="font-body">Valid Until</TableHead>
                  <TableHead className="font-body">Enabled</TableHead>
                  <TableHead className="font-body">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground font-body py-8">No discount codes</TableCell>
                  </TableRow>
                )}
                {codes.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-body text-sm font-mono font-semibold">{c.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-body text-xs">{c.type}</Badge>
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {c.type === "percentage" ? `${c.value}%` : `${c.value}`}
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{c.min_order ?? "-"}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      {c.uses_count ?? 0}{c.max_uses ? `/${c.max_uses}` : ""}
                    </TableCell>
                    <TableCell className="font-body text-xs text-muted-foreground">
                      {c.valid_from ? new Date(c.valid_from).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="font-body text-xs text-muted-foreground">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={c.enabled ?? true} onCheckedChange={(v) => toggleCodeEnabled.mutate({ id: c.id, enabled: v })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="font-body text-xs" onClick={() => openEditCode(c)}>Edit</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-body text-xs text-destructive"
                          onClick={() => { if (confirm("Delete this code?")) deleteCode.mutate(c.id); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Discount code dialog */}
      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{codeEditId ? "Edit Discount Code" : "Add Discount Code"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveCode.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Code</Label>
              <Input value={codeForm.code} onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })} required placeholder="SUMMER20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Type</Label>
                <Select value={codeForm.type} onValueChange={(v) => setCodeForm({ ...codeForm, type: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Value</Label>
                <Input type="number" value={codeForm.value} onChange={(e) => setCodeForm({ ...codeForm, value: +e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Min Order</Label>
                <Input type="number" value={codeForm.min_order} onChange={(e) => setCodeForm({ ...codeForm, min_order: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Max Uses (0 = unlimited)</Label>
                <Input type="number" value={codeForm.max_uses} onChange={(e) => setCodeForm({ ...codeForm, max_uses: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Valid From</Label>
                <Input type="date" value={codeForm.valid_from} onChange={(e) => setCodeForm({ ...codeForm, valid_from: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Valid Until</Label>
                <Input type="date" value={codeForm.valid_until} onChange={(e) => setCodeForm({ ...codeForm, valid_until: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full font-body" disabled={saveCode.isPending}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default AdminCheckout;
