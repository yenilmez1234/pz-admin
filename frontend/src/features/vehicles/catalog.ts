import { vehicleNumericStats } from "./stats";
import type { GameBuild } from "@/features/game/types";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
  VehicleHierarchyCategory,
  VehicleNumericStat,
  VehicleStatRange,
  VehicleStats,
} from "./types";

interface RawVehicleNode {
  children?: RawVehicleNode[];
  id?: string;
  image?: string;
  name: string;
  stats?: VehicleStats;
  type: string;
}

interface RawVehicleCatalog {
  categories: RawVehicleNode[];
  version: string;
}

const catalogLoaders = {
  "41": () => import("@/data/vehicles/41.json"),
  "42": () => import("@/data/vehicles/42.json"),
} satisfies Record<GameBuild, () => Promise<{ default: RawVehicleCatalog }>>;

const catalogRequests = new Map<GameBuild, Promise<VehicleCatalog>>();

function prepareCatalog(
  catalog: RawVehicleCatalog,
  build: GameBuild,
): VehicleCatalog {
  const vehicles: VehicleCatalogEntry[] = [];
  const hierarchy: VehicleHierarchyCategory[] = [];
  const vehicleIdsByHierarchyNode = new Map<string, string[]>();

  for (const category of catalog.categories) {
    const preparedCategory: VehicleHierarchyCategory = {
      models: [],
      name: category.name,
    };

    for (const model of category.children ?? []) {
      if (model.type === "type") {
        if (model.id) {
          vehicles.push({
            build,
            category: category.name,
            id: model.id,
            image: model.image ?? null,
            name: model.name,
            stats: model.stats ?? {},
            variant: null,
          });
          preparedCategory.models.push({
            name: model.name,
            variants: [{ id: model.id, name: model.name }],
          });
        }
        continue;
      }

      const variants = [];
      for (const variant of model.children ?? []) {
        if (variant.type !== "type" || !variant.id) continue;
        vehicles.push({
          build,
          category: category.name,
          id: variant.id,
          image: variant.image ?? null,
          name: model.name,
          stats: variant.stats ?? {},
          variant: variant.name,
        });
        variants.push({ id: variant.id, name: variant.name });
      }
      if (variants.length > 0) {
        preparedCategory.models.push({ name: model.name, variants });
      }
    }

    if (preparedCategory.models.length > 0) {
      hierarchy.push(preparedCategory);
      const categoryVehicleIds: string[] = [];
      for (const model of preparedCategory.models) {
        const modelVehicleIds = model.variants.map((variant) => variant.id);
        categoryVehicleIds.push(...modelVehicleIds);
        vehicleIdsByHierarchyNode.set(
          `model:${preparedCategory.name}:${model.name}`,
          modelVehicleIds,
        );
      }
      vehicleIdsByHierarchyNode.set(
        `category:${preparedCategory.name}`,
        categoryVehicleIds,
      );
    }
  }

  const searchIndex = new Map<string, string>();
  for (const vehicle of vehicles) {
    searchIndex.set(
      vehicle.id,
      [vehicle.name, vehicle.variant, vehicle.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    );
  }

  const statRanges: Partial<Record<VehicleNumericStat, VehicleStatRange>> = {};
  for (const stat of vehicleNumericStats) {
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;
    for (const vehicle of vehicles) {
      const value = vehicle.stats[stat];
      if (value === undefined) continue;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    if (minimum !== Number.POSITIVE_INFINITY) {
      statRanges[stat] = { maximum, minimum };
    }
  }

  const vehiclesById = new Map(
    vehicles.map((vehicle) => [vehicle.id, vehicle]),
  );
  const variantsByVehicleId = new Map<string, VehicleCatalogEntry[]>();
  for (const category of hierarchy) {
    for (const model of category.models) {
      const variants = model.variants.flatMap((variant) => {
        const vehicle = vehiclesById.get(variant.id);
        return vehicle ? [vehicle] : [];
      });
      for (const variant of variants) {
        variantsByVehicleId.set(variant.id, variants);
      }
    }
  }

  return {
    build,
    hierarchy,
    lightbarAvailable: vehicles.some(
      (vehicle) => vehicle.stats.lightbar !== undefined,
    ),
    searchIndex,
    statRanges,
    variantsByVehicleId,
    vehicleIdsByHierarchyNode,
    vehiclesById,
    vehicles,
  };
}

export function loadVehicleCatalog(build: GameBuild): Promise<VehicleCatalog> {
  const existingRequest = catalogRequests.get(build);
  if (existingRequest) return existingRequest;

  const request = catalogLoaders[build]().then(({ default: catalog }) =>
    prepareCatalog(catalog, build),
  );
  catalogRequests.set(build, request);
  void request.catch(() => {
    if (catalogRequests.get(build) === request) catalogRequests.delete(build);
  });
  return request;
}
