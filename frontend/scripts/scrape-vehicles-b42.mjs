#!/usr/bin/env node
// scrape-vehicles-b42.mjs — scrapes the b42 Project Zomboid Wiki and builds
// the public/vehicles/42/ tree directly: folder structure, images, and
// per-leaf stats.json files. Run `node scripts/generate-vehicle-catalog.mjs
// --version 42` afterwards to generate the catalog.
//
// Usage: node scripts/scrape-vehicles-b42.mjs
//
// List page: https://pzwiki.net/wiki/Vehicle — a vehicles table and a
// trailers table (both with a Vehicle ID column). Model pages (e.g.
// /wiki/Chevalier_D6) carry the full stats in the infobox sidebar and a
// variant table. Variant rows without a link are the base vehicle (stats and
// image from the model page); linked rows point at variant pages with their
// own sidebar stats and image. Rows whose Vehicle ID belongs to another list
// page model are sibling models and are ignored. Variants without an
// "Engine power" stat (burnt, wrecked) are skipped — but only when the model
// itself has engine power, since trailers legitimately lack it.
//
// Requests go through curl because the wiki blocks Node's HTTP client on TLS
// fingerprinting.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const WIKI = "https://pzwiki.net";
const LIST_PAGE = `${WIKI}/wiki/Vehicle`;
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
const FRONTEND_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Infobox labels mapped to stats.json keys. Labels not listed here and not in
// SKIP_LABELS are reported at the end.
const STAT_KEYS = {
  Weight: "weight",
  "Engine power": "enginePower",
  "Engine quality": "engineQuality",
  "Engine loudness": "engineLoudness",
  "Top speed": "topSpeed",
  "Suspension stiffness": "suspensionStiffness",
  "Occupant protection": "occupantProtection",
  Seats: "seats",
  Doors: "doors",
  Wheels: "wheels",
  "Glove box capacity": "gloveBox",
  "Trunk capacity": "trunkStorage",
  "Total storage": "totalStorage",
  "Animal size": "animalSize",
  Lightbar: "lightbar",
  "Roll influence": "rollInfluence",
  "Off-road efficiency": "offRoadEfficiency",
};
const SKIP_LABELS = new Set([
  "Manufacturer",
  "Base model",
  "Type",
  "Body",
  "Trunk type",
  "Mesh",
  "Vehicle ID",
]);

async function fetchText(url) {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sS",
      "-L",
      "-A",
      USER_AGENT,
      url,
    ]);
    return stdout;
  } catch (error) {
    throw new Error(
      `curl failed for ${url}: ${error.stderr?.toString().trim() ?? error}`,
    );
  }
}

async function fetchBuffer(url) {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      ["-sS", "-L", "-A", USER_AGENT, url],
      { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
    );
    return stdout;
  } catch (error) {
    throw new Error(
      `curl failed for ${url}: ${error.stderr?.toString().trim() ?? error}`,
    );
  }
}

const stripTags = (html) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// Decodes percent-encoding from hrefs ("Greene%27s" -> "Greene's").
const decodeUri = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function allTables(html) {
  return (html.match(/<table[\s\S]*?<\/table>/gi) ?? []).map((table) =>
    [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]),
  );
}

function rowCells(row) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => ({
    text: stripTags(m[1]),
    html: m[1],
  }));
}

const linkIn = (cellHtml) =>
  cellHtml.match(/href="(\/wiki\/[^"]+)"/)?.[1] ?? null;

const imgIn = (cellHtml) => cellHtml.match(/src="([^"]+)"/)?.[1] ?? null;

