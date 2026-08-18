import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { isOnline } from "./status";

const unknownAccessLevelRank = -2;

export type SortColumn = "accessLevel" | "status" | "username";
export type SortDirection = "asc" | "desc";

export interface PlayerSorting {
  column: SortColumn;
  direction: SortDirection;
}

export function accessLevelKey(accessLevel: string | null | undefined) {
  switch (accessLevel?.toLowerCase()) {
    case "none":
      return "none";
    case "user":
      return "user";
    case "priority":
      return "priority";
    case "banned":
      return "banned";
    case "gm":
      return "gm";
    case "admin":
      return "admin";
    case "moderator":
      return "moderator";
    case "overseer":
      return "overseer";
    case "observer":
      return "observer";
    default:
      return "unknown";
  }
}

export function accessLevelColor(accessLevel: string | null | undefined) {
  switch (accessLevel?.toLowerCase()) {
    case "admin":
      return "red";
    case "banned":
      return "red";
    case "moderator":
      return "green";
    case "overseer":
      return "cyan";
    case "gm":
      return "yellow";
    case "observer":
      return "gray";
    case "priority":
      return "violet";
    case "user":
    case "none":
      return "blue";
    default:
      return "gray";
  }
}

function accessLevelRank(accessLevel: string | null | undefined) {
  switch (accessLevel?.toLowerCase()) {
    case "admin":
      return 6;
    case "moderator":
      return 5;
    case "overseer":
      return 4;
    case "gm":
      return 3;
    case "observer":
      return 2;
    case "priority":
      return 1;
    case "banned":
      return -1;
    case "user":
    case "none":
      return 0;
    default:
      return unknownAccessLevelRank;
  }
}

export function playerAccessLevel(player: Player) {
  return player.banned ? "banned" : player.accessLevel;
}

export function hasProtectedModerationRole(player: Player, build: GameBuild) {
  if (build === "41") return false;

  const role = player.accessLevel?.toLowerCase();
  return role === "admin" || role === "moderator";
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
        const aUnknown =
          accessLevelRank(playerAccessLevel(a)) === unknownAccessLevelRank;
        const bUnknown =
          accessLevelRank(playerAccessLevel(b)) === unknownAccessLevelRank;
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
