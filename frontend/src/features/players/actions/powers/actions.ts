import type { Player } from "@bindings/internal/player/models";
import {
  SetGodMode,
  SetInvisible,
  SetNoClip,
} from "@bindings/internal/player/service";
import { executePlayerAction } from "../actionNotifications";

export function setGodMode(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetGodMode(playerIds, enabled),
    successKey: enabled
      ? "notifications.godMode.enable.successMessage"
      : "notifications.godMode.disable.successMessage",
  });
}

export function setInvisible(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetInvisible(playerIds, enabled),
    successKey: enabled
      ? "notifications.invisible.enable.successMessage"
      : "notifications.invisible.disable.successMessage",
  });
}

export function setNoClip(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetNoClip(playerIds, enabled),
    successKey: enabled
      ? "notifications.noClip.enable.successMessage"
      : "notifications.noClip.disable.successMessage",
  });
}
