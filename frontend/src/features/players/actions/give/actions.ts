import type {
  ItemGrant,
  Player,
  XPGrant,
} from "@bindings/internal/player/models";
import { AddItems, AddVehicle, AddXP } from "@bindings/internal/player/service";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { executePlayerAction } from "../actionNotifications";

export function spawnVehicle(targets: Player[], vehicle: VehicleCatalogEntry) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => AddVehicle(playerIds, vehicle.id),
    partialFailurePath: "notifications.spawnVehicle",
    resultPath: "notifications.spawnVehicle",
    successValues: { vehicle: vehicle.name },
  });
}

export function giveItems(targets: Player[], items: ItemGrant[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => AddItems(playerIds, items),
    partialFailurePath: "notifications.giveItems",
    resultPath: "notifications.giveItems",
  });
}

export function addXp(targets: Player[], grants: XPGrant[]) {
  return executePlayerAction({
    targets,
    execute: (playerIds) => AddXP(playerIds, grants),
    partialFailurePath: "notifications.addXp",
    resultPath: "notifications.addXp",
  });
}
