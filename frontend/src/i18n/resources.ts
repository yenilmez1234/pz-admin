import common from "./resources/en-US/common.json";
import console from "./resources/en-US/console.json";
import items from "./resources/en-US/items.json";
import messages from "./resources/en-US/messages.json";
import options from "./resources/en-US/options.json";
import players from "./resources/en-US/players.json";
import servers from "./resources/en-US/servers.json";
import serverActions from "./resources/en-US/serverActions.json";
import session from "./resources/en-US/session.json";
import settings from "./resources/en-US/settings.json";
import shell from "./resources/en-US/shell.json";
import skills from "./resources/en-US/skills.json";
import tools from "./resources/en-US/tools.json";
import vehicles from "./resources/en-US/vehicles.json";
import type { Resource, ResourceKey } from "i18next";
import { defaultLanguage } from "./locales";
import namespaceManifest from "./namespaces.json";

export type ResourceNamespace = keyof typeof namespaceManifest;

export const defaultResources = {
  common,
  console,
  items,
  messages,
  options,
  players,
  servers,
  serverActions,
  session,
  settings,
  shell,
  skills,
  tools,
  vehicles,
} as const satisfies Record<ResourceNamespace, ResourceKey>;

const translationFiles = import.meta.glob<{ default: ResourceKey }>(
  "./resources/*/*.json",
  { eager: true },
);

export const resources = Object.entries(translationFiles).reduce<Resource>(
  (languages, [path, module]) => {
    const match = path.match(/^\.\/resources\/([^/]+)\/([^/]+)\.json$/);
    if (!match) return languages;

    const [, language, namespace] = match;
    const languageResources = languages[language] ?? {};
    languageResources[namespace] = module.default;
    languages[language] = languageResources;
    return languages;
  },
  {},
);

// The default language is explicit so keys stay type-checked. Other locale
// directories and their namespaces are registered automatically.
resources[defaultLanguage] = defaultResources;

export function interfaceTranslationCoverage(language: string) {
  const languageResources = resources[language];
  const coverage = countTranslatedStrings(defaultResources, languageResources);
  return coverage.total === 0
    ? 0
    : Math.round((coverage.translated / coverage.total) * 100);
}

interface TranslationCount {
  total: number;
  translated: number;
}

function countTranslatedStrings(
  reference: unknown,
  translation: unknown,
): TranslationCount {
  if (typeof reference === "string") {
    return {
      total: 1,
      translated: typeof translation === "string" ? 1 : 0,
    };
  }
  if (!isRecord(reference)) return { total: 0, translated: 0 };

  let total = 0;
  let translated = 0;
  for (const [key, value] of Object.entries(reference)) {
    const child = countTranslatedStrings(
      value,
      isRecord(translation) ? translation[key] : undefined,
    );
    total += child.total;
    translated += child.translated;
  }
  return { total, translated };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
