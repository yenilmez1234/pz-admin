import common from "./resources/en-US/common.json";
import items from "./resources/en-US/items.json";
import vehicles from "./resources/en-US/vehicles.json";
import players from "./resources/en-US/players.json";
import servers from "./resources/en-US/servers.json";
import settings from "./resources/en-US/settings.json";
import shell from "./resources/en-US/shell.json";
import tools from "./resources/en-US/tools.json";
import type { Resource, ResourceKey } from "i18next";
import { defaultLanguage } from "./locales";

export const defaultResources = {
  common,
  items,
  vehicles,
  players,
  servers,
  settings,
  shell,
  tools,
} as const;

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
