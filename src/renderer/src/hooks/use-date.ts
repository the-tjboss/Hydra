import { formatDistance } from "date-fns";
import type { FormatDistanceOptions } from "date-fns";
import { ptBR, enUS, es, fr, pl, hu, tr, ru, it, be } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export function useDate() {
  const { i18n } = useTranslation();

  const { language } = i18n;

  const getDateLocale = () => {
    if (language.startsWith("pt")) return ptBR;
    if (language.startsWith("es")) return es;
    if (language.startsWith("fr")) return fr;
    if (language.startsWith("hu")) return hu;
    if (language.startsWith("pl")) return pl;
    if (language.startsWith("tr")) return tr;
    if (language.startsWith("ru")) return ru;
    if (language.startsWith("it")) return it;
    if (language.startsWith("be")) return be;

    return enUS;
  };

  return {
    formatDistance: (
      date: string | number | Date,
      baseDate: string | number | Date,
      options?: FormatDistanceOptions
    ) => {
      try {
        return formatDistance(date, baseDate, {
          ...options,
          locale: getDateLocale(),
        });
      } catch (err) {
        return "";
      }
    },
  };
}
