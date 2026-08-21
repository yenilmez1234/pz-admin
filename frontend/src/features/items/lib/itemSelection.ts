import type { ItemSelection } from "../types";

/** Counts repeated IDs from Project Zomboid's comma-separated item list. */
export function parseItemSelection(value: string): ItemSelection {
  const selection = new Map<string, number>();
  for (const entry of value.split(",")) {
    const itemId = entry.trim();
    if (itemId) selection.set(itemId, (selection.get(itemId) ?? 0) + 1);
  }
  return selection;
}

/** Expands quantities because the game grants one item per repeated ID. */
export function serializeItemSelection(selection: ItemSelection): string {
  const items: string[] = [];
  for (const [itemId, quantity] of selection) {
    for (let count = 0; count < quantity; count += 1) items.push(itemId);
  }
  return items.join(",");
}
