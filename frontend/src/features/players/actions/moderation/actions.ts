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
    successKey: banned
      ? "notifications.voiceBan.apply.successMessage"
      : "notifications.voiceBan.remove.successMessage",
  });
}

export function setAccessLevel(targets: Player[], accessLevel: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetAccessLevel(playerIds, accessLevel),
    successKey: "notifications.accessLevel.successMessage",
  });
}

export function setPassword(targets: Player[], password: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetPassword(playerIds, password),
    successKey: "notifications.setPassword.successMessage",
  });
}

export function ban(targets: Player[], reason: string, banIP: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Ban(playerIds, reason, banIP),
    successKey: "notifications.ban.successMessage",
  });
}

export function kick(targets: Player[], reason: string) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Kick(playerIds, reason),
    successKey: "notifications.kick.successMessage",
  });
}

export function unban(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Unban(playerIds),
    successKey: "notifications.unban.successMessage",
  });
}

export function removeFromWhitelist(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => RemoveFromWhitelist(playerIds),
    successKey: "notifications.removeFromWhitelist.successMessage",
  });
}
