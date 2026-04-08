import { useSearchParams } from "react-router-dom";

/**
 * Returns true when ?embed=true is present in the URL.
 * Used to hide chrome (header, footer, sidebar) when the app
 * is rendered inside a third-party iframe (e.g. Shopify).
 */
export const useEmbed = (): boolean => {
  const [searchParams] = useSearchParams();
  return searchParams.get("embed") === "true";
};
