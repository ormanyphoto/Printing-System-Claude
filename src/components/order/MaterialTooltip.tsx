import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocalizedField } from "@/hooks/useLocalizedField";

interface MaterialTooltipProps {
  productSlug?: string;
  children: React.ReactNode;
}

const MaterialTooltip = ({ productSlug, children }: MaterialTooltipProps) => {
  const { lf } = useLocalizedField();

  const { data: info } = useQuery({
    queryKey: ["material-tooltip", productSlug],
    queryFn: async () => {
      if (!productSlug) return null;
      const { data } = await supabase
        .from("material_tooltips")
        .select("*")
        .eq("product_slug", productSlug)
        .maybeSingle();
      return data;
    },
    enabled: !!productSlug,
    staleTime: 5 * 60 * 1000,
  });

  if (!info) return <>{children}</>;

  const title = lf(info.title_en, info.title_he);
  const finish = lf(info.finish_en, info.finish_he);
  const bestFor = lf(info.best_for_en, info.best_for_he);
  const durability = lf(info.durability_en, info.durability_he);

  if (!title && !finish && !bestFor && !durability) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] p-3 space-y-1.5">
          {title && <p className="font-body font-bold text-sm text-background">{title}</p>}
          {finish && <p className="font-body text-xs text-background/70">✨ {finish}</p>}
          {bestFor && <p className="font-body text-xs text-background/70">🏠 {bestFor}</p>}
          {durability && <p className="font-body text-xs text-background/70">🛡️ {durability}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MaterialTooltip;