// /w/images/thumb/7/74/File.png/200px-File.png -> /w/images/7/74/File.png
const originalImageUrl = (thumbUrl) =>
  thumbUrl.replace(/\/thumb\//, "/").replace(/\/\d+px-[^/]+$/, "");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- infobox parsing --------------------------------------------------------

// All "infobox-item" divs on the page: {label, value} pairs from the sidebar.
// Inner divs may carry attributes on some pages, so they're matched loosely.
function parseInfobox(html) {
  const stats = {};
  const re =
    /<div class="infobox-item"><div(?:\s[^>]*)?>(.*?)<\/div><div(?:\s[^>]*)?>(.*?)<\/div><\/div>/gs;
  for (const match of html.matchAll(re)) {
    const label = stripTags(match[1]);
    const value = stripTags(match[2]);
    if (SKIP_LABELS.has(label)) continue;
    const key = STAT_KEYS[label];
    if (key) {
      stats[key] = value.replace(/ hp$/i, "");
    } else {
      stats._unknown ??= [];
      stats._unknown.push(label);
    }
  }
  return stats;
}

// The infobox preview image, at original size.
function parseInfoboxImage(html) {
  const at = html.indexOf('class="infobox-image"');
  if (at === -1) return null;
  const img = html.slice(at, at + 1500).match(/<img[^>]+src="([^"]+)"/);
  return img ? originalImageUrl(img[1]) : null;
}

// --- list / variant table parsing -------------------------------------------

// Rows of a table with a "Vehicle ID" header column:
// {name, type, id, links, image}. The image comes from the row's own
// thumbnail (cell 0) — per-variant images from the table survive page
// redirects better than the linked pages' infoboxes.
function variantRows(html) {
  for (const rows of allTables(html)) {
    const header = rowCells(rows[0] ?? "").map((cell) => cell.text);
    if (!header.includes("Vehicle ID")) continue;
    const out = [];
    for (const row of rows.slice(1)) {
      const cells = rowCells(row);
      if (cells.length < 3) continue;
      const rowImg = imgIn(cells[0]?.html ?? "");
      out.push({
        name: cells[1]?.text ?? "",
        type: cells[2]?.text ?? "",
        id: cells[cells.length - 1]?.text ?? "",
        links: [...cells[1].html.matchAll(/href="(\/wiki\/[^"]+)"/gi)]
          .map((m) => m[1])
          .filter((href) => !href.startsWith("/wiki/File:")),
        image: rowImg ? originalImageUrl(rowImg) : null,
      });
    }
    return out;
  }
  return [];
}

