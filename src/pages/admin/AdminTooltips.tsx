import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { Pencil, Save, X } from "lucide-react";

interface TooltipRow {
  id: string;
  product_slug: string;
  title_en: string;
  title_he: string;
  finish_en: string;
  finish_he: string;
  best_for_en: string;
  best_for_he: string;
  durability_en: string;
  durability_he: string;
}

const FIELDS = [
  { key: "title", label: "Title" },
  { key: "finish", label: "Finish" },
  { key: "best_for", label: "Best For" },
  { key: "durability", label: "Durability" },
] as const;

const AdminTooltips = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<TooltipRow>>({});

  const { data: tooltips = [], isLoading } = useQuery({
    queryKey: ["material-tooltips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_tooltips")
        .select("*")
        .order("product_slug");
      if (error) throw error;
      return data as TooltipRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (row: Partial<TooltipRow> & { id: string }) => {
      const { id, ...rest } = row;
      const { error } = await supabase
        .from("material_tooltips")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-tooltips"] });
      toast({ title: "Tooltip updated" });
      setEditingId(null);
    },
    onError: (e) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  const startEdit = (row: TooltipRow) => {
    setEditingId(row.id);
    setForm({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, ...form });
  };

  if (isLoading) return <p className="font-body text-muted-foreground">Loading…</p>;

  return (
    <div>
      <h2 className="font-display text-2xl mb-1">Material Tooltips</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Edit the info tooltips shown when hovering over product types on the order page.
      </p>

      <div className="space-y-4">
        {tooltips.map((t) => {
          const isEditing = editingId === t.id;
          const data = isEditing ? form : t;

          return (
            <div key={t.id} className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-body font-semibold text-foreground capitalize">
                  {t.product_slug.replace(/-/g, " ")}
                </h3>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                      <Save className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div>
                      <Label className="font-body text-xs text-muted-foreground">{label} (EN)</Label>
                      {isEditing ? (
                        <Input
                          value={(data as any)[`${key}_en`] || ""}
                          onChange={(e) => setForm({ ...form, [`${key}_en`]: e.target.value })}
                          className="font-body text-sm"
                        />
                      ) : (
                        <p className="font-body text-sm text-foreground">
                          {(data as any)[`${key}_en`] || "—"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="font-body text-xs text-muted-foreground">{label} (HE)</Label>
                      {isEditing ? (
                        <Input
                          value={(data as any)[`${key}_he`] || ""}
                          onChange={(e) => setForm({ ...form, [`${key}_he`]: e.target.value })}
                          className="font-body text-sm"
                          dir="rtl"
                        />
                      ) : (
                        <p className="font-body text-sm text-foreground" dir="rtl">
                          {(data as any)[`${key}_he`] || "—"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTooltips;
