import type { ActionResult, Player } from "@bindings/internal/player/models";
import i18n from "@/i18n";
import { runPlayerAction } from "./runPlayerAction";

const t = i18n.getFixedT(null, "players");

type ActionResultPath =
  | "notifications.accessLevel"
  | "notifications.addXp"
  | "notifications.ban"
  | "notifications.createHorde"
  | "notifications.giveItems"
  | "notifications.godMode.disable"
  | "notifications.godMode.enable"
  | "notifications.invisible.disable"
  | "notifications.invisible.enable"
  | "notifications.kick"
  | "notifications.lightning"
  | "notifications.noClip.disable"
  | "notifications.noClip.enable"
  | "notifications.removeFromWhitelist"
  | "notifications.setPassword"
  | "notifications.spawnVehicle"
  | "notifications.teleport"
  | "notifications.thunder"
  | "notifications.unban"
  | "notifications.voiceBan.apply"
  | "notifications.voiceBan.remove";

type PartialFailurePath =
  | "notifications.accessLevel"
  | "notifications.addXp"
  | "notifications.ban"
  | "notifications.createHorde"
  | "notifications.giveItems"
  | "notifications.godMode"
  | "notifications.invisible"
  | "notifications.kick"
  | "notifications.lightning"
  | "notifications.noClip"
  | "notifications.removeFromWhitelist"
  | "notifications.setPassword"
  | "notifications.spawnVehicle"
  | "notifications.teleport"
  | "notifications.thunder"
  | "notifications.unban"
  | "notifications.voiceBan";

interface ExecutePlayerActionOptions {
  execute: (playerIds: string[]) => PromiseLike<ActionResult>;
  partialFailurePath: PartialFailurePath;
  resultPath: ActionResultPath;
  successValues?: Record<string, unknown>;
  targets: Player[];
}

// All player action translations use this shared result shape.
export function executePlayerAction({
  execute,
  partialFailurePath,
  resultPath,
  successValues,
  targets,
}: ExecutePlayerActionOptions) {
  return runPlayerAction({
    targets,
    execute,
    successTitle: t(`${resultPath}.successTitle`),
    successMessage: (successfulTargets) =>
      t(`${resultPath}.successMessage`, {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
        ...successValues,
      }),
    failureTitle: t(`${resultPath}.failureTitle`),
    partialFailureTitle: t(`${partialFailurePath}.partialFailureTitle`),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t(`${partialFailurePath}.partialFailureMessage`, {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}
