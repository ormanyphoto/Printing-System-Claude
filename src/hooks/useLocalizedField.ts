import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useLocalizedField() {
  const { i18n } = useTranslation();

  const getField = useCallback(
    (obj: Record<string, any>, fieldBase: string): string => {
      const lang = i18n.language;
      const localizedKey = `${fieldBase}_${lang}`;
      const fallbackKey = `${fieldBase}_en`;
      return obj[localizedKey] || obj[fallbackKey] || '';
    },
    [i18n.language]
  );

  return { getField, language: i18n.language };
}
