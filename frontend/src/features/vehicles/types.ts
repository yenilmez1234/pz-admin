export type { GameBuild } from "@/features/game/types";

import type { GameBuild } from "@/features/game/types";

export interface VehicleStats {
  animalSize?: number;
  doors?: number;
  engineLoudness?: number;
  enginePower?: number;
  engineQuality?: number;
  gloveBox?: number;
  lightbar?: boolean;
  occupantProtection?: number;
  offRoadEfficiency?: number;
  rollInfluence?: number;
  seats?: number;
  suspensionStiffness?: number;
  topSpeed?: number;
  totalStorage?: number;
  trunkStorage?: number;
  weight?: number;
  wheels?: number;
}

export interface VehicleCatalogEntry {
  build: GameBuild;
  category: string;
  id: string;
  image: string | null;
  name: string;
  stats: VehicleStats;
  variant: string | null;
}

export type VehicleNumericStat = Exclude<keyof VehicleStats, "lightbar">;

export interface VehicleStatRange {
  maximum: number;
  minimum: number;
}

export interface VehicleHierarchyVariant {
  id: string;
  name: string;
}

export interface VehicleHierarchyModel {
  name: string;
  variants: VehicleHierarchyVariant[];
}

export interface VehicleHierarchyCategory {
  models: VehicleHierarchyModel[];
  name: string;
}

export interface VehicleCatalog {
  build: GameBuild;
  hierarchy: VehicleHierarchyCategory[];
  lightbarAvailable: boolean;
  searchIndex: ReadonlyMap<string, string>;
  statRanges: Partial<Record<VehicleNumericStat, VehicleStatRange>>;
  variantsByVehicleId: ReadonlyMap<string, VehicleCatalogEntry[]>;
  vehicleIdsByHierarchyNode: ReadonlyMap<string, string[]>;
  vehiclesById: ReadonlyMap<string, VehicleCatalogEntry>;
  vehicles: VehicleCatalogEntry[];
}
