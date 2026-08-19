import { vehicleNumericStats } from "./lib/stats";
import i18n from "@/i18n";
import { canonicalLanguage, defaultLanguage } from "@/i18n/locales";
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

const catalogRequests = new Map<string, Promise<VehicleCatalog>>();

function normalVariantFirst(
  left: { name: string },
  right: { name: string },
): number {
  return Number(right.name === "Normal") - Number(left.name === "Normal");
}

function translatedName(translations: Record<string, string>, name: string) {
  return translations[name] ?? name;
}

function prepareCatalog(
  catalog: RawVehicleCatalog,
  build: GameBuild,
  language: string,
): VehicleCatalog {
  const t = i18n.getFixedT(language, "vehicles");
  const categoryNames: Record<string, string> = t("catalog.categories", {
    returnObjects: true,
  });
  const modelNames: Record<string, string> = t("catalog.models", {
    returnObjects: true,
  });
  const variantNames: Record<string, string> = t("catalog.variants", {
    returnObjects: true,
  });
  const vehicles: VehicleCatalogEntry[] = [];
  const hierarchy: VehicleHierarchyCategory[] = [];
  const vehicleIdsByHierarchyNode = new Map<string, string[]>();
  const originalNamesByVehicleId = new Map<string, string[]>();

  for (const category of catalog.categories) {
    const categoryName = translatedName(categoryNames, category.name);
    const preparedCategory: VehicleHierarchyCategory = {
      models: [],
      name: categoryName,
    };

    for (const model of category.children ?? []) {
      const modelName = translatedName(modelNames, model.name);
      if (model.type === "type") {
        if (model.id) {
          vehicles.push({
            build,
            category: categoryName,
            id: model.id,
            image: model.image ?? null,
            name: modelName,
            stats: model.stats ?? {},
            variant: null,
          });
          preparedCategory.models.push({
            name: modelName,
            variants: [{ id: model.id, name: modelName }],
          });
          originalNamesByVehicleId.set(model.id, [model.name]);
        }
        continue;
      }

      const variants = [];
      const rawVariants = [...(model.children ?? [])].sort(normalVariantFirst);
      for (const variant of rawVariants) {
        if (variant.type !== "type" || !variant.id) continue;
        const variantName = translatedName(variantNames, variant.name);
        vehicles.push({
          build,
          category: categoryName,
          id: variant.id,
          image: variant.image ?? null,
          name: modelName,
          stats: variant.stats ?? {},
          variant: variantName,
        });
        variants.push({ id: variant.id, name: variantName });
        originalNamesByVehicleId.set(variant.id, [model.name, variant.name]);
      }
      if (variants.length > 0) {
        preparedCategory.models.push({ name: modelName, variants });
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
      [
        vehicle.name,
        vehicle.variant,
        ...(originalNamesByVehicleId.get(vehicle.id) ?? []),
        vehicle.id,
      ]
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
    language,
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

export function loadVehicleCatalog(
  build: GameBuild,
  language = defaultLanguage,
): Promise<VehicleCatalog> {
  const languageTag = canonicalLanguage(language);
  const requestKey = `${build}:${languageTag}`;
  const existingRequest = catalogRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = catalogLoaders[build]().then(({ default: catalog }) =>
    prepareCatalog(catalog, build, languageTag),
  );
  catalogRequests.set(requestKey, request);
  void request.catch(() => {
    if (catalogRequests.get(requestKey) === request) {
      catalogRequests.delete(requestKey);
    }
  });
  return request;
}
