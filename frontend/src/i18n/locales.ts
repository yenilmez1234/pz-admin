import localeNames from "./locales.json";

export type SupportedLanguage = keyof typeof localeNames;

export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return Object.prototype.hasOwnProperty.call(localeNames, language);
}

export const locales = Object.entries(localeNames).map(([code, nativeName]) => {
  if (!isSupportedLanguage(code)) {
    throw new Error(`Unsupported locale code: ${code}`);
  }
  return { code, nativeName };
});

export const defaultLanguage = "en-US" satisfies SupportedLanguage;

export function canonicalLanguage(language: string) {
  return Intl.getCanonicalLocales(language)[0];
}
