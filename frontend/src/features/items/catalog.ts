import { loadItemTranslations, translatedItemName } from "./translations";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import type {
  ItemCatalog,
  ItemCatalogCategory,
  ItemCatalogData,
  ItemCatalogEntry,
} from "./types";

const catalogLoaders = {
  "41": () => import("@/data/items/41.json"),
  "42": () => import("@/data/items/42.json"),
} satisfies Record<GameBuild, () => Promise<{ default: ItemCatalogData }>>;

const catalogRequests = new Map<string, Promise<ItemCatalog>>();

function prepareCatalog(
  data: ItemCatalogData,
  build: GameBuild,
  language: string,
): ItemCatalog {
  const categories: ItemCatalogCategory[] = [];
  const items: ItemCatalogEntry[] = [];
  const itemsById = new Map<string, ItemCatalogEntry>();
  const searchIndex = new Map<string, string>();

  for (const rawCategory of data.categories) {
    const category: ItemCatalogCategory = {
      itemIds: [],
      name: rawCategory.name,
    };

    for (const rawItem of rawCategory.items) {
      const item: ItemCatalogEntry = {
        build,
        category: rawCategory.name,
        id: rawItem.id,
        images: rawItem.images,
        name: translatedItemName(build, language, rawItem.id) ?? rawItem.name,
        wikiName: rawItem.name,
      };
      category.itemIds.push(item.id);
      items.push(item);
      itemsById.set(item.id, item);
      searchIndex.set(
        item.id,
        `${item.name} ${item.wikiName} ${item.id}`.toLocaleLowerCase(language),
      );
    }

    if (category.itemIds.length > 0) categories.push(category);
  }

  return {
    build,
    categories,
    items,
    itemsById,
    language,
    searchIndex,
    source: data.source,
  };
}

export function loadItemCatalog(
  build: GameBuild,
  language: string,
): Promise<ItemCatalog> {
  const languageTag = canonicalLanguage(language);
  const requestKey = `${build}:${languageTag}`;
  const existingRequest = catalogRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = Promise.all([
    catalogLoaders[build](),
    loadItemTranslations(build, languageTag),
  ]).then(([{ default: data }]) => {
    if (data.build !== build) {
      throw new Error(
        `Expected Build ${build} item data, received ${data.build}`,
      );
    }
    return prepareCatalog(data, build, languageTag);
  });
  catalogRequests.set(requestKey, request);
  void request.catch(() => {
    if (catalogRequests.get(requestKey) === request) {
      catalogRequests.delete(requestKey);
    }
  });
  return request;
}
