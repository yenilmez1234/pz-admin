import type { Player } from "@bindings/internal/player/models";
import {
  Ban,
  Kick,
  RemoveFromWhitelist,
  SetAccessLevel,
  SetPassword,
  SetVoiceBanned,
  Unban,
} from "@bindings/internal/player/service";
import { executePlayerAction } from "../actionNotifications";

export function setVoiceBanned(targets: Player[], banned: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetVoiceBanned(playerIds, banned),
    partialFailurePath: "notifications.voiceBan",
    resultPath: banned
      ? "notifications.voiceBan.apply"
      : "notifications.voiceBan.remove",
  });
}

export function setAccessLevel(targets: Player[], accessLevel: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetAccessLevel(playerIds, accessLevel),
    partialFailurePath: "notifications.accessLevel",
    resultPath: "notifications.accessLevel",
  });
}

export function setPassword(targets: Player[], password: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetPassword(playerIds, password),
    partialFailurePath: "notifications.setPassword",
    resultPath: "notifications.setPassword",
  });
}

export function ban(targets: Player[], reason: string, banIP: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Ban(playerIds, reason, banIP),
    partialFailurePath: "notifications.ban",
    resultPath: "notifications.ban",
  });
}

export function kick(targets: Player[], reason: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Kick(playerIds, reason),
    partialFailurePath: "notifications.kick",
    resultPath: "notifications.kick",
  });
}

export function unban(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Unban(playerIds),
    partialFailurePath: "notifications.unban",
    resultPath: "notifications.unban",
  });
}

export function removeFromWhitelist(targets: Player[], deleteLocal: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => RemoveFromWhitelist(playerIds, deleteLocal),
    partialFailurePath: "notifications.removeFromWhitelist",
    resultPath: "notifications.removeFromWhitelist",
  });
}
