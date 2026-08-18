import {
  Accordion,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  type TreeNodeData,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { VehicleHierarchyFilter } from "@/components/vehicles/VehicleHierarchyFilter";
import {
  VehicleLightbarFilter,
  VehicleStatFilters,
} from "@/components/vehicles/VehicleStatFilters";
import {
  advancedVehicleFilterStats,
  primaryVehicleFilterStats,
  type VehicleRangeFilterStat,
  type VehicleRangeFilters,
} from "@/features/vehicles/stats";
import type {
  VehicleNumericStat,
  VehicleStatRange,
} from "@/features/vehicles/types";
import classes from "./VehicleFilters.module.css";

interface VehicleFiltersProps {
  canClear: boolean;
  hierarchy: TreeNodeData[];
  lightbarAvailable: boolean;
  lightbarFilter: boolean | null;
  onClear: () => void;
  onHierarchyChange: (value: string | null) => void;
  onLightbarChange: (value: boolean | null) => void;
  onRangeChange: (
    stat: VehicleRangeFilterStat,
    value: [number, number],
  ) => void;
  rangeFilters: VehicleRangeFilters;
  ranges: Partial<Record<VehicleNumericStat, VehicleStatRange>>;
  selectedHierarchy: string | null;
}

export function VehicleFilters({
  canClear,
  hierarchy,
  lightbarAvailable,
  onClear,
  onHierarchyChange,
  onLightbarChange,
  onRangeChange,
  rangeFilters,
  ranges,
  selectedHierarchy,
  lightbarFilter,
}: VehicleFiltersProps) {
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
          disabled={!canClear}
          onClick={onClear}
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
                data={hierarchy}
                onChange={onHierarchyChange}
                value={selectedHierarchy}
              />
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="stats">
            <Accordion.Control>{t("filters.statsSection")}</Accordion.Control>
            <Accordion.Panel>
              <VehicleStatFilters
                onChange={onRangeChange}
                ranges={ranges}
                stats={primaryVehicleFilterStats}
                values={rangeFilters}
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
                  onChange={onRangeChange}
                  ranges={ranges}
                  stats={advancedVehicleFilterStats}
                  values={rangeFilters}
                />
                {lightbarAvailable ? (
                  <VehicleLightbarFilter
                    onChange={onLightbarChange}
                    value={lightbarFilter}
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
