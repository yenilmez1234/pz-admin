import type { GameBuild } from "@/features/game/types";
import {
  createGeneratedTranslationLoader,
  type GeneratedTranslationModules,
} from "@/i18n/generatedTranslations";

type ItemTranslations = Record<string, string>;
const translationModules = import.meta.glob<{ default: ItemTranslations }>(
  "../../i18n/generated/items/*/*.json",
) satisfies GeneratedTranslationModules<ItemTranslations>;

const translations = createGeneratedTranslationLoader({
  moduleKey: (build: GameBuild, language: string) =>
    `../../i18n/generated/items/${build}/${language}.json`,
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
  return translations.get(build, language, itemId, {
    keySeparator: false,
  });
}
