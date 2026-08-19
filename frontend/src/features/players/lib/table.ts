import type { Player } from "@bindings/internal/player/models";
import {
  accessLevelRank,
  hasKnownAccessLevel,
  playerAccessLevel,
} from "./accessLevel";
import { isOnline } from "../status";

export type SortColumn = "accessLevel" | "status" | "username";
export type SortDirection = "asc" | "desc";

export interface PlayerSorting {
  column: SortColumn;
  direction: SortDirection;
}

export function lastSeenLabel(
  player: Player,
  relativeTime: Intl.RelativeTimeFormat,
) {
  const lastSeen = player.lastSeenOnlineAt.getTime();
  if (lastSeen <= 0) return null;

  const elapsed = Date.now() - lastSeen;
  if (isOnline(player)) return "online";

  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return relativeTime.format(-minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeTime.format(-hours, "hour");

  return relativeTime.format(-Math.floor(hours / 24), "day");
}

export function filterAndSortPlayers(
  players: Player[],
  search: string,
  language: string,
  sorting: PlayerSorting,
) {
  const query = search.trim().toLocaleLowerCase(language);
  const direction = sorting.direction === "asc" ? 1 : -1;

  return players
    .filter((player) =>
      player.username.toLocaleLowerCase(language).includes(query),
    )
    .sort((a, b) => {
      if (sorting.column === "accessLevel") {
        const aUnknown = !hasKnownAccessLevel(playerAccessLevel(a));
        const bUnknown = !hasKnownAccessLevel(playerAccessLevel(b));
        if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
      }

      let comparison: number;
      switch (sorting.column) {
        case "username":
          comparison = a.username.localeCompare(b.username, language);
          break;
        case "status":
          comparison =
            a.lastSeenOnlineAt.getTime() - b.lastSeenOnlineAt.getTime();
          break;
        case "accessLevel":
          comparison =
            accessLevelRank(playerAccessLevel(a)) -
            accessLevelRank(playerAccessLevel(b));
          break;
      }
      if (comparison === 0) {
        comparison = a.username.localeCompare(b.username, language);
      }
      return comparison * direction;
    });
}
