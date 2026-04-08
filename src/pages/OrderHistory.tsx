import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatILS } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

const OrderHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      } else {
        navigate("/login");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else setUserId(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      return (data ?? []) as Tables<"orders">[];
    },
    enabled: !!userId,
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "confirmed": return "default";
      case "completed": return "default";
      case "draft": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8">
            {t("orders.myOrders")}
          </h1>

          {isLoading ? (
            <p className="text-muted-foreground font-body text-sm">{t("orders.loading")}</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body text-sm mb-4">{t("orders.noOrders")}</p>
              <Button variant="outline" onClick={() => navigate("/order")}>
                {t("orders.startOrder")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const selections = order.product_selections as Record<string, unknown>;
                return (
                  <div key={order.id} className="border border-border rounded-sm p-5 bg-card flex flex-col sm:flex-row sm:items-center gap-4">
                    {order.image_url && (
                      <img
                        src={order.image_url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-sm shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColor(order.status)}>{order.status}</Badge>
                        <span className="font-body text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-body text-sm text-foreground truncate">
                        {(selections?.productName as string) || t("orders.order")} #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display text-xl text-foreground">
                        {formatILS(order.total_price_ils)}
                      </span>
                      {order.status === "draft" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const slug = (selections?.productSlug as string) || "";
                              navigate(`/order${slug ? `?product=${slug}` : ""}`);
                            }}
                          >
                            {t("orders.continue")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              await supabase.from("orders").delete().eq("id", order.id);
                              queryClient.invalidateQueries({ queryKey: ["my-orders"] });
                            }}
                          >
                            {t("orders.delete")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderHistory;