const sanitize = (name) => name.replace(/[/\\:*?"<>|]/g, "").trim();

function stripModelSuffix(name, modelName) {
  if (name.endsWith(modelName)) {
    return name.slice(0, -modelName.length).trim();
  }
  return name;
}

// "(camo)" -> "Camo"
const stripOuterParens = (name) =>
  name.replace(/^\((.*)\)$/, (_, inner) =>
    inner.replace(/^./, (c) => c.toUpperCase()),
  );

// "Chevalier Step Van (masonry)" -> "Masonry"; returns "" when the row name
// doesn't follow the "<model> (<variant>)" form.
function parenthesizedSuffix(name, modelName) {
  const rest = name.startsWith(modelName)
    ? name.slice(modelName.length).trim()
    : "";
  const match = rest.match(/^\((.*)\)$/);
  return match ? match[1].replace(/^./, (c) => c.toUpperCase()) : "";
}

// Special cases where the wiki's short names lose information the b41 hand
// tree kept (user, 2026-08-16). Keyed by script id.
const NAME_OVERRIDES = {
  "Base.CarTaxi": "Taxi (yellow)",
  "Base.CarTaxi2": "Taxi (green)",
};

function leafName(row, modelName, usedNames) {
  if (NAME_OVERRIDES[row.id]) {
    let name = NAME_OVERRIDES[row.id];
    if (usedNames.has(name)) name = `${name} 2`;
    usedNames.add(name);
    return name;
  }
  return deriveName(row, modelName, usedNames);
}

// Variant rows are often all named after the model (e.g. every Step Van
// business variant is "Chevalier Step Van (masonry)"), so the folder name
// derives from the parenthesized suffix, a name prefix ("Fire Department
// Chevalier D6" -> "Fire Department"), the variant page title, or a numeric
// collision suffix as last resort.
function deriveName(row, modelName, usedNames) {
  const stripped = stripModelSuffix(row.name, modelName).trim();
  const pageTitle = row.links[0]
    ? stripModelSuffix(
        decodeUri(row.links[0].replace("/wiki/", "").replace(/_/g, " ")),
        modelName,
      ).trim()
    : "";
  let name =
    parenthesizedSuffix(row.name, modelName) ||
    stripped ||
    parenthesizedSuffix(pageTitle, modelName) ||
    stripOuterParens(pageTitle) ||
    row.name;
  if (usedNames.has(name)) {
    const alt =
      parenthesizedSuffix(pageTitle, modelName) || stripOuterParens(pageTitle);
    name = alt && !usedNames.has(alt) ? alt : `${name} 2`;
  }
  usedNames.add(name);
  return name;
}

// --- main -------------------------------------------------------------------

async function main() {
  const listHtml = await fetchText(LIST_PAGE);
  const tables = allTables(listHtml).filter((rows) =>
    rowCells(rows[0] ?? "")
      .map((cell) => cell.text)
      .includes("Vehicle ID"),
  );
  if (tables.length !== 2) {
    throw new Error(
      `expected 2 model tables on ${LIST_PAGE}, found ${tables.length}`,
    );
  }
  const [vehicleTable, trailerTable] = tables;

  // Models: {name, type, id, link, category}
  const models = [];
  for (const [rows, category] of [
    [vehicleTable, null],
    [trailerTable, "Trailers"],
  ]) {
    for (const row of rows.slice(1)) {
      const cells = rowCells(row);
      if (cells.length < 3) continue;
      const name = cells[1]?.text ?? "";
      if (!name) continue;
      models.push({
        name,
        type: cells[2]?.text ?? "",
        id: cells[cells.length - 1]?.text ?? "",
        link: [...cells[1].html.matchAll(/href="(\/wiki\/[^"]+)"/gi)]
          .map((m) => m[1])
          .find((href) => !href.startsWith("/wiki/File:")),
        category: category ?? cells[2]?.text ?? "Standard",
      });
    }
  }
  console.log(`found ${models.length} models on the list page`);

  const modelIds = new Set(models.map((m) => m.id));
  const versionDir = path.join(FRONTEND_DIR, "public", "vehicles", "42");
  await mkdir(versionDir, { recursive: true });

  const pageCache = new Map(); // url -> html
  async function getPage(url) {
    if (!pageCache.has(url)) {
      pageCache.set(url, await fetchText(`${WIKI}${url}`));
    }
    return pageCache.get(url);
  }

  const imageCache = new Map(); // url -> saved filename
  const skipped = [];
  const unknownLabels = new Set();
  let leaves = 0;

  models.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );

  for (const model of models) {
    const modelUrl = model.link ?? `/wiki/${model.name.replace(/ /g, "_")}`;
    let modelHtml;
    try {
      modelHtml = await getPage(modelUrl);
    } catch (error) {
      console.warn(`  ${model.name}: failed to fetch ${modelUrl}: ${error}`);
      continue;
    }
    const modelStats = parseInfobox(modelHtml);
    for (const label of modelStats._unknown ?? []) unknownLabels.add(label);
    delete modelStats._unknown;
    const modelHasEngine = modelStats.enginePower !== undefined;
    const modelImage = parseInfoboxImage(modelHtml);

    const rows = variantRows(modelHtml).filter(
      (row) => row.id === model.id || !modelIds.has(row.id),
    );

    // Pages without a variant table are their own single leaf: treat the
    // model itself as the base variant row.
    if (rows.length === 0 && model.id) {
      rows.push({
        name: model.name,
        type: model.type,
        id: model.id,
        links: [],
      });
    }

    const accepted = [];
    const usedNames = new Set();
    for (const row of rows) {
      if (row.type === "Burnt") continue; // Base.*Burnt rows
      if (row.links.length > 0 && row.links[0] !== modelUrl) {
        // Variant page: fetch, check engine power, use its stats and image.
        let pageHtml;
        try {
          pageHtml = await getPage(row.links[0]);
        } catch (error) {
          console.warn(
            `  ${model.name}: failed to fetch ${row.links[0]}: ${error}`,
          );
          continue;
        }
        const stats = parseInfobox(pageHtml);
        for (const label of stats._unknown ?? []) unknownLabels.add(label);
        delete stats._unknown;
        if (modelHasEngine && stats.enginePower === undefined) {
          skipped.push(`${model.name} / ${row.name} (${row.id})`);
          continue;
        }
        accepted.push({
          name: leafName(row, model.name, usedNames),
          id: row.id,
          stats,
          // Table thumbnail first; the variant page's infobox is only a
          // fallback (some variant pages redirect and lose their image).
          image: row.image ?? parseInfoboxImage(pageHtml),
        });
      } else {
        // Base vehicle: stats and image from the model page. The wiki gives
        // the base variant no distinct name, so it's called "Normal" like the
        // hand-curated b41 tree.
        let name = "Normal";
        if (usedNames.has(name)) {
          name = `Normal ${usedNames.size}`;
        }
        usedNames.add(name);
        accepted.push({
          name,
          id: row.id,
          stats: modelStats,
          image: row.image ?? modelImage,
        });
      }
      await delay(250);
    }

    if (accepted.length === 0) {
      console.warn(`  ${model.name}: no variants accepted`);
      continue;
    }

    const modelDir = path.join(
      versionDir,
      sanitize(model.category),
      sanitize(model.name),
    );
    for (const leaf of accepted) {
      // Flatten single-variant models: {Category}/{Model}/{ScriptId}.
      const leafDir =
        accepted.length === 1
          ? path.join(modelDir, sanitize(leaf.id))
          : path.join(modelDir, sanitize(leaf.name), sanitize(leaf.id));
      await mkdir(leafDir, { recursive: true });
      await writeFile(
        path.join(leafDir, "stats.json"),
        JSON.stringify(leaf.stats, null, 2) + "\n",
      );

      if (leaf.image) {
        try {
          const filename = imageCache.has(leaf.image)
            ? imageCache.get(leaf.image)
            : `image${path.extname(new URL(`${WIKI}${leaf.image}`).pathname) || ".png"}`;
          imageCache.set(leaf.image, filename);
          const data = await fetchBuffer(`${WIKI}${leaf.image}`);
          await writeFile(path.join(leafDir, filename), data);
        } catch (error) {
          console.warn(
            `  ${model.name} / ${leaf.name}: image download failed: ${error}`,
          );
        }
      } else {
        console.warn(`  ${model.name} / ${leaf.name}: no infobox image`);
      }
      leaves++;
    }
    console.log(
      `  ${model.name}: ${accepted.length} leaf/leaves` +
        (accepted.length === 1 ? ` (${accepted[0].id})` : ""),
    );
    await delay(250);
  }

  console.log(`\ncreated ${leaves} leaves under public/vehicles/42/`);
  if (skipped.length > 0) {
    console.log(
      `skipped ${skipped.length} burnt/wrecked variants (no engine power):`,
    );
    for (const line of skipped.slice(0, 20)) console.log(`  - ${line}`);
    if (skipped.length > 20)
      console.log(`  ... and ${skipped.length - 20} more`);
  }
  if (unknownLabels.size > 0) {
    console.log(`\nunknown infobox labels: ${[...unknownLabels].join(", ")}`);
  }
  console.log(
    "\nrun `node scripts/generate-vehicle-catalog.mjs --version 42` to generate the catalog",
  );
}

main().catch((error) => {
  console.error("Error scraping b42 vehicles:", error);
  process.exitCode = 1;
});
