import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { OptionCategory } from "../catalog";
import {
  nestedTranslationText,
  translationText,
} from "../lib/translationLookup";

const resultBatchSize = 20;

function normalized(value: string, locale: string | undefined) {
  return locale ? value.toLocaleLowerCase(locale) : value.toLocaleLowerCase();
}

/**
 * Keeps expensive filtering behind a deferred query and reveals large result
 * sets incrementally. This prevents the 100+ option fields from mounting while
 * the user is still typing.
 */
export function useOptionsSearch(categories: readonly OptionCategory[]) {
  const { i18n, t } = useTranslation("options");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(resultBatchSize);
  const locale = i18n.resolvedLanguage;
  const deferredQuery = useDeferredValue(query.trim());

  const searchIndex = useMemo(() => {
    const categoryTranslations = t("categories", { returnObjects: true });
    const sectionTranslations = t("sections", { returnObjects: true });
    const fieldTranslations = t("fields", { returnObjects: true });

    return categories.flatMap((category) => {
      const categoryLabel = translationText(
        categoryTranslations,
        category.id,
        category.id,
      );
      return category.sections.flatMap((section) => {
        const sectionLabel = translationText(
          sectionTranslations,
          section.id,
          section.id,
        );
        return section.options.map((definition) => ({
          name: definition.name,
          text: normalized(
            [
              definition.name,
              categoryLabel,
              sectionLabel,
              nestedTranslationText(
                fieldTranslations,
                definition.name,
                "label",
                definition.name,
              ),
              nestedTranslationText(
                fieldTranslations,
                definition.name,
                "description",
                "",
              ),
            ].join(" "),
            locale,
          ),
        }));
      });
    });
  }, [categories, locale, t]);

  const result = useMemo(() => {
    if (!deferredQuery) return null;

    const matchingNames = searchIndex
      .filter((entry) => entry.text.includes(normalized(deferredQuery, locale)))
      .map((entry) => entry.name);
    const visibleNames = new Set(matchingNames.slice(0, visibleCount));
    const visibleCategories = categories.flatMap((category) => {
      const sections = category.sections.flatMap((section) => {
        const options = section.options.filter((definition) =>
          visibleNames.has(definition.name),
        );
        return options.length > 0 ? [{ ...section, options }] : [];
      });
      return sections.length > 0 ? [{ ...category, sections }] : [];
    });

    return { categories: visibleCategories, total: matchingNames.length };
  }, [categories, deferredQuery, locale, searchIndex, visibleCount]);

  const changeQuery = useCallback((value: string) => {
    setQuery(value);
    setVisibleCount(resultBatchSize);
  }, []);
  const showMore = useCallback(() => {
    setVisibleCount((current) => current + resultBatchSize);
  }, []);

  return {
    changeQuery,
    query,
    result,
    searching: Boolean(query.trim()),
    showMore,
    visibleCount,
  };
}
