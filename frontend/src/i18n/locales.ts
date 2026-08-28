import localeRegistry from "./locales.json";

export type SupportedLanguage = keyof typeof localeRegistry;

export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return Object.entries(localeRegistry).some(
    ([code, supported]) => code === language && supported,
  );
}

function nativeLanguageName(language: SupportedLanguage) {
  try {
    const displayNames = new Intl.DisplayNames([language], {
      languageDisplay: "standard",
      type: "language",
    });
    return displayNames.of(language) ?? language;
  } catch {
    return language;
  }
}

export const locales = Object.keys(localeRegistry).flatMap((code) =>
  isSupportedLanguage(code)
    ? [{ code, nativeName: nativeLanguageName(code) }]
    : [],
);

export const defaultLanguage = "en-US" satisfies SupportedLanguage;

export function canonicalLanguage(language: string) {
  return Intl.getCanonicalLocales(language)[0];
}
