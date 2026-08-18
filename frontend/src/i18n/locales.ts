export const locales = [
  { code: "en-US", nativeName: "English" },
  { code: "tr-TR", nativeName: "Türkçe" },
] as const;

export type SupportedLanguage = (typeof locales)[number]["code"];

export const defaultLanguage: SupportedLanguage = "en-US";
