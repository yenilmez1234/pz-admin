#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import { frontendRoot } from "../../shared/paths.mjs";
import { disambiguateItemNames } from "./name-disambiguation.mjs";
import {
  build42LootCategory,
  gameItemMetadata,
  lootCategoryOrder,
  readEnglishItemMetadata,
  readGameItems,
} from "./game-data.mjs";
import { downloadItemWikiImages, scrapeItemWikiCatalog } from "./wiki.mjs";

function parseArgs(argv) {
  const args = {
    build: "42",
    gameDirectory: undefined,
    output: undefined,
    revision: undefined,
    skipImages: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--build") args.build = argv[++index];
    else if (argument === "--game-dir") args.gameDirectory = argv[++index];
    else if (argument === "--output") args.output = argv[++index];
    else if (argument === "--revision") args.revision = argv[++index];
    else if (argument === "--skip-images") args.skipImages = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (args.build !== "42") {
    throw new Error("Hybrid item extraction currently supports Build 42 only");
  }
  if (!args.gameDirectory) {
    throw new Error("Game directory is required (--game-dir <path>)");
  }
  if (
    args.revision !== undefined &&
    args.revision !== "latest" &&
    !/^[1-9]\d*$/.test(args.revision)
  ) {
    throw new Error("Revision must be a positive number or 'latest'");
  }

  return args;
}

function hybridCatalog(wikiCatalog, gameItems, itemNames, categoryNames) {
  const wikiItems = wikiCatalog.categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      wikiCategory: category.name,
    })),
  );
  const items = [];
  const missingDefinitions = [];
  const missingNames = [];

  for (const wikiItem of wikiItems) {
    const gameId = wikiItem.id.replace(/\*$/, "");
    let gameItem = gameItems.get(gameId);
    let dynamicMoveable = false;
    if (
      !gameItem &&
      wikiItem.id.endsWith("*") &&
      (gameId.startsWith("Base.Mov_") || gameId === "Base.Moveable") &&
      ["Furniture", "Gardening"].includes(wikiItem.wikiCategory)
    ) {
      dynamicMoveable = true;
      gameItem = {
        id: gameId,
        name: gameId.slice(gameId.indexOf(".") + 1),
        properties: {
          DisplayCategory: wikiItem.wikiCategory,
          ItemType: "base:moveable",
        },
      };
    }
    if (!gameItem) {
      missingDefinitions.push(wikiItem.id);
      continue;
    }

    const gameName = itemNames[gameId];
    if (typeof gameName !== "string") missingNames.push(wikiItem.id);
    const lootCategory = build42LootCategory(gameItem);
    items.push({
      id: wikiItem.id,
      images: wikiItem.images,
      name: gameName ?? wikiItem.name,
      ...gameItemMetadata(gameItem, lootCategory),
      dynamicMoveable,
    });
  }

  if (missingDefinitions.length > 0) {
    throw new Error(
      `${missingDefinitions.length} wiki items have no game definition:\n${missingDefinitions.join("\n")}`,
    );
  }

  const disambiguatedNames = disambiguateItemNames(items);
  for (const item of items) item.name = disambiguatedNames.get(item.id);

  const categories = lootCategoryOrder
    .map((lootCategory) => ({
      items: items
        .filter((item) => item.lootCategory === lootCategory)
        .sort((left, right) => left.name.localeCompare(right.name, "en-US")),
      name: categoryNames[lootCategory],
    }))
    .filter((category) => category.items.length > 0)
    .sort((left, right) => left.name.localeCompare(right.name, "en-US"));

  return {
    catalog: {
      build: wikiCatalog.build,
      categories,
      source: wikiCatalog.source,
    },
    missingNames,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gameDirectory = path.resolve(args.gameDirectory);
  const [{ catalog: wikiCatalog, downloads }, gameItems, englishMetadata] =
    await Promise.all([
      scrapeItemWikiCatalog(args.build, args.revision),
      readGameItems(gameDirectory, args.build),
      readEnglishItemMetadata(gameDirectory),
    ]);

  const { catalog, missingNames } = hybridCatalog(
    wikiCatalog,
    gameItems,
    englishMetadata.names,
    englishMetadata.lootCategoryNames,
  );

  if (!args.skipImages) {
    await downloadItemWikiImages(
      downloads,
      path.join(frontendRoot, "public", "items", args.build),
    );
  }

  const outputPath = path.resolve(
    args.output ??
      path.join(frontendRoot, "src", "data", "items", `${args.build}.json`),
  );
  const formatted = await prettier.format(JSON.stringify(catalog), {
    parser: "json",
  });
  await fs.writeFile(outputPath, formatted);

  const itemCount = catalog.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
  console.log(
    `wrote ${outputPath}: ${catalog.categories.length} loot categories, ${itemCount} items, ${downloads.length} images`,
  );
  if (missingNames.length > 0) {
    console.warn(
      `${missingNames.length} items used their wiki names because the game has no English translation:\n${missingNames.join("\n")}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
