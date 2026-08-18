import { useEffect, useRef } from "react";
import {
  Badge,
  Box,
  Divider,
  Grid,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconArrowLeft, IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout/PageContainer";
import { vehicleStatIcons } from "@/features/vehicles/statIcons";
import {
  formatVehicleStat,
  vehicleDetailSections,
} from "@/features/vehicles/stats";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import classes from "./VehicleDetails.module.css";
import { VehicleIdCopyButton } from "./VehicleIdCopyButton";

interface VehicleDetailsProps {
  onBack: () => void;
  onVehicleChange: (vehicle: VehicleCatalogEntry) => void;
  vehicle: VehicleCatalogEntry;
  variants: VehicleCatalogEntry[];
}

export function VehicleDetails({
  onBack,
  onVehicleChange,
  vehicle,
  variants,
}: VehicleDetailsProps) {
  const { t } = useTranslation("vehicles");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const showVariants = variants.length > 1;

  useEffect(() => {
    titleRef.current?.focus();
  }, [vehicle.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        onBack();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <Box
      h="100%"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box bg="var(--mantine-color-body)" pb="sm" style={{ flex: "0 0 auto" }}>
        <Box
          style={{
            borderBottom: "1px solid var(--mantine-color-default-border)",
          }}
        >
          <PageContainer
            contentWidth={showVariants ? "wide" : "standard"}
            py="xs"
          >
            <UnstyledButton
              aria-label={t("details.backLabel")}
              className={classes.backLink}
              onClick={onBack}
            >
              <IconArrowLeft size={16} aria-hidden="true" />
              <Text fw={500} size="sm">
                {t("details.back")}
              </Text>
            </UnstyledButton>
          </PageContainer>
        </Box>
      </Box>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <PageContainer
          contentWidth={showVariants ? "wide" : "standard"}
          h="100%"
          pb="sm"
          style={{ minHeight: 0 }}
        >
          <Box
            className={classes.panes}
            data-has-variants={showVariants || undefined}
          >
            <Box className={classes.pane}>
              <Paper className={classes.scrollPanel} h="100%" p="md" withBorder>
                <Stack gap="md">
                  <Grid align="flex-start" gap="md">
                    <Grid.Col span={{ base: 12, sm: 5 }}>
                      <Box className={classes.preview}>
                        {vehicle.image ? (
                          <Image
                            alt=""
                            fit="contain"
                            h={160}
                            src={vehicle.image}
                            style={{ transform: "scale(1.32)" }}
                          />
                        ) : (
                          <IconCar
                            aria-hidden="true"
                            color="var(--mantine-color-dimmed)"
                            size={64}
                          />
                        )}
                        <Badge
                          bottom="var(--mantine-spacing-xs)"
                          color="gray"
                          pos="absolute"
                          right="var(--mantine-spacing-xs)"
                          size="sm"
                          variant="light"
                        >
                          {vehicle.category}
                        </Badge>
                      </Box>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 7 }}>
                      <Stack gap="xs">
                        <Stack gap={0}>
                          <Title
                            fw={600}
                            order={1}
                            ref={titleRef}
                            size="h3"
                            tabIndex={-1}
                          >
                            {vehicle.name}
                          </Title>
                          {vehicle.variant ? (
                            <Text c="dimmed" size="sm">
                              {vehicle.variant}
                            </Text>
                          ) : null}
                        </Stack>
                        <VehicleIdCopyButton id={vehicle.id} />
                      </Stack>
                    </Grid.Col>
                  </Grid>

                  <Divider />

                  {vehicleDetailSections.map((section) => {
                    const stats = section.stats.flatMap((stat) => {
                      const value = vehicle.stats[stat];
                      return value === undefined ? [] : [{ stat, value }];
                    });
                    if (stats.length === 0) return null;

                    return (
                      <Stack gap={4} key={section.key}>
                        <Title order={2} size="h4">
                          {t(`details.sections.${section.key}`)}
                        </Title>
                        <SimpleGrid
                          cols={{ base: 2, sm: 3, md: 4 }}
                          spacing="xs"
                        >
                          {stats.map(({ stat, value }) => (
                            <Group
                              align="flex-start"
                              gap="xs"
                              key={stat}
                              wrap="nowrap"
                            >
                              {vehicleStatIcons[stat] ? (
                                <Image
                                  aria-hidden="true"
                                  fit="contain"
                                  h={20}
                                  src={vehicleStatIcons[stat]}
                                  w={20}
                                />
                              ) : null}
                              <Stack gap={2}>
                                <Text c="dimmed" size="xs">
                                  {t(`filters.stats.${stat}`)}
                                </Text>
                                <Text fw={500} size="sm">
                                  {formatVehicleStat(t, stat, value)}
                                </Text>
                              </Stack>
                            </Group>
                          ))}
                        </SimpleGrid>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Box>

            {showVariants ? (
              <Box className={classes.pane}>
                <Paper
                  className={classes.scrollPanel}
                  h="100%"
                  p="md"
                  withBorder
                >
                  <Stack gap="sm">
                    <Title order={2} size="h4">
                      {t("details.variants")}
                    </Title>
                    <SimpleGrid
                      cols={{ base: 1, "8rem": 2, "15rem": 3, "24rem": 4 }}
                      spacing="xs"
                      type="container"
                    >
                      {variants.map((variant) => {
                        const label = variant.variant ?? variant.name;
                        const selected = variant.id === vehicle.id;
                        return (
                          <Tooltip key={variant.id} label={label} withArrow>
                            <UnstyledButton
                              aria-current={selected ? "true" : undefined}
                              aria-label={t("details.openVariant", {
                                variant: label,
                              })}
                              className={classes.variant}
                              data-selected={selected || undefined}
                              onClick={() => {
                                if (!selected) onVehicleChange(variant);
                              }}
                            >
                              {variant.image ? (
                                <Image
                                  alt=""
                                  fit="contain"
                                  h={78}
                                  loading="lazy"
                                  src={variant.image}
                                  style={{
                                    transform: "translateX(4px) scale(1.34)",
                                  }}
                                />
                              ) : (
                                <IconCar
                                  aria-hidden="true"
                                  color="var(--mantine-color-dimmed)"
                                  size={28}
                                />
                              )}
                            </UnstyledButton>
                          </Tooltip>
                        );
                      })}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </Box>
            ) : null}
          </Box>
        </PageContainer>
      </Box>
    </Box>
  );
}
