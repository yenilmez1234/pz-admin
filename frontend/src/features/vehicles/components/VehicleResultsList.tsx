import { memo, type ReactNode } from "react";
import {
  Box,
  Grid,
  Group,
  Image,
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { vehicleStatIcons } from "@/features/vehicles/statIcons";
import { formatVehicleStat } from "@/features/vehicles/stats";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import classes from "./VehicleResultsList.module.css";

const summaryStats = [
  "totalStorage",
  "seats",
  "enginePower",
  "topSpeed",
] as const;
const summaryStatLabels = {
  enginePower: "browser.statLabels.enginePower",
  seats: "browser.statLabels.seats",
  topSpeed: "browser.statLabels.topSpeed",
  totalStorage: "browser.statLabels.totalStorage",
} as const;

interface VehicleResultsListProps {
  catalogEmpty: boolean;
  loading: boolean;
  onVehicleSelect: (vehicle: VehicleCatalogEntry) => void;
  vehicles: VehicleCatalogEntry[];
}

interface VehicleStatProps {
  icon?: string;
  label: string;
  value: ReactNode;
}

function VehicleStat({ icon, label, value }: VehicleStatProps) {
  return (
    <Stack gap={1}>
      <Group gap={4} wrap="nowrap">
        {icon ? (
          <Image aria-hidden="true" fit="contain" h={16} src={icon} w={16} />
        ) : null}
        <Text c="dimmed" fz={11} lh={1.2}>
          {label}
        </Text>
      </Group>
      <Text fw={500} fz={13}>
        {value}
      </Text>
    </Stack>
  );
}

export const VehicleResultsList = memo(function VehicleResultsList({
  catalogEmpty,
  loading,
  onVehicleSelect,
  vehicles,
}: VehicleResultsListProps) {
  const { t } = useTranslation("vehicles");

  return (
    <Paper
      withBorder
      style={{
        display: "flex",
        flex: 1,
        height: 0,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <ScrollArea h="100%" type="auto" style={{ flex: 1, minWidth: 0 }}>
        <Box
          aria-busy={loading}
          aria-label={t("browser.accessibleLabel")}
          component="ul"
          m={0}
          p={0}
        >
          {loading
            ? Array.from({ length: 7 }, (_row, index) => (
                <Box
                  component="li"
                  key={index}
                  px="md"
                  py="sm"
                  style={{
                    borderBottom:
                      "1px solid var(--mantine-color-default-border)",
                    listStyle: "none",
                  }}
                >
                  <Grid align="center" gap="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap={0} wrap="nowrap">
                        <Skeleton
                          height={76}
                          ms="calc(-1 * var(--mantine-spacing-md))"
                          my="calc(-1 * var(--mantine-spacing-sm))"
                          width={120}
                        />
                        <Stack gap={6} flex={1}>
                          <Skeleton height={16} width="65%" />
                          <Skeleton height={13} width="45%" />
                        </Stack>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <SimpleGrid cols={4} spacing="sm">
                        {Array.from({ length: 4 }, (_stat, statIndex) => (
                          <Stack gap={5} key={statIndex}>
                            <Skeleton height={10} width="70%" />
                            <Skeleton height={14} width="45%" />
                          </Stack>
                        ))}
                      </SimpleGrid>
                    </Grid.Col>
                  </Grid>
                </Box>
              ))
            : vehicles.map((vehicle, index) => (
                <Box
                  component="li"
                  key={vehicle.id}
                  style={{
                    borderBottom:
                      index === vehicles.length - 1
                        ? undefined
                        : "1px solid var(--mantine-color-default-border)",
                    contentVisibility: "auto",
                    containIntrinsicSize: "80px",
                    listStyle: "none",
                  }}
                >
                  <UnstyledButton
                    className={classes.row}
                    id={`vehicle-result-${vehicle.id}`}
                    onClick={() => onVehicleSelect(vehicle)}
                    px="md"
                    py="sm"
                  >
                    <Grid align="center" gap="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Group gap={0} wrap="nowrap">
                          <Box
                            h={76}
                            ms="calc(-1 * var(--mantine-spacing-md))"
                            my="calc(-1 * var(--mantine-spacing-sm))"
                            style={{
                              alignItems: "center",
                              display: "flex",
                              flex: "0 0 120px",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {vehicle.image ? (
                              <Image
                                alt=""
                                fit="contain"
                                h={76}
                                loading="lazy"
                                src={vehicle.image}
                                style={{ transform: "scale(1.15)" }}
                                w={120}
                              />
                            ) : (
                              <IconCar
                                aria-hidden="true"
                                color="var(--mantine-color-dimmed)"
                                size={24}
                              />
                            )}
                          </Box>

                          <Stack gap={3} miw={0}>
                            <Text fw={500} lineClamp={1} size="sm">
                              {vehicle.name}
                            </Text>
                            {vehicle.variant ? (
                              <Text c="dimmed" lineClamp={1} size="xs">
                                {vehicle.variant}
                              </Text>
                            ) : null}
                          </Stack>
                        </Group>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <SimpleGrid cols={4} spacing="sm">
                          {summaryStats.map((stat) => (
                            <VehicleStat
                              icon={vehicleStatIcons[stat]}
                              key={stat}
                              label={t(summaryStatLabels[stat])}
                              value={formatVehicleStat(
                                t,
                                stat,
                                vehicle.stats[stat],
                              )}
                            />
                          ))}
                        </SimpleGrid>
                      </Grid.Col>
                    </Grid>
                  </UnstyledButton>
                </Box>
              ))}
        </Box>

        {!loading && vehicles.length === 0 ? (
          <Text c="dimmed" py="xl" ta="center">
            {catalogEmpty
              ? t("browser.emptyCatalog")
              : t("browser.noSearchResults")}
          </Text>
        ) : null}
      </ScrollArea>
    </Paper>
  );
});
