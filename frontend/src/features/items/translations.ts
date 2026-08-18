import i18n from "@/i18n";
import { defaultLanguage } from "@/i18n/locales";
import type { GameBuild } from "@/features/game/types";

type ItemTranslations = Record<string, string>;
type ItemTranslationModule = { default: ItemTranslations };

const translationModules = import.meta.glob<ItemTranslationModule>(
  "../../i18n/generated/items/*/*.json",
);
const namespaceRequests = new Map<string, Promise<void>>();

export function itemTranslationNamespace(build: GameBuild) {
  return `items-${build}`;
}

function translationModule(build: GameBuild, language: string) {
  return translationModules[
    `../../i18n/generated/items/${build}/${language}.json`
  ];
}

async function registerNamespace(build: GameBuild, language: string) {
  const namespace = itemTranslationNamespace(build);
  if (i18n.hasResourceBundle(language, namespace)) return;

  const loadModule = translationModule(build, language);
  if (!loadModule) return;

  const module = await loadModule();
  i18n.addResourceBundle(language, namespace, module.default);
}

export function loadItemTranslations(build: GameBuild, language: string) {
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

export function translatedItemName(
  build: GameBuild,
  language: string,
  itemId: string,
) {
  const languageTag = Intl.getCanonicalLocales(language)[0];
  const namespace = itemTranslationNamespace(build);
  const translated = i18n.getResource(languageTag, namespace, itemId, {
    keySeparator: false,
  });
  if (typeof translated === "string") return translated;

  const fallback = i18n.getResource(defaultLanguage, namespace, itemId, {
    keySeparator: false,
  });
  return typeof fallback === "string" ? fallback : null;
}
