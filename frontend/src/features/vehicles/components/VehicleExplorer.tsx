import {
  ActionIcon,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { VehicleFilters } from "./VehicleFilters";
import { VehicleResultsList } from "./VehicleResultsList";
import { vehicleSortFields } from "@/features/vehicles/stats";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
} from "@/features/vehicles/types";
import { useVehicleExplorer } from "@/features/vehicles/useVehicleExplorer";

interface VehicleExplorerProps {
  catalog: VehicleCatalog | null;
  loading?: boolean;
  onVehicleSelect: (vehicle: VehicleCatalogEntry) => void;
}

export function VehicleExplorer({
  catalog,
  loading = false,
  onVehicleSelect,
}: VehicleExplorerProps) {
  const { i18n, t } = useTranslation("vehicles");
  const explorer = useVehicleExplorer(catalog, i18n.language);

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
        <VehicleFilters filters={explorer.filters} />
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
                explorer.setSearch(event.currentTarget.value);
              }}
              placeholder={t("browser.searchPlaceholder")}
              ref={explorer.searchInputRef}
            />
            <Select
              aria-label={t("sorting.label")}
              data={vehicleSortFields.map((field) => ({
                label: t(`sorting.fields.${field}`),
                value: field,
              }))}
              disabled={loading}
              onChange={explorer.changeSort}
              value={explorer.sortField}
              w={150}
            />
            <Tooltip
              label={t(`sorting.directions.${explorer.sortDirection}`)}
              withArrow
            >
              <ActionIcon
                aria-label={t("sorting.changeDirection", {
                  direction: t(`sorting.directions.${explorer.sortDirection}`),
                })}
                disabled={loading}
                onClick={() =>
                  explorer.setSortDirection((current) =>
                    current === "ascending" ? "descending" : "ascending",
                  )
                }
                size={36}
                variant="default"
              >
                {explorer.sortDirection === "ascending" ? (
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
              opacity: explorer.updating ? 0.65 : 1,
              transition: "opacity 120ms ease",
            }}
          >
            {t("browser.resultCount", { count: explorer.vehicles.length })}
          </Text>

          <VehicleResultsList
            loading={loading}
            onVehicleSelect={onVehicleSelect}
            updating={explorer.updating}
            vehicles={explorer.vehicles}
            catalogEmpty={!catalog || catalog.vehicles.length === 0}
          />
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
