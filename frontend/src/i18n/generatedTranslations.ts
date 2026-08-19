import i18n from "@/i18n";
import { canonicalLanguage, defaultLanguage } from "@/i18n/locales";
import type { GameBuild } from "@/features/game/types";

export type GeneratedTranslationModules<Resource> = Record<
  string,
  () => Promise<{ default: Resource }>
>;

interface GeneratedTranslationLoaderOptions<Resource> {
  moduleKey: (build: GameBuild, language: string) => string;
  modules: GeneratedTranslationModules<Resource>;
  namespace: (build: GameBuild) => string;
}

export function createGeneratedTranslationLoader<Resource>({
  moduleKey,
  modules,
  namespace,
}: GeneratedTranslationLoaderOptions<Resource>) {
  const requests = new Map<string, Promise<void>>();

  async function register(build: GameBuild, language: string) {
    const resourceNamespace = namespace(build);
    if (i18n.hasResourceBundle(language, resourceNamespace)) return;

    const loadModule = modules[moduleKey(build, language)];
    if (!loadModule) return;

    const module = await loadModule();
    i18n.addResourceBundle(language, resourceNamespace, module.default);
  }

  function load(build: GameBuild, language: string) {
    const languageTag = canonicalLanguage(language);
    const requestKey = `${build}:${languageTag}`;
    const existingRequest = requests.get(requestKey);
    if (existingRequest) return existingRequest;

    const request = Promise.all([
      register(build, defaultLanguage),
      languageTag === defaultLanguage
        ? Promise.resolve()
        : register(build, languageTag),
    ])
      .then(() => undefined)
      .catch((error: unknown) => {
        requests.delete(requestKey);
        throw error;
      });
    requests.set(requestKey, request);
    return request;
  }

  function get(
    build: GameBuild,
    language: string,
    key: string,
    options?: Record<string, unknown>,
  ) {
    const languageTag = canonicalLanguage(language);
    const resourceNamespace = namespace(build);
    const translated = i18n.getResource(
      languageTag,
      resourceNamespace,
      key,
      options,
    );
    if (typeof translated === "string") return translated;

    const fallback = i18n.getResource(
      defaultLanguage,
      resourceNamespace,
      key,
      options,
    );
    return typeof fallback === "string" ? fallback : null;
  }

  function getRecordEntry(
    build: GameBuild,
    language: string,
    section: string,
    key: string,
  ) {
    const languageTag = canonicalLanguage(language);
    const resourceNamespace = namespace(build);
    const localized = i18n.getResource(languageTag, resourceNamespace, section);
    if (isStringRecord(localized) && typeof localized[key] === "string") {
      return localized[key];
    }

    const fallback = i18n.getResource(
      defaultLanguage,
      resourceNamespace,
      section,
    );
    return isStringRecord(fallback) && typeof fallback[key] === "string"
      ? fallback[key]
      : null;
  }

  return { get, getRecordEntry, load };
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
