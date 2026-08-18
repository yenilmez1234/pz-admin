import type { Player } from "@bindings/internal/player/models";

const onlineThreshold = 60_000;

export function isOnline(player: Player) {
  const lastSeen = player.lastSeenOnlineAt.getTime();
  const lastKnownOffline = player.lastKnownOfflineAt.getTime();
  return lastSeen > lastKnownOffline && Date.now() - lastSeen < onlineThreshold;
}
