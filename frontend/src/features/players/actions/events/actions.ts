import type { Player } from "@bindings/internal/player/models";
import {
  CreateHorde,
  Lightning,
  Thunder,
} from "@bindings/internal/player/service";
import { executePlayerAction } from "../actionNotifications";

export function createHorde(targets: Player[], count: number) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => CreateHorde(playerIds, count),
    partialFailurePath: "notifications.createHorde",
    resultPath: "notifications.createHorde",
  });
}

export function lightning(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Lightning(playerIds),
    partialFailurePath: "notifications.lightning",
    resultPath: "notifications.lightning",
  });
}

export function thunder(targets: Player[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => Thunder(playerIds),
    partialFailurePath: "notifications.thunder",
    resultPath: "notifications.thunder",
  });
}
