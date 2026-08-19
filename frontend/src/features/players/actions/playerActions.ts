import type {
  ActionResult,
  ItemGrant,
  Player,
  XPGrant,
} from "@bindings/internal/player/models";
import {
  AddItems,
  AddLocalUser,
  AddUser,
  AddVehicle,
  AddXP,
  Ban,
  CreateHorde,
  Kick,
  Lightning,
  RemoveFromWhitelist,
  SetAccessLevel,
  SetGodMode,
  SetInvisible,
  SetNoClip,
  SetPassword,
  SetVoiceBanned,
  Teleport,
  TeleportToCoordinates,
  Thunder,
  Unban,
} from "@bindings/internal/player/service";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import i18n from "@/i18n";
import { runPlayerAction, runPlayerOperation } from "./runPlayerAction";

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

interface ExecuteActionOptions {
  execute: (playerIds: string[]) => PromiseLike<ActionResult>;
  partialFailurePath: PartialFailurePath;
  resultPath: ActionResultPath;
  successValues?: Record<string, unknown>;
  targets: Player[];
}

// Player action notifications share one translation shape. Keeping that
// convention here prevents each backend action from repeating the same wiring.
function executeAction({
  execute,
  partialFailurePath,
  resultPath,
  successValues,
  targets,
}: ExecuteActionOptions) {
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

export function addServerUser(username: string, password: string) {
  return runPlayerOperation({
    execute: () => AddUser(username, password),
    successTitle: t("notifications.addServerUser.successTitle"),
    successMessage: t("notifications.addServerUser.successMessage", {
      username,
    }),
    failureTitle: t("notifications.addServerUser.failureTitle"),
  });
}

export function addLocalPlayer(username: string) {
  return runPlayerOperation({
    execute: () => AddLocalUser(username),
    successTitle: t("notifications.addLocalPlayer.successTitle"),
    successMessage: t("notifications.addLocalPlayer.successMessage", {
      username,
    }),
    failureTitle: t("notifications.addLocalPlayer.failureTitle"),
  });
}

export function setGodMode(targets: Player[], enabled: boolean) {
  return executeAction({
    targets,
    execute: (playerIds) => SetGodMode(playerIds, enabled),
    partialFailurePath: "notifications.godMode",
    resultPath: enabled
      ? "notifications.godMode.enable"
      : "notifications.godMode.disable",
  });
}

export function setInvisible(targets: Player[], enabled: boolean) {
  return executeAction({
    targets,
    execute: (playerIds) => SetInvisible(playerIds, enabled),
    partialFailurePath: "notifications.invisible",
    resultPath: enabled
      ? "notifications.invisible.enable"
      : "notifications.invisible.disable",
  });
}

export function setNoClip(targets: Player[], enabled: boolean) {
  return executeAction({
    targets,
    execute: (playerIds) => SetNoClip(playerIds, enabled),
    partialFailurePath: "notifications.noClip",
    resultPath: enabled
      ? "notifications.noClip.enable"
      : "notifications.noClip.disable",
  });
}

export function spawnVehicle(targets: Player[], vehicle: VehicleCatalogEntry) {
  return executeAction({
    targets,
    execute: (playerIds) => AddVehicle(playerIds, vehicle.id),
    partialFailurePath: "notifications.spawnVehicle",
    resultPath: "notifications.spawnVehicle",
    successValues: { vehicle: vehicle.name },
  });
}

export function giveItems(targets: Player[], items: ItemGrant[]) {
  return executeAction({
    targets,
    execute: (playerIds) => AddItems(playerIds, items),
    partialFailurePath: "notifications.giveItems",
    resultPath: "notifications.giveItems",
  });
}

export function addXp(targets: Player[], grants: XPGrant[]) {
  return executeAction({
    targets,
    execute: (playerIds) => AddXP(playerIds, grants),
    partialFailurePath: "notifications.addXp",
    resultPath: "notifications.addXp",
  });
}

export function setVoiceBanned(targets: Player[], banned: boolean) {
  return executeAction({
    targets,
    execute: (playerIds) => SetVoiceBanned(playerIds, banned),
    partialFailurePath: "notifications.voiceBan",
    resultPath: banned
      ? "notifications.voiceBan.apply"
      : "notifications.voiceBan.remove",
  });
}

export function setAccessLevel(targets: Player[], accessLevel: string) {
  return executeAction({
    targets,
    execute: (playerIds) => SetAccessLevel(playerIds, accessLevel),
    partialFailurePath: "notifications.accessLevel",
    resultPath: "notifications.accessLevel",
  });
}

export function setPassword(targets: Player[], password: string) {
  return executeAction({
    targets,
    execute: (playerIds) => SetPassword(playerIds, password),
    partialFailurePath: "notifications.setPassword",
    resultPath: "notifications.setPassword",
  });
}

export function ban(targets: Player[], reason: string, banIP: boolean) {
  return executeAction({
    targets,
    execute: (playerIds) => Ban(playerIds, reason, banIP),
    partialFailurePath: "notifications.ban",
    resultPath: "notifications.ban",
  });
}

export function kick(targets: Player[], reason: string) {
  return executeAction({
    targets,
    execute: (playerIds) => Kick(playerIds, reason),
    partialFailurePath: "notifications.kick",
    resultPath: "notifications.kick",
  });
}

export function unban(targets: Player[]) {
  return executeAction({
    targets,
    execute: (playerIds) => Unban(playerIds),
    partialFailurePath: "notifications.unban",
    resultPath: "notifications.unban",
  });
}

export function removeFromWhitelist(targets: Player[], deleteLocal: boolean) {
  return executeAction({
    targets,
    execute: (playerIds) => RemoveFromWhitelist(playerIds, deleteLocal),
    partialFailurePath: "notifications.removeFromWhitelist",
    resultPath: "notifications.removeFromWhitelist",
  });
}

export function teleportToPlayer(targets: Player[], targetPlayerId: string) {
  return executeAction({
    targets,
    execute: (playerIds) => Teleport(playerIds, targetPlayerId),
    partialFailurePath: "notifications.teleport",
    resultPath: "notifications.teleport",
  });
}

export function teleportToCoordinates(targets: Player[], coordinates: string) {
  return executeAction({
    targets,
    execute: (playerIds) => TeleportToCoordinates(playerIds, coordinates),
    partialFailurePath: "notifications.teleport",
    resultPath: "notifications.teleport",
  });
}

export function createHorde(targets: Player[], count: number) {
  return executeAction({
    targets,
    execute: (playerIds) => CreateHorde(playerIds, count),
    partialFailurePath: "notifications.createHorde",
    resultPath: "notifications.createHorde",
  });
}

export function lightning(targets: Player[]) {
  return executeAction({
    targets,
    execute: (playerIds) => Lightning(playerIds),
    partialFailurePath: "notifications.lightning",
    resultPath: "notifications.lightning",
  });
}

export function thunder(targets: Player[]) {
  return executeAction({
    targets,
    execute: (playerIds) => Thunder(playerIds),
    partialFailurePath: "notifications.thunder",
    resultPath: "notifications.thunder",
  });
}
