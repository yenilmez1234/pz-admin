import { useEffect, useMemo, useState } from "react";
import type { GameBuild } from "@/features/game/types";
import { loadItemCatalog } from "@/features/items/catalog";
import { isOnline } from "@/features/players/lib/status";
import { loadSkillCatalog } from "@/features/skills/catalog";
import { loadVehicleCatalog } from "@/features/vehicles/catalog";
import { useAppConfig } from "@/features/config/AppConfigProvider";
import { usePlayers } from "@/features/players/PlayersProvider";
import { consoleCatalog, localConsoleCommandNames } from "./catalog";
import type { ConsoleCompletionSource, ConsoleCompletionValues } from "./types";

type DynamicCompletionSource = "items" | "skills" | "vehicles";

interface LoadedCompletions {
  build: GameBuild;
  language?: string;
  values: readonly string[];
}

const emptyValues: readonly string[] = [];
const catalogRequests = new Map<string, Promise<LoadedCompletions>>();

function isDynamicSource(
  source: ConsoleCompletionSource | null,
): source is DynamicCompletionSource {
  return source === "items" || source === "skills" || source === "vehicles";
}

function loadDynamicCompletions(
  source: DynamicCompletionSource,
  build: GameBuild,
  language: string,
) {
  const requestKey = `${source}:${build}:${source === "vehicles" ? "" : language}`;
  const existing = catalogRequests.get(requestKey);
  if (existing) return existing;

  let request: Promise<LoadedCompletions>;
  switch (source) {
    case "items":
      request = loadItemCatalog(build, language).then((catalog) => ({
        build,
        language: catalog.language,
        values: catalog.items.map((item) => item.id),
      }));
      break;
    case "skills":
      request = loadSkillCatalog(build, language).then((catalog) => ({
        build,
        language: catalog.language,
        values: catalog.skills.map((skill) => `${skill.id}=`),
      }));
      break;
    case "vehicles":
      request = loadVehicleCatalog(build).then((catalog) => ({
        build,
        values: catalog.vehicles.map((vehicle) => vehicle.id),
      }));
      break;
  }

  catalogRequests.set(requestKey, request);
  void request.catch(() => {
    if (catalogRequests.get(requestKey) === request) {
      catalogRequests.delete(requestKey);
    }
  });
  return request;
}

function loadedValues(
  loaded: LoadedCompletions | undefined,
  build: GameBuild,
  language?: string,
) {
  if (loaded?.build !== build) return emptyValues;
  if (language !== undefined && loaded.language !== language)
    return emptyValues;
  return loaded.values;
}

function sorted(values: readonly string[], collator: Intl.Collator) {
  return [...values].sort((first, second) => collator.compare(first, second));
}

export function useConsoleCompletions(
  build: GameBuild | undefined,
  activeSource: ConsoleCompletionSource | null,
): ConsoleCompletionValues {
  const { config } = useAppConfig();
  const { players } = usePlayers();
  const language = Intl.getCanonicalLocales(config?.language ?? "en-US")[0];
  const [loaded, setLoaded] = useState<
    Partial<Record<DynamicCompletionSource, LoadedCompletions>>
  >({});

  useEffect(() => {
    if (!build || !isDynamicSource(activeSource)) return undefined;

    let current = true;
    void loadDynamicCompletions(activeSource, build, language).then(
      (values) => {
        if (current) {
          setLoaded((existing) => ({ ...existing, [activeSource]: values }));
        }
      },
      () => {},
    );
    return () => {
      current = false;
    };
  }, [activeSource, build, language]);

  const collator = useMemo(
    () =>
      new Intl.Collator(language, {
        numeric: true,
        sensitivity: "base",
      }),
    [language],
  );
  const playerCompletions = useMemo(() => {
    return {
      onlinePlayers: sorted(
        players.filter(isOnline).map((player) => player.username),
        collator,
      ),
      players: sorted(
        players.map((player) => player.username),
        collator,
      ),
    };
  }, [collator, players]);
  const catalogCompletions = useMemo(() => {
    const staticValues = build ? consoleCatalog(build).values : undefined;

    return {
      accessLevels: sorted(staticValues?.accessLevels ?? emptyValues, collator),
      booleanFlags: sorted(staticValues?.booleanFlags ?? emptyValues, collator),
      commands: sorted(
        [
          ...localConsoleCommandNames,
          ...(staticValues?.commands ?? emptyValues),
        ],
        collator,
      ),
      items: sorted(
        build ? loadedValues(loaded.items, build, language) : emptyValues,
        collator,
      ),
      skills: sorted(
        build ? loadedValues(loaded.skills, build, language) : emptyValues,
        collator,
      ),
      vehicles: sorted(
        build ? loadedValues(loaded.vehicles, build) : emptyValues,
        collator,
      ),
    };
  }, [build, collator, language, loaded]);

  return useMemo(
    () => ({ ...catalogCompletions, ...playerCompletions }),
    [catalogCompletions, playerCompletions],
  );
}
