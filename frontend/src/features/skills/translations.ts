import type { GameBuild } from "@/features/game/types";
import {
  createGeneratedTranslationLoader,
  type GeneratedTranslationModules,
} from "@/i18n/generatedTranslations";

interface SkillTranslations {
  categories: Record<string, string>;
  skills: Record<string, string>;
}

type SkillTranslationSection = keyof SkillTranslations;

const translationModules = import.meta.glob<{ default: SkillTranslations }>(
  "../../i18n/generated/skills/*/*.json",
) satisfies GeneratedTranslationModules<SkillTranslations>;

const translations = createGeneratedTranslationLoader({
  moduleKey: (build: GameBuild, language: string) =>
    `../../i18n/generated/skills/${build}/${language}.json`,
  modules: translationModules,
  namespace: (build: GameBuild) => `skills-${build}`,
});

export function loadSkillTranslations(build: GameBuild, language: string) {
  return translations.load(build, language);
}

function translatedName(
  build: GameBuild,
  language: string,
  section: SkillTranslationSection,
  id: string,
) {
  const key = `${section}.${id}`;
  return translations.get(build, language, key);
}

export function translatedSkillCategoryName(
  build: GameBuild,
  language: string,
  categoryId: string,
) {
  return translatedName(build, language, "categories", categoryId);
}

export function translatedSkillName(
  build: GameBuild,
  language: string,
  skillId: string,
) {
  return translatedName(build, language, "skills", skillId);
}
