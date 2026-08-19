import assert from "node:assert/strict";
import test from "node:test";
import {
  itemLootCategory,
  gameItemMetadata,
  lootCategoryTranslationKeys,
  translatedLootCategoryNames,
} from "./game-data.mjs";

function item(name, properties) {
  return { id: `Base.${name}`, name, properties };
}

test("classifies representative Build 42 loot groups", () => {
  const cases = [
    [
      "Bandage",
      { DisplayCategory: "FirstAid", ItemType: "base:normal" },
      "Medical",
    ],
    [
      "Apple",
      { DaysFresh: "5", DisplayCategory: "Food", ItemType: "base:food" },
      "Food",
    ],
    [
      "Beans",
      { CannedFood: "true", DisplayCategory: "Food", ItemType: "base:food" },
      "CannedFood",
    ],
    ["Axe", { DisplayCategory: "ToolWeapon", ItemType: "base:weapon" }, "Tool"],
    [
      "Pistol",
      { DisplayCategory: "Weapon", ItemType: "base:weapon", Ranged: "true" },
      "RangedWeapon",
    ],
    [
      "Generator",
      { DisplayCategory: "Misc", ItemType: "base:normal" },
      "Generator",
    ],
  ];

  for (const [name, properties, expected] of cases) {
    assert.equal(itemLootCategory(item(name, properties)), expected);
  }
});

test("falls back to Other when no loot rule matches", () => {
  assert.equal(
    itemLootCategory(
      item("Unclassified", {
        DisplayCategory: "Misc",
        ItemType: "base:normal",
      }),
    ),
    "Other",
  );
});

test("supports equivalent Build 41 item properties", () => {
  assert.equal(
    itemLootCategory(
      item("Pistol", {
        DisplayCategory: "Weapon",
        Ranged: "true",
        Type: "Weapon",
      }),
    ),
    "RangedWeapon",
  );
  assert.equal(
    itemLootCategory(
      item("FarmingSupply", {
        DisplayCategory: "Misc",
        Tags: "FarmingLoot",
        Type: "Normal",
      }),
    ),
    "Farming",
  );
});

test("normalizes equivalent metadata across builds", () => {
  const build41 = gameItemMetadata(
    item("Axe", {
      DisplayCategory: "ToolWeapon",
      Icon: "Axe",
      Tags: "ChopTree;CutPlant",
      Type: "Weapon",
    }),
    "Tool",
  );
  const build42 = gameItemMetadata(
    item("Axe", {
      DisplayCategory: "ToolWeapon",
      Icon: "Axe",
      ItemType: "base:weapon",
      Tags: "base:ChopTree;base:CutPlant",
    }),
    "Tool",
  );

  assert.deepEqual(build41, build42);
});

test("maps every loot category to its game translation", () => {
  const translations = Object.fromEntries(
    Object.entries(lootCategoryTranslationKeys).map(([category, key]) => [
      key,
      `Translated ${category}`,
    ]),
  );

  assert.deepEqual(
    translatedLootCategoryNames(translations),
    Object.fromEntries(
      Object.keys(lootCategoryTranslationKeys).map((category) => [
        category,
        `Translated ${category}`,
      ]),
    ),
  );
});
