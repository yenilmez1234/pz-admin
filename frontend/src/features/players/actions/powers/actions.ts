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
    partialFailurePath: "notifications.godMode",
    resultPath: enabled
      ? "notifications.godMode.enable"
      : "notifications.godMode.disable",
  });
}

export function setInvisible(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetInvisible(playerIds, enabled),
    partialFailurePath: "notifications.invisible",
    resultPath: enabled
      ? "notifications.invisible.enable"
      : "notifications.invisible.disable",
  });
}

export function setNoClip(targets: Player[], enabled: boolean) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => SetNoClip(playerIds, enabled),
    partialFailurePath: "notifications.noClip",
    resultPath: enabled
      ? "notifications.noClip.enable"
      : "notifications.noClip.disable",
  });
}
