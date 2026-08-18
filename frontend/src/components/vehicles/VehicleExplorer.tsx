import { useDeferredValue, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  type TreeNodeData,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { VehicleResultsList } from "@/components/vehicles/VehicleResultsList";
import {
  type VehicleRangeFilterStat,
  type VehicleRangeFilters,
  vehicleNumericStats,
  vehicleSortFields,
} from "@/features/vehicles/stats";
import {
  queryVehicles,
  type VehicleSortDirection,
} from "@/features/vehicles/query";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
} from "@/features/vehicles/types";

type SortField = (typeof vehicleSortFields)[number];

function isSortField(value: string): value is SortField {
  return vehicleSortFields.some((field) => field === value);
}

interface VehicleExplorerProps {
  catalog: VehicleCatalog | null;
  loading?: boolean;
  onVehicleSelect: (vehicle: VehicleCatalogEntry) => void;
}

function prepareHierarchy(catalog: VehicleCatalog | null): TreeNodeData[] {
  if (!catalog) return [];

  return catalog.hierarchy.map((category) => {
    const categoryValue = `category:${category.name}`;
    const children = category.models.map((model) => {
      const modelValue = `model:${category.name}:${model.name}`;
      return { label: model.name, value: modelValue };
    });
    return { children, label: category.name, value: categoryValue };
  });
}

export function VehicleExplorer({
  catalog,
  loading = false,
  onVehicleSelect,
}: VehicleExplorerProps) {
  const { i18n, t } = useTranslation("vehicles");
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rangeFilters, setRangeFilters] = useState<VehicleRangeFilters>({});
  const [lightbarFilter, setLightbarFilter] = useState<boolean | null>(null);
  const [selectedNodeValue, setSelectedNodeValue] = useState<string | null>(
    null,
  );
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] =
    useState<VehicleSortDirection>("ascending");
  const queryControls = useMemo(
    () => ({
      lightbarFilter,
      rangeFilters,
      search,
      selectedNodeValue,
      sortDirection,
      sortField,
    }),
    [
      lightbarFilter,
      rangeFilters,
      search,
      selectedNodeValue,
      sortDirection,
      sortField,
    ],
  );
  const deferredQueryControls = useDeferredValue(queryControls);
  const updatingResults = queryControls !== deferredQueryControls;
  const hierarchy = useMemo(() => prepareHierarchy(catalog), [catalog]);
  const selectedVehicleIdSet = useMemo(() => {
    if (!deferredQueryControls.selectedNodeValue) return new Set<string>();
    return new Set(
      catalog?.vehicleIdsByHierarchyNode.get(
        deferredQueryControls.selectedNodeValue,
      ) ?? [],
    );
  }, [catalog, deferredQueryControls.selectedNodeValue]);
  const visibleVehicles = useMemo(
    () =>
      catalog
        ? queryVehicles(
            catalog,
            {
              lightbar: deferredQueryControls.lightbarFilter,
              search: deferredQueryControls.search,
              rangeFilters: vehicleNumericStats.flatMap((stat) => {
                const range = deferredQueryControls.rangeFilters[stat];
                return range
                  ? [{ maximum: range[1], minimum: range[0], stat }]
                  : [];
              }),
              selectedVehicleIds: selectedVehicleIdSet,
              sortDirection: deferredQueryControls.sortDirection,
              sortField: deferredQueryControls.sortField,
            },
            i18n.language,
          )
        : [],
    [catalog, deferredQueryControls, i18n.language, selectedVehicleIdSet],
  );
  function handleSortChange(value: string | null) {
    if (!value || !isSortField(value)) return;
    setSortField(value);
    setSortDirection(value === "name" ? "ascending" : "descending");
  }

  function clearFilters() {
    if (searchInputRef.current) searchInputRef.current.value = "";
    setSearch("");
    setSelectedNodeValue(null);
    setRangeFilters({});
    setLightbarFilter(null);
  }

  function handleRangeChange(
    stat: VehicleRangeFilterStat,
    value: [number, number],
  ) {
    const fullRange = catalog?.statRanges[stat];
    setRangeFilters((current) => {
      const next = { ...current };
      if (
        fullRange &&
        value[0] === fullRange.minimum &&
        value[1] === fullRange.maximum
      ) {
        delete next[stat];
      } else {
        next[stat] = value;
      }
      return next;
    });
  }

  return (
    <Grid
      gap="lg"
      h="100%"
      style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      styles={{ inner: { height: "100%", minHeight: 0 } }}
    >
      <Grid.Col
        h="100%"
        span={{ base: 4, md: 3 }}
        style={{ minHeight: 0, overflow: "hidden" }}
      >
        <VehicleFilters
          canClear={
            search.length > 0 ||
            selectedNodeValue !== null ||
            lightbarFilter !== null ||
            Object.keys(rangeFilters).length > 0
          }
          hierarchy={hierarchy}
          lightbarAvailable={catalog?.lightbarAvailable ?? false}
          lightbarFilter={lightbarFilter}
          onClear={clearFilters}
          onHierarchyChange={setSelectedNodeValue}
          onLightbarChange={setLightbarFilter}
          onRangeChange={handleRangeChange}
          rangeFilters={rangeFilters}
          ranges={catalog?.statRanges ?? {}}
          selectedHierarchy={selectedNodeValue}
        />
      </Grid.Col>

      <Grid.Col
        h="100%"
        span={{ base: 8, md: 9 }}
        style={{ minHeight: 0, overflow: "hidden" }}
      >
        <Stack gap="sm" h="100%" style={{ minHeight: 0, overflow: "hidden" }}>
          <Group align="flex-end">
            <TextInput
              aria-label={t("browser.searchLabel")}
              autoComplete="off"
              defaultValue=""
              disabled={loading}
              flex={1}
              leftSection={<IconSearch size={16} aria-hidden="true" />}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
              }}
              placeholder={t("browser.searchPlaceholder")}
              ref={searchInputRef}
            />
            <Select
              aria-label={t("sorting.label")}
              data={vehicleSortFields.map((field) => ({
                label: t(`sorting.fields.${field}`),
                value: field,
              }))}
              disabled={loading}
              onChange={handleSortChange}
              value={sortField}
              w={150}
            />
            <Tooltip label={t(`sorting.directions.${sortDirection}`)} withArrow>
              <ActionIcon
                aria-label={t("sorting.changeDirection", {
                  direction: t(`sorting.directions.${sortDirection}`),
                })}
                disabled={loading}
                onClick={() =>
                  setSortDirection((current) =>
                    current === "ascending" ? "descending" : "ascending",
                  )
                }
                size={36}
                variant="default"
              >
                {sortDirection === "ascending" ? (
                  <IconArrowUp size={16} aria-hidden="true" />
                ) : (
                  <IconArrowDown size={16} aria-hidden="true" />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>

          <Text
            c="dimmed"
            size="sm"
            style={{
              opacity: updatingResults ? 0.65 : 1,
              transition: "opacity 120ms ease",
            }}
          >
            {t("browser.resultCount", { count: visibleVehicles.length })}
          </Text>

          <VehicleResultsList
            loading={loading}
            onVehicleSelect={onVehicleSelect}
            updating={updatingResults}
            vehicles={visibleVehicles}
            catalogEmpty={!catalog || catalog.vehicles.length === 0}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
