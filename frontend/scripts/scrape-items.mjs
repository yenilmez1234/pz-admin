#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import * as cheerio from "cheerio";
import prettier from "prettier";
import { disambiguateItemNames } from "./disambiguate-item-names.mjs";

const FRONTEND_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const USER_AGENT =
  "pz-admin item catalog generator (https://github.com/beyenilmez/pz-admin)";
const DOWNLOAD_CONCURRENCY = 8;
const DOWNLOAD_ATTEMPTS = 3;
const execFileAsync = promisify(execFile);

const sources = {
  41: {
    defaultRevision: 512551,
    liveUrl: null,
  },
  42: {
    defaultRevision: null,
    liveUrl: "https://pzwiki.net/wiki/PZwiki:Item_list",
  },
};

function parseArgs(argv) {
  const args = { build: "41", revision: undefined, skipImages: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--build") args.build = argv[++index];
    else if (argv[index] === "--revision") args.revision = argv[++index];
    else if (argv[index] === "--skip-images") args.skipImages = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!sources[args.build]) {
    throw new Error(`Unsupported build: ${args.build}`);
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

export function resolveItemWikiSource(build, requestedRevision) {
  const configuredSource = sources[build];
  const revision =
    requestedRevision === "latest"
      ? null
      : requestedRevision === undefined
        ? configuredSource.defaultRevision
        : Number(requestedRevision);

  if (revision === null && configuredSource.liveUrl === null) {
    throw new Error(`Build ${build} does not have a live wiki source`);
  }

  return {
    revision,
    url:
      revision === null
        ? configuredSource.liveUrl
        : `https://pzwiki.net/w/index.php?oldid=${revision}`,
  };
}

async function fetchResponse(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response;
}

async function fetchCatalogHtml(url) {
  const { stdout } = await execFileAsync(
    "curl",
    ["-L", "--fail", "--silent", "--show-error", "-A", USER_AGENT, url],
    { maxBuffer: 5 * 1024 * 1024 },
  );
  return stdout;
}

function imageExtension(imageUrl) {
  const extension = path.extname(new URL(imageUrl).pathname).toLowerCase();
  return [".gif", ".jpeg", ".jpg", ".png", ".webp"].includes(extension)
    ? extension
    : ".png";
}

function imageFilename(itemId, index, imageUrl) {
  const safeId = itemId.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
  return `${safeId}_${index}${imageExtension(imageUrl)}`;
}

export function parseItemWikiCatalog(html, build, source) {
  const $ = cheerio.load(html);
  const categories = [];
  const itemIds = new Set();
  const downloads = [];

  function parseItem(row, items) {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const name = cells.eq(1).text().trim();
    const id = cells.last().text().trim();
    if (!name || !id) return;
    if (itemIds.has(id)) throw new Error(`Duplicate item ID: ${id}`);
    itemIds.add(id);

    const imageUrls = cells
      .eq(0)
      .find("img")
      .map((_, image) => $(image).attr("src"))
      .get()
      .filter(Boolean)
      .map((imageUrl) => new URL(imageUrl, source.url).href);
    const images = imageUrls.map((imageUrl, index) => {
      const filename = imageFilename(id, index, imageUrl);
      downloads.push({ filename, imageUrl });
      return `/items/${build}/${filename}`;
    });

    items.push({ id, images, name });
  }

  const unifiedTable = $("table.wikitable").filter(
    (_, table) => $(table).find("h3").length > 0,
  );
  if (unifiedTable.length > 0) {
    let currentCategory = null;
    unifiedTable
      .first()
      .find("tr")
      .each((_, row) => {
        const categoryName = $(row).find("h3").first().text().trim();
        if (categoryName) {
          currentCategory = { items: [], name: categoryName };
          categories.push(currentCategory);
        } else if (currentCategory) {
          parseItem(row, currentCategory.items);
        }
      });
  } else {
    $("h2").each((_, heading) => {
      const categoryName = $(heading).text().trim();
      const table = $(heading).nextAll("table.wikitable").first();
      if (!categoryName || table.length === 0) return;

      const items = [];
      table.find("tbody tr").each((__, row) => parseItem(row, items));
      if (items.length > 0) categories.push({ items, name: categoryName });
    });
  }

  for (let index = categories.length - 1; index >= 0; index -= 1) {
    if (categories[index].items.length === 0) categories.splice(index, 1);
  }

  if (categories.length === 0 || itemIds.size === 0) {
    throw new Error(
      "No item categories were found; the wiki structure changed",
    );
  }

  const disambiguatedNames = disambiguateItemNames(
    categories.flatMap((category) => category.items),
  );
  for (const category of categories) {
    for (const item of category.items)
      item.name = disambiguatedNames.get(item.id);
  }

  const revision =
    source.revision ?? Number(html.match(/"wgRevisionId":(\d+)/)?.[1]);
  if (!revision) {
    throw new Error("Could not determine the wiki revision");
  }

  return {
    catalog: {
      build,
      categories,
      source: {
        revision,
        url: source.url,
      },
    },
    downloads,
  };
}

async function downloadImage(download, outputDirectory) {
  const destination = path.join(outputDirectory, download.filename);
  try {
    await fs.access(destination);
    return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchResponse(download.imageUrl);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) {
        throw new Error(
          `Expected an image, received ${contentType || "unknown"}`,
        );
      }
      await fs.writeFile(
        destination,
        Buffer.from(await response.arrayBuffer()),
      );
      return;
    } catch (error) {
      if (attempt === DOWNLOAD_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}

export async function downloadItemWikiImages(downloads, outputDirectory) {
  await fs.mkdir(outputDirectory, { recursive: true });
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < downloads.length) {
      const download = downloads[nextIndex++];
      await downloadImage(download, outputDirectory);
    }
  }

  await Promise.all(
    Array.from({ length: DOWNLOAD_CONCURRENCY }, () => worker()),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = resolveItemWikiSource(args.build, args.revision);
  const html = await fetchCatalogHtml(source.url);
  const { catalog, downloads } = parseItemWikiCatalog(html, args.build, source);

  if (!args.skipImages) {
    await downloadItemWikiImages(
      downloads,
      path.join(FRONTEND_DIR, "public", "items", args.build),
    );
  }

  const outputPath = path.join(
    FRONTEND_DIR,
    "src",
    "data",
    "items",
    `${args.build}.json`,
  );
  const formattedCatalog = await prettier.format(JSON.stringify(catalog), {
    parser: "json",
  });
  await fs.writeFile(outputPath, formattedCatalog);

  const itemCount = catalog.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
  console.log(
    `wrote ${outputPath}: ${catalog.categories.length} categories, ${itemCount} items, ${downloads.length} images`,
  );
}

const invokedPath = process.argv[1] && path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export async function scrapeItemWikiCatalog(build, requestedRevision) {
  const source = resolveItemWikiSource(build, requestedRevision);
  const html = await fetchCatalogHtml(source.url);
  return parseItemWikiCatalog(html, build, source);
}
