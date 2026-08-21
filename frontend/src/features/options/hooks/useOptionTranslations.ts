import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textAt(root: unknown, path: readonly string[], fallback: string) {
  let value = root;
  for (const part of path) {
    if (!isRecord(value)) return fallback;
    value = value[part];
  }
  return typeof value === "string" ? value : fallback;
}

/** Provides names for the dynamic IDs stored in the option catalog. */
export function useOptionTranslations() {
  const { t } = useTranslation("options");

  return useMemo(() => {
    // Catalog IDs are dynamic, so i18next cannot validate their complete key
    // at compile time. Keep the checked lookup and fallback in one place.
    const categories = t("categories", { returnObjects: true });
    const fields = t("fields", { returnObjects: true });
    const sections = t("sections", { returnObjects: true });
    const specialValues = t("specialValues", { returnObjects: true });

    return {
      categoryLabel: (id: string) => textAt(categories, [id], id),
      choiceLabel: (option: string, choice: string) =>
        textAt(fields, [option, "choices", choice], choice),
      fieldDescription: (name: string) =>
        textAt(fields, [name, "description"], ""),
      fieldLabel: (name: string) => textAt(fields, [name, "label"], name),
      sectionLabel: (id: string) => textAt(sections, [id], id),
      specialValueLabel: (meaning: string) =>
        textAt(specialValues, [meaning], meaning),
    };
  }, [t]);
}
