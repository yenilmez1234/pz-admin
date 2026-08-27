import type { Player } from "@bindings/internal/player/models";

export function isOnline(player: Player) {
  const lastSeen = player.lastSeenOnlineAt.getTime();
  const lastKnownOffline = player.lastKnownOfflineAt.getTime();
  return lastSeen > lastKnownOffline;
}
