import type { GameBuild } from "@/features/game/types";
import {
  createGeneratedTranslationLoader,
  type GeneratedTranslationModules,
} from "@/i18n/generatedTranslations";

interface ItemTranslations {
  category: Record<string, string>;
  item: Record<string, string>;
}

type ItemTranslationSection = keyof ItemTranslations;
const translationModules = import.meta.glob<{ default: ItemTranslations }>(
  "../../../i18n/generated/items/*/*.json",
) satisfies GeneratedTranslationModules<ItemTranslations>;

const translations = createGeneratedTranslationLoader({
  moduleKey: (build: GameBuild, language: string) =>
    `../../../i18n/generated/items/${build}/${language}.json`,
  modules: translationModules,
  namespace: (build: GameBuild) => `items-${build}`,
});

export function loadItemTranslations(build: GameBuild, language: string) {
  return translations.load(build, language);
}

export function translatedItemName(
  build: GameBuild,
  language: string,
  itemId: string,
) {
  return translatedName(build, language, "item", itemId);
}

export function translatedItemCategoryName(
  build: GameBuild,
  language: string,
  categoryId: string,
) {
  return translatedName(build, language, "category", categoryId);
}

function translatedName(
  build: GameBuild,
  language: string,
  section: ItemTranslationSection,
  id: string,
) {
  return translations.getRecordEntry(build, language, section, id);
}
