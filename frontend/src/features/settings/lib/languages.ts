import { locales } from "@/i18n/locales";
import { interfaceTranslationCoverage } from "@/i18n/resources";

export const languageCoverage = new Map(
  locales.map(({ code }) => [code, interfaceTranslationCoverage(code)]),
);
const preferredLanguageCoverage = 50;
export const languageOptions = [...locales]
  .sort(
    (left, right) =>
      Number(
        (languageCoverage.get(right.code) ?? 0) >= preferredLanguageCoverage,
      ) -
      Number(
        (languageCoverage.get(left.code) ?? 0) >= preferredLanguageCoverage,
      ),
  )
  .map(({ code, nativeName }) => ({
    value: code,
    label: nativeName,
  }));
