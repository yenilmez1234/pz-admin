import fs from "node:fs/promises";
import path from "node:path";
import { findTranslationDirectory } from "../../translations/game-files.mjs";

const LOOT_CATEGORY_TRANSLATION_KEYS = {
  Ammo: "Sandbox_AmmoLootNew",
  CannedFood: "Sandbox_CannedFoodLootNew",
  Clothing: "Sandbox_ClothingLootNew",
  Container: "Sandbox_ContainerLootNew",
  Cookware: "Sandbox_CookwareLootNew",
  Farming: "Sandbox_FarmingLootNew",
  Food: "Sandbox_FoodLootNew",
  Generator: "Sandbox_GeneratorLootNew",
  Key: "Sandbox_KeyLootNew",
  Literature: "Sandbox_LiteratureLootNew",
  Material: "Sandbox_MaterialLootNew",
  Mechanics: "Sandbox_MechanicsLootNew",
  Medical: "Sandbox_MedicalLootNew",
  Media: "Sandbox_MediaLootNew",
  Memento: "Sandbox_MementoLootNew",
  Other: "Sandbox_OtherLootNew",
  RangedWeapon: "Sandbox_RangedWeaponLootNew",
  RecipeResource: "Sandbox_RecipeResourceLoot",
  SkillBook: "Sandbox_SkillBookLoot",
  SurvivalGears: "Sandbox_SurvivalGearsLootNew",
  Tool: "Sandbox_ToolLootNew",
  Weapon: "Sandbox_WeaponLootNew",
};

export const lootCategoryOrder = Object.keys(LOOT_CATEGORY_TRANSLATION_KEYS);

async function isDirectory(directory) {
  try {
    return (await fs.stat(directory)).isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function findGameScriptsDirectory(gameDirectory) {
  const candidates = [
    path.join(gameDirectory, "media", "scripts"),
    path.join(gameDirectory, "projectzomboid", "media", "scripts"),
    path.join(gameDirectory, "Contents", "Java", "media", "scripts"),
    path.join(
      gameDirectory,
      "Contents",
      "Resources",
      "Java",
      "media",
      "scripts",
    ),
  ];

  for (const candidate of candidates) {
    if (await isDirectory(candidate)) return candidate;
  }

  throw new Error(
    `Could not find media${path.sep}scripts inside ${gameDirectory}`,
  );
}

async function textFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await textFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith(".txt"))
      files.push(entryPath);
  }
  return files;
}

