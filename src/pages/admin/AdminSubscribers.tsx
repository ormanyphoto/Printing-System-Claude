import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { useState } from "react";

const AdminSubscribers = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", source: "" });
  const [importText, setImportText] = useState("");

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["admin-subscribers", statusFilter],
    queryFn: async () => {
      let query = (supabase as any).from("subscribers").select("*").order("subscribed_at", { ascending: false });
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const addSubscriber = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("subscribers").insert({
        email: addForm.email,
        name: addForm.name || null,
        source: addForm.source || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
      setAddOpen(false);
      setAddForm({ email: "", name: "", source: "" });
      toast({ title: "Subscriber added" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("subscribers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const deleteSubscriber = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast({ title: "Subscriber deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const bulkImport = useMutation({
    mutationFn: async () => {
      const emails = importText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && line.includes("@"));
      if (emails.length === 0) throw new Error("No valid emails found");
      const rows = emails.map((email) => ({ email, status: "active", source: "bulk_import" }));
      const { error } = await (supabase as any).from("subscribers").upsert(rows, { onConflict: "email" });
      if (error) throw error;
      return emails.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
      setImportOpen(false);
      setImportText("");
      toast({ title: `Imported ${count} subscribers` });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const exportCSV = () => {
    if (!subscribers.length) return;
    const headers = ["Email", "Name", "Source", "Status", "Subscribed At"];
    const rows = subscribers.map((s: any) => [
      s.email ?? "",
      s.name ?? "",
      s.source ?? "",
      s.status ?? "",
      s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gold">Newsletter Subscribers</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="font-body text-sm" onClick={exportCSV}>Export CSV</Button>
          <Button variant="outline" className="font-body text-sm" onClick={() => setImportOpen(true)}>Bulk Import</Button>
          <Button variant="outline" className="font-body text-sm" onClick={() => setAddOpen(true)}>+ Add Subscriber</Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-6">
        <div className="w-44">
          <label className="font-body text-xs text-muted-foreground mb-1.5 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Email</TableHead>
              <TableHead className="font-body">Name</TableHead>
              <TableHead className="font-body">Source</TableHead>
              <TableHead className="font-body">Status</TableHead>
              <TableHead className="font-body">Subscribed At</TableHead>
              <TableHead className="font-body">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground font-body py-8">Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && subscribers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground font-body py-8">No subscribers found</TableCell>
              </TableRow>
            )}
            {subscribers.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-body text-sm">{s.email}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{s.name ?? "-"}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{s.source ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`font-body text-xs ${
                        s.status === "active"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {s.status}
                    </Badge>
                    <Switch
                      checked={s.status === "active"}
                      onCheckedChange={(v) =>
                        toggleStatus.mutate({ id: s.id, status: v ? "active" : "unsubscribed" })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="font-body text-xs text-muted-foreground">
                  {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-body text-xs text-destructive"
                    onClick={() => { if (confirm("Delete this subscriber?")) deleteSubscriber.mutate(s.id); }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add subscriber dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add Subscriber</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addSubscriber.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
              <Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Name</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Source</Label>
              <Input value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} placeholder="website, manual, etc." />
            </div>
            <Button type="submit" className="w-full font-body" disabled={addSubscriber.isPending}>Add</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Bulk Import Subscribers</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); bulkImport.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Paste emails (one per line)</Label>
              <Textarea
                className="text-sm font-body"
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"john@example.com\njane@example.com\n..."}
              />
            </div>
            <p className="font-body text-xs text-muted-foreground">
              {importText.split("\n").filter((l) => l.trim() && l.includes("@")).length} valid emails detected
            </p>
            <Button type="submit" className="w-full font-body" disabled={bulkImport.isPending}>Import</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscribers;
