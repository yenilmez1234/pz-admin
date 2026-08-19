import type { GameBuild } from "@/features/game/types";

export interface ItemCatalogData {
  build: string;
  categories: RawItemCatalogCategory[];
  source: ItemCatalogSource;
}

export interface RawItemCatalogCategory {
  items: RawItemCatalogEntry[];
  name: string;
}

export interface RawItemCatalogEntry {
  displayCategory?: string;
  dynamicMoveable?: boolean;
  id: string;
  icon?: string | null;
  images: string[];
  itemType?: string;
  lootCategory?: string;
  name: string;
  tags?: string[];
}

export interface ItemCatalogEntry {
  build: GameBuild;
  category: string;
  defaultName: string;
  displayCategory?: string;
  dynamicMoveable?: boolean;
  id: string;
  icon?: string | null;
  images: string[];
  itemType?: string;
  lootCategory?: string;
  name: string;
  tags?: string[];
}

export interface ItemCatalogCategory {
  itemIds: string[];
  name: string;
}

export interface ItemCatalog {
  build: GameBuild;
  categories: ItemCatalogCategory[];
  items: ItemCatalogEntry[];
  itemsById: ReadonlyMap<string, ItemCatalogEntry>;
  language: string;
  searchIndex: ReadonlyMap<string, string>;
  source: ItemCatalogSource;
}

export interface ItemCatalogSource {
  revision: number;
  url: string;
}

export type ItemSelection = ReadonlyMap<string, number>;