function propertyValue(value) {
  const trimmed = value.trim().replace(/,$/, "").trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseItemBlocks(content, sourcePath) {
  const lines = content.split(/\r?\n/);
  const items = [];
  let moduleName = null;

  for (let index = 0; index < lines.length; index += 1) {
    const moduleMatch = lines[index].match(/^\s*module\s+(\S+)/);
    if (moduleMatch) moduleName = moduleMatch[1];

    const itemMatch = lines[index].match(/^\s*item\s+(\S+)\s*$/);
    if (!itemMatch || !moduleName) continue;

    let openingLine = index + 1;
    while (openingLine < lines.length && lines[openingLine].trim() === "") {
      openingLine += 1;
    }
    if (lines[openingLine]?.trim() !== "{") continue;

    const properties = {};
    let closingLine = openingLine + 1;
    for (; closingLine < lines.length; closingLine += 1) {
      if (lines[closingLine].trim() === "}") break;
      const propertyMatch = lines[closingLine].match(
        /^\s*([A-Za-z][A-Za-z0-9]*)\s*=\s*(.*?)\s*$/,
      );
      if (propertyMatch) {
        properties[propertyMatch[1]] = propertyValue(propertyMatch[2]);
      }
    }
    if (closingLine === lines.length) {
      throw new Error(
        `Unclosed item ${moduleName}.${itemMatch[1]} in ${sourcePath}`,
      );
    }

    items.push({
      id: `${moduleName}.${itemMatch[1]}`,
      name: itemMatch[1],
      properties,
      sourcePath,
    });
    index = closingLine;
  }

  return items;
}

function booleanProperty(properties, name) {
  return properties[name]?.toLowerCase() === "true";
}

function itemType(properties) {
  return properties.ItemType?.split(":").at(-1)?.toLowerCase() ?? null;
}

function itemTags(properties) {
  return (properties.Tags ?? "")
    .split(";")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

// Mirrors Build 42's ItemPickerJava.getLootType ordering. Keeping the rules
// here makes the generated category explainable and testable without starting
// the game runtime.
export function build42LootCategory(item) {
  const { properties } = item;
  const category = properties.DisplayCategory ?? null;
  const type = itemType(properties);
  const tags = new Set(itemTags(properties));
  const hasTag = (tag) => tags.has(`base:${tag}`);

  if (
    item.name === "Generator" ||
    item.id === "Base.Generator" ||
    hasTag("generator")
  )
    return "Generator";
  if (hasTag("ismemento") || category === "Memento") return "Memento";
  if (
    booleanProperty(properties, "Medical") ||
    ["FirstAid", "FirstAidWeapon"].includes(category)
  )
    return "Medical";
  if (
    booleanProperty(properties, "MechanicsItem") ||
    ["VehicleMaintenance", "VehicleMaintenanceWeapon"].includes(category)
  )
    return "Mechanics";
  if (["Material", "MaterialWeapon"].includes(category)) return "Material";
  if (
    ["Gardening", "GardeningWeapon"].includes(category) ||
    hasTag("farmingloot")
  )
    return "Farming";
  if (["Tool", "ToolWeapon"].includes(category)) return "Tool";
  if (["Cooking", "CookingWeapon"].includes(category)) return "Cookware";
  if (
    booleanProperty(properties, "SurvivalGear") ||
    ["Fishing", "FishingWeapon", "Trapping", "Camping", "FireSource"].includes(
      category,
    )
  )
    return "SurvivalGears";

  if (type === "food" || category === "Food") {
    const daysFresh = Number(properties.DaysFresh ?? 1_000_000_000);
    if (
      booleanProperty(properties, "CannedFood") ||
      daysFresh === 1_000_000_000 ||
      type !== "food"
    )
      return "CannedFood";
    return "Food";
  }
  if (
    category === "Ammo" ||
    hasTag("ammocase") ||
    (type === "normal" && properties.AmmoType)
  )
    return "Ammo";
  if (type === "weapon" && !booleanProperty(properties, "Ranged"))
    return "Weapon";
  if (
    type === "weaponpart" ||
    (type === "weapon" && booleanProperty(properties, "Ranged")) ||
    hasTag("firearmloot")
  )
    return "RangedWeapon";
  if (["key", "keyring"].includes(type) || hasTag("keyring")) return "Key";
  if (
    Number(properties.Capacity ?? 0) > 0 ||
    type === "container" ||
    category === "Bag"
  )
    return "Container";
  if (category === "SkillBook") return "SkillBook";
  if (category === "RecipeResource") return "RecipeResource";
  if (type === "literature") return "Literature";
  if (type === "clothing") return "Clothing";
  if (properties.MediaCategory) return "Media";
  return "Other";
}

export async function readGameItems(gameDirectory, build) {
  if (build !== "42") {
    throw new Error("Hybrid item extraction currently supports Build 42 only");
  }

  const scriptsDirectory = await findGameScriptsDirectory(gameDirectory);
  const definitions = new Map();
  for (const sourcePath of await textFiles(scriptsDirectory)) {
    const content = await fs.readFile(sourcePath, "utf8");
    for (const item of parseItemBlocks(content, sourcePath)) {
      // Actual inventory definitions have both fields. Other script constructs
      // can also use `item` blocks and are intentionally ignored.
      if (!item.properties.ItemType || !item.properties.DisplayCategory)
        continue;
      const previous = definitions.get(item.id);
      if (previous && previous.sourcePath !== item.sourcePath) {
        throw new Error(`Duplicate game item definition: ${item.id}`);
      }
      // Generated files occasionally redefine an item later in the same file.
      // The game uses the later definition, so the extractor does too.
      definitions.set(item.id, item);
    }
  }
  return definitions;
}

export async function readEnglishItemMetadata(gameDirectory) {
  const translationDirectory = await findTranslationDirectory(gameDirectory);
  const englishDirectory = path.join(translationDirectory, "EN");
  const [names, sandbox] = await Promise.all([
    fs
      .readFile(path.join(englishDirectory, "ItemName.json"), "utf8")
      .then((content) => JSON.parse(content)),
    fs
      .readFile(path.join(englishDirectory, "Sandbox.json"), "utf8")
      .then((content) => JSON.parse(content)),
  ]);
  const lootCategoryNames = Object.fromEntries(
    Object.entries(LOOT_CATEGORY_TRANSLATION_KEYS).map(([category, key]) => {
      const name = sandbox[key];
      if (typeof name !== "string")
        throw new Error(`Missing game translation: ${key}`);
      return [category, name];
    }),
  );
  return { lootCategoryNames, names };
}

export function gameItemMetadata(item, lootCategory) {
  return {
    displayCategory: item.properties.DisplayCategory,
    icon: item.properties.Icon ?? null,
    itemType: item.properties.ItemType,
    lootCategory,
    tags: itemTags(item.properties),
  };
}
