import assert from "node:assert/strict";
import test from "node:test";
import { build42LootCategory } from "./game-item-catalog.mjs";

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
    assert.equal(build42LootCategory(item(name, properties)), expected);
  }
});

test("falls back to Other when no loot rule matches", () => {
  assert.equal(
    build42LootCategory(
      item("Unclassified", {
        DisplayCategory: "Misc",
        ItemType: "base:normal",
      }),
    ),
    "Other",
  );
});
