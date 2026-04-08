import { useTranslation } from "react-i18next";

/**
 * Returns a helper function that picks the correct bilingual field
 * based on the current language (e.g., name_en vs name_he).
 */
export const useLocalizedField = () => {
  const { i18n } = useTranslation();
  const isHe = i18n.language === "he";

  const lf = (enValue: string | null | undefined, heValue: string | null | undefined): string => {
    if (isHe && heValue) return heValue;
    return enValue ?? "";
  };

  return { lf, isHe };
};
