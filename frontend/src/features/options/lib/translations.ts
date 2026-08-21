function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function translationText(
  translations: unknown,
  key: string,
  fallback: string,
) {
  let value = translations;
  for (const part of key.split(".")) {
    if (!isRecord(value)) return fallback;
    value = value[part];
  }
  return typeof value === "string" ? value : fallback;
}

export function nestedTranslationText(
  translations: unknown,
  group: string,
  key: string,
  fallback: string,
) {
  if (!isRecord(translations)) return fallback;
  return translationText(translations[group], key, fallback);
}
