#!/usr/bin/env node
// Regenerates src/data/vehicles/<build>.json from the hand-curated
// public/vehicles/<build>/ folder tree.
//
// Usage: pnpm generate:vehicles -- --build 41
//
// Folder tree:        {Category}/{Model}/{Variant}/{ScriptId}/image.webp
// Single-variant:     {Category}/{Model}/{ScriptId}/image.webp  (flattened)
// Each vehicle leaf (the script-id folder) may contain a hand-edited
// stats.json: { "weight": "1030", "enginePower": "480", ... }

import fs from "node:fs/promises";
import path from "node:path";
import { frontendRoot } from "../../shared/paths.mjs";

function parseArgs(argv) {
  const args = { build: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--") continue;
    if (argv[i] === "--build") args.build = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (args.build !== "41" && args.build !== "42") {
    throw new Error("Build is required and must be 41 or 42 (--build <build>)");
  }
  return args;
}

// rootDir is public/vehicles/<build>; every image path in the output is
// relative to it, prefixed with the web path baseImagePath.
async function processDirectory(dirPath, type, baseImagePath, rootDir) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const item = { name: entry.name, type };

      if (type === "type") {
        const idEntries = await fs.readdir(fullPath, { withFileTypes: true });
        // Variant folders contain the script-id folder; flattened models are
        // the script-id folder themselves (only image files inside).
        const idDir = idEntries.find((f) => f.isDirectory());
        if (idDir) {
          item.id = idDir.name;
          const imageDir = path.join(fullPath, idDir.name);
          const images = await listImages(imageDir, baseImagePath, rootDir);
          if (images.length > 0) item.image = images[0];
          await attachStats(item, imageDir);
        } else {
          item.id = entry.name;
          const image = idEntries
            .filter(
              (f) =>
                f.isFile() && /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name),
            )
            .map((file) =>
              path
                .join(
                  baseImagePath,
                  path.relative(rootDir, path.join(fullPath, file.name)),
                )
                .replace(/\\/g, "/"),
            )[0];
          if (image) item.image = image;
          await attachStats(item, fullPath);
        }
      } else {
        item.children = await processDirectory(
          fullPath,
          getNextType(type),
          baseImagePath,
          rootDir,
        );

        // Merge models with a single variant into a type node.
        if (
          item.children &&
          item.children.length === 1 &&
          item.children[0].type === "type"
        ) {
          const child = item.children[0];
          delete item.children;
          item.id = child.id;
          item.image = child.image;
          item.type = child.type;
          item.stats = child.stats;
        }
      }
      items.push(item);
    }
  }
  return items;
}

// Single-image support only: each leaf carries exactly one image file.
async function listImages(dirPath, baseImagePath, rootDir) {
  const files = await fs.readdir(dirPath);
  return files
    .filter((file) => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file))
    .slice(0, 1)
    .map((file) =>
      path
        .join(baseImagePath, path.relative(rootDir, path.join(dirPath, file)))
        .replace(/\\/g, "/"),
    );
}

function getNextType(currentType) {
  switch (currentType) {
    case "category":
      return "model";
    case "model":
      return "type";
    default:
      return null;
  }
}

// Reads a leaf's hand-edited stats.json (in the script-id folder, next to
// the images) and attaches it to the leaf node. Hand-edited string values
// are normalized to typed values for the catalog: "True"/"False" become
// booleans, numeric strings become numbers, and slash-separated capacities
// such as "20 / 10" become their numeric total.
async function attachStats(leafItem, leafDir) {
  const statsFile = path.join(leafDir, "stats.json");
  try {
    const stats = JSON.parse(await fs.readFile(statsFile, "utf-8"));
    for (const [key, value] of Object.entries(stats)) {
      if (value === "True") stats[key] = true;
      else if (value === "False") stats[key] = false;
      else if (typeof value === "string" && value.trim() !== "") {
        const parts = value.split("/").map((part) => Number(part.trim()));
        if (parts.length > 1 && parts.every(Number.isFinite)) {
          stats[key] = parts.reduce((total, part) => total + part, 0);
        } else if (!Number.isNaN(Number(value))) {
          stats[key] = Number(value);
        }
      }
    }
    leafItem.stats = stats;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`vehicle without stats.json: ${leafItem.name}`);
    } else {
      console.warn(`invalid stats.json in ${leafDir}: ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const vehiclesDir = path.join(frontendRoot, "public", "vehicles", args.build);
  const baseImagePath = `/vehicles/${args.build}`;
  const outputFile = path.join(
    frontendRoot,
    "src",
    "data",
    "vehicles",
    `${args.build}.json`,
  );

  const categories = await processDirectory(
    vehiclesDir,
    "category",
    baseImagePath,
    vehiclesDir,
  );

  await fs.writeFile(
    outputFile,
    `${JSON.stringify({ version: args.build, categories }, null, 2)}\n`,
    "utf-8",
  );

  const countIds = (nodes) =>
    nodes.reduce(
      (n, node) => n + (node.id ? 1 : 0) + countIds(node.children ?? []),
      0,
    );
  console.log(
    `wrote ${outputFile}: ${categories.length} categories, ${countIds(categories)} vehicles`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
