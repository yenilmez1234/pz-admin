import type { GameBuild } from "@/features/game/types";
import i18n from "@/i18n";
import { defaultLanguage } from "@/i18n/locales";

interface SkillTranslations {
  categories: Record<string, string>;
  skills: Record<string, string>;
}

type SkillTranslationModule = { default: SkillTranslations };
type SkillTranslationSection = keyof SkillTranslations;

const translationModules = import.meta.glob<SkillTranslationModule>(
  "./generated/skills/*/*.json",
);
const namespaceRequests = new Map<string, Promise<void>>();

function skillTranslationNamespace(build: GameBuild) {
  return `skills-${build}`;
}

function translationModule(build: GameBuild, language: string) {
  return translationModules[`./generated/skills/${build}/${language}.json`];
}

async function registerNamespace(build: GameBuild, language: string) {
  const namespace = skillTranslationNamespace(build);
  if (i18n.hasResourceBundle(language, namespace)) return;

  const loadModule = translationModule(build, language);
  if (!loadModule) return;

  const module = await loadModule();
  i18n.addResourceBundle(language, namespace, module.default);
}

export function loadSkillTranslations(build: GameBuild, language: string) {
  const languageTag = Intl.getCanonicalLocales(language)[0];
  const requestKey = `${build}:${languageTag}`;
  const existingRequest = namespaceRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = Promise.all([
    registerNamespace(build, defaultLanguage),
    languageTag === defaultLanguage
      ? Promise.resolve()
      : registerNamespace(build, languageTag),
  ])
    .then(() => undefined)
    .catch((error: unknown) => {
      namespaceRequests.delete(requestKey);
      throw error;
    });
  namespaceRequests.set(requestKey, request);
  return request;
}

function translatedName(
  build: GameBuild,
  language: string,
  section: SkillTranslationSection,
  id: string,
) {
  const languageTag = Intl.getCanonicalLocales(language)[0];
  const namespace = skillTranslationNamespace(build);
  const key = `${section}.${id}`;
  const translated = i18n.getResource(languageTag, namespace, key);
  if (typeof translated === "string") return translated;

  const fallback = i18n.getResource(defaultLanguage, namespace, key);
  return typeof fallback === "string" ? fallback : null;
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
