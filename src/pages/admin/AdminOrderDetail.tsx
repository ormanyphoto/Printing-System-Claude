import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/error-messages";
import { formatILS } from "@/lib/pricing";
import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  in_production: "bg-orange-100 text-orange-800 border-orange-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_OPTIONS = ["pending", "confirmed", "in_production", "shipped", "delivered", "completed"];
const CARRIER_OPTIONS = ["DHL", "FedEx", "UPS", "Israel Post"];

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippedAt, setShippedAt] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number ?? "");
      setShippingCarrier(order.shipping_carrier ?? "");
      setShippedAt(order.shipped_at ? order.shipped_at.slice(0, 10) : "");
      setInternalNotes(order.internal_notes ?? "");
    }
  }, [order]);

  const updateOrder = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await (supabase as any).from("orders").update(updates).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: getSafeErrorMessage(e), variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="font-body text-muted-foreground py-8">Loading order...</div>;
  }

  if (!order) {
    return <div className="font-body text-muted-foreground py-8">Order not found.</div>;
  }

  const status = (order.production_status ?? order.status ?? "pending") as string;
  const selections = (() => {
    try {
      if (typeof order.product_selections === "string") return JSON.parse(order.product_selections);
      return order.product_selections ?? {};
    } catch {
      return {};
    }
  })();

  const customerPhone = selections?.phone ?? selections?.customer_phone ?? null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-body text-sm" onClick={() => navigate("/admin/orders")}>
            &larr; Back to Orders
          </Button>
          <h1 className="font-display text-2xl text-gold">Order #{order.id.slice(0, 8)}</h1>
          <Badge className={`${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800"} font-body text-xs`}>
            {status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => updateOrder.mutate({ production_status: v })}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="font-body text-sm text-muted-foreground mb-6">
        Created {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-body text-sm text-muted-foreground">Name</span>
              <span className="font-body text-sm">{order.customer_name ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-body text-sm text-muted-foreground">Email</span>
              <span className="font-body text-sm">{order.customer_email ?? "-"}</span>
            </div>
            {customerPhone && (
              <div className="flex justify-between">
                <span className="font-body text-sm text-muted-foreground">Phone</span>
                <span className="font-body text-sm">{customerPhone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-body text-sm text-muted-foreground">Total</span>
              <span className="font-body text-lg font-semibold">{formatILS(order.total_price_ils ?? 0)}</span>
            </div>
            {selections?.breakdown && typeof selections.breakdown === "object" && (
              <>
                {Object.entries(selections.breakdown).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-body text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="font-body text-xs">{formatILS(Number(val) || 0)}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Product details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {order.image_url && (
                <div className="shrink-0">
                  <img
                    src={order.image_url}
                    alt="Order image"
                    className="w-32 h-32 object-cover rounded-md border border-border"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
                {selections?.product_name && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Product</span>
                    <span className="font-body text-sm">{selections.product_name}</span>
                  </div>
                )}
                {selections?.subtype && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Subtype</span>
                    <span className="font-body text-sm">{selections.subtype}</span>
                  </div>
                )}
                {selections?.size && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Size</span>
                    <span className="font-body text-sm">{selections.size}</span>
                  </div>
                )}
                {(selections?.width_cm || selections?.height_cm) && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Dimensions</span>
                    <span className="font-body text-sm">{selections.width_cm} x {selections.height_cm} cm</span>
                  </div>
                )}
                {selections?.finish && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Finish</span>
                    <span className="font-body text-sm">{selections.finish}</span>
                  </div>
                )}
                {selections?.frame_style && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Frame Style</span>
                    <span className="font-body text-sm">{selections.frame_style}</span>
                  </div>
                )}
                {selections?.frame_color && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Frame Color</span>
                    <span className="font-body text-sm">{selections.frame_color}</span>
                  </div>
                )}
                {selections?.glazing && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Glazing</span>
                    <span className="font-body text-sm">{selections.glazing}</span>
                  </div>
                )}
                {selections?.quantity && (
                  <div>
                    <span className="font-body text-xs text-muted-foreground block">Quantity</span>
                    <span className="font-body text-sm">{selections.quantity}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body text-xs text-muted-foreground mb-1.5 block">Tracking Number</Label>
              <Input className="h-9 text-sm" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground mb-1.5 block">Carrier</Label>
              <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select carrier..." /></SelectTrigger>
                <SelectContent>
                  {CARRIER_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground mb-1.5 block">Shipped At</Label>
              <Input type="date" className="h-9 text-sm" value={shippedAt} onChange={(e) => setShippedAt(e.target.value)} />
            </div>
            <Button
              size="sm"
              className="font-body text-sm w-full"
              disabled={updateOrder.isPending}
              onClick={() =>
                updateOrder.mutate({
                  tracking_number: trackingNumber || null,
                  shipping_carrier: shippingCarrier || null,
                  shipped_at: shippedAt || null,
                })
              }
            >
              Save Shipping
            </Button>
          </CardContent>
        </Card>

        {/* Internal notes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="text-sm font-body"
              rows={5}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes about this order..."
            />
            <Button
              size="sm"
              className="font-body text-sm w-full"
              disabled={updateOrder.isPending}
              onClick={() => updateOrder.mutate({ internal_notes: internalNotes || null })}
            >
              Save Notes
            </Button>
          </CardContent>
        </Card>

        {/* Shopify sync */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Shopify</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.shopify_order_id ? (
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Shopify Order ID</span>
                <Badge variant="secondary" className="font-body text-xs">{order.shopify_order_id}</Badge>
              </div>
            ) : (
              <p className="font-body text-sm text-muted-foreground">Not synced with Shopify</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-border">
        <Button variant="outline" className="font-body" onClick={() => navigate("/admin/orders")}>
          Back to Orders
        </Button>
        <Button
          className="font-body"
          disabled={updateOrder.isPending}
          onClick={() =>
            updateOrder.mutate({
              production_status: "shipped",
              shipped_at: shippedAt || new Date().toISOString().slice(0, 10),
            })
          }
        >
          Mark as Shipped
        </Button>
        <Button
          className="font-body"
          disabled={updateOrder.isPending}
          onClick={() => updateOrder.mutate({ production_status: "delivered" })}
        >
          Mark as Delivered
        </Button>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
