import type { TFunction } from "i18next";
import type { VehicleNumericStat, VehicleStats } from "./types";

export const primaryVehicleFilterStats = [
  "enginePower",
  "topSpeed",
  "seats",
  "totalStorage",
  "trunkStorage",
  "weight",
] as const satisfies readonly VehicleNumericStat[];

export const advancedVehicleFilterStats = [
  "engineQuality",
  "engineLoudness",
  "suspensionStiffness",
  "occupantProtection",
  "gloveBox",
  "offRoadEfficiency",
  "rollInfluence",
  "doors",
  "wheels",
  "animalSize",
] as const satisfies readonly VehicleNumericStat[];

export const vehicleNumericStats = [
  ...primaryVehicleFilterStats,
  ...advancedVehicleFilterStats,
] as const;

export type VehicleRangeFilterStat = (typeof vehicleNumericStats)[number];

export type VehicleRangeFilters = Partial<
  Record<VehicleRangeFilterStat, [number, number]>
>;

export const vehicleSortFields = [
  "name",
  "enginePower",
  "topSpeed",
  "seats",
  "totalStorage",
  "weight",
] as const;

export const vehicleDetailSections = [
  {
    key: "performance",
    stats: [
      "enginePower",
      "topSpeed",
      "engineQuality",
      "engineLoudness",
      "weight",
      "suspensionStiffness",
      "offRoadEfficiency",
      "rollInfluence",
    ],
  },
  {
    key: "capacity",
    stats: ["seats", "totalStorage", "trunkStorage", "gloveBox", "animalSize"],
  },
  {
    key: "body",
    stats: ["occupantProtection", "doors", "wheels", "lightbar"],
  },
] as const satisfies ReadonlyArray<{
  key: "body" | "capacity" | "performance";
  stats: readonly (keyof VehicleStats)[];
}>;

export function formatVehicleStat(
  t: TFunction<"vehicles">,
  stat: keyof VehicleStats,
  value: boolean | number | undefined,
): string {
  if (value === undefined) return "—";
  if (stat === "lightbar") {
    return t(value ? "filters.boolean.yes" : "filters.boolean.no");
  }
  if (typeof value !== "number") return String(value);
  if (stat === "enginePower") {
    return t("browser.values.enginePower", { value });
  }
  if (stat === "topSpeed") {
    return t("browser.values.topSpeed", { value });
  }
  if (stat === "weight") return t("details.values.weight", { value });
  if (stat === "seats") return t("browser.values.seats", { count: value });
  if (
    stat === "gloveBox" ||
    stat === "totalStorage" ||
    stat === "trunkStorage"
  ) {
    return t("browser.values.storage", { count: value });
  }
  return String(value);
}
