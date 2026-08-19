import {
  Accordion,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { VehicleHierarchyFilter } from "./VehicleHierarchyFilter";
import {
  VehicleLightbarFilter,
  VehicleStatFilters,
} from "./VehicleStatFilters";
import {
  advancedVehicleFilterStats,
  primaryVehicleFilterStats,
} from "@/features/vehicles/lib/stats";
import type { VehicleFilterController } from "@/features/vehicles/hooks/useVehicleExplorer";
import classes from "./VehicleFilters.module.css";

interface VehicleFiltersProps {
  filters: VehicleFilterController;
}

export function VehicleFilters({ filters }: VehicleFiltersProps) {
  const { t } = useTranslation("vehicles");

  return (
    <Paper
      h="100%"
      withBorder
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Group justify="space-between" gap="xs" px="md" pt="md">
        <Text fw={600}>{t("filters.title")}</Text>
        <Button
          color="gray"
          disabled={!filters.canClear}
          onClick={filters.clear}
          size="compact-xs"
          variant="subtle"
        >
          {t("filters.clear")}
        </Button>
      </Group>

      <ScrollArea
        h={0}
        offsetScrollbars
        type="auto"
        style={{ flex: 1, minHeight: 0 }}
      >
        <Accordion
          chevron={<IconChevronRight size={16} aria-hidden="true" />}
          classNames={{ chevron: classes.chevron }}
          defaultValue={["vehicle", "stats"]}
          multiple
          styles={{ content: { paddingTop: 0 } }}
        >
          <Accordion.Item value="vehicle">
            <Accordion.Control>{t("filters.vehicleSection")}</Accordion.Control>
            <Accordion.Panel>
              <VehicleHierarchyFilter
                data={filters.hierarchy}
                onChange={filters.changeHierarchy}
                value={filters.selectedHierarchy}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="stats">
            <Accordion.Control>{t("filters.statsSection")}</Accordion.Control>
            <Accordion.Panel>
              <VehicleStatFilters
                onChange={filters.changeRange}
                ranges={filters.ranges}
                stats={primaryVehicleFilterStats}
                values={filters.rangeFilters}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="advanced">
            <Accordion.Control>
              {t("filters.advancedSection")}
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <VehicleStatFilters
                  onChange={filters.changeRange}
                  ranges={filters.ranges}
                  stats={advancedVehicleFilterStats}
                  values={filters.rangeFilters}
                />
                {filters.lightbarAvailable ? (
                  <VehicleLightbarFilter
                    onChange={filters.changeLightbar}
                    value={filters.lightbarFilter}
                  />
                ) : null}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </ScrollArea>
    </Paper>
  );
}
