import { Fragment, useState } from "react";
import {
  ActionIcon,
  Box,
  Breadcrumbs,
  Group,
  Image,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconArrowLeft, IconCar, IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { vehicleStatIcons } from "@/features/vehicles/statIcons";
import { formatVehicleStat } from "@/features/vehicles/stats";
import type {
  VehicleCatalog,
  VehicleCatalogEntry,
  VehicleHierarchyCategory,
  VehicleHierarchyModel,
} from "@/features/vehicles/types";
import { VehicleIdCopyButton } from "./VehicleIdCopyButton";
import classes from "./VehiclePicker.module.css";

const summaryStats = [
  "seats",
  "totalStorage",
  "trunkStorage",
  "enginePower",
  "topSpeed",
  "engineQuality",
  "weight",
] as const;

const summaryStatLabelKeys = {
  enginePower: "browser.enginePower",
  engineQuality: "filters.stats.engineQuality",
  seats: "browser.seats",
  topSpeed: "browser.topSpeed",
  totalStorage: "filters.stats.totalStorage",
  trunkStorage: "filters.stats.trunkStorage",
  weight: "filters.stats.weight",
} as const;

interface VehiclePickerProps {
  catalog: VehicleCatalog;
  onChange: (vehicle: VehicleCatalogEntry | null) => void;
  selectedVehicle: VehicleCatalogEntry | null;
}

interface PickerCardProps {
  images: PickerImage[];
  label: string;
  onClick: () => void;
}

interface PickerImage {
  id: string;
  src: string;
}

function PickerCard({ images, label, onClick }: PickerCardProps) {
  return (
    <UnstyledButton className={classes.card} onClick={onClick}>
      {images.length > 0 ? (
        <Box className={classes.thumbnails} data-count={images.length}>
          {images.map((image) => (
            <Box className={classes.thumbnailCell} key={image.id}>
              <Image
                alt=""
                className={classes.thumbnail}
                fit="contain"
                h="100%"
                src={image.src}
                w="100%"
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          style={{
            alignItems: "center",
            display: "flex",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <IconCar
            aria-hidden="true"
            color="var(--mantine-color-dimmed)"
            size={36}
          />
        </Box>
      )}
      <Text className={classes.cardLabel} fw={600} lineClamp={2} size="sm">
        {label}
      </Text>
    </UnstyledButton>
  );
}

function defaultVehicle(catalog: VehicleCatalog, model: VehicleHierarchyModel) {
  const defaultVariant =
    model.variants.find((variant) => variant.name === "Normal") ??
    model.variants[0];
  const vehicleId = defaultVariant?.id;
  return vehicleId ? (catalog.vehiclesById.get(vehicleId) ?? null) : null;
}

function modelImages(catalog: VehicleCatalog, model: VehicleHierarchyModel) {
  return model.variants.flatMap((variant) => {
    const image = catalog.vehiclesById.get(variant.id)?.image;
    return image ? [{ id: variant.id, src: image }] : [];
  });
}

function categoryImages(
  catalog: VehicleCatalog,
  category: VehicleHierarchyCategory,
) {
  return category.models.flatMap((model) => {
    const image = modelImages(catalog, model)[0];
    return image ? [image] : [];
  });
}

export function VehiclePicker({
  catalog,
  onChange,
  selectedVehicle,
}: VehiclePickerProps) {
  const { t } = useTranslation("players");
  const { t: vehicleT } = useTranslation("vehicles");
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null);
  const [modelIndex, setModelIndex] = useState<number | null>(null);
  const category =
    categoryIndex === null ? null : catalog.hierarchy[categoryIndex];
  const model =
    category && modelIndex !== null ? category.models[modelIndex] : null;

  function reset() {
    setCategoryIndex(null);
    setModelIndex(null);
    onChange(null);
  }

  function goBack() {
    if (modelIndex !== null) {
      setModelIndex(null);
      onChange(null);
    } else {
      setCategoryIndex(null);
    }
  }

  function selectModel(nextModelIndex: number) {
    if (!category) return;
    const nextModel = category.models[nextModelIndex];
    const nextVehicle = defaultVehicle(catalog, nextModel);
    if (!nextVehicle) return;
    setModelIndex(nextModelIndex);
    onChange(nextVehicle);
  }

  const variants = selectedVehicle
    ? (catalog.variantsByVehicleId.get(selectedVehicle.id) ?? [])
    : [];
  const cards = category
    ? category.models.map((categoryModel, index) => ({
        images: modelImages(catalog, categoryModel).slice(0, 4),
        label: categoryModel.name,
        onClick: () => selectModel(index),
      }))
    : catalog.hierarchy.map((catalogCategory, index) => ({
        images: categoryImages(catalog, catalogCategory).slice(0, 4),
        label: catalogCategory.name,
        onClick: () => {
          setCategoryIndex(index);
          onChange(null);
        },
      }));

  return (
    <Stack className={classes.content} h="min(62vh, 34rem)">
      <Group gap={6} wrap="nowrap">
        <ActionIcon
          aria-label={t("spawnVehicleDialog.back")}
          disabled={categoryIndex === null}
          onClick={goBack}
          size="sm"
          variant="default"
        >
          <IconArrowLeft size={14} aria-hidden="true" />
        </ActionIcon>
        <Breadcrumbs
          separator={<IconChevronRight size={11} aria-hidden="true" />}
          separatorMargin={4}
        >
          {category ? (
            <UnstyledButton className={classes.breadcrumbLink} onClick={reset}>
              {t("spawnVehicleDialog.root")}
            </UnstyledButton>
          ) : (
            <Text fw={600} lh={1.2} size="sm">
              {t("spawnVehicleDialog.root")}
            </Text>
          )}
          {category ? (
            model ? (
              <UnstyledButton
                className={classes.breadcrumbLink}
                onClick={() => {
                  setModelIndex(null);
                  onChange(null);
                }}
              >
                {category.name}
              </UnstyledButton>
            ) : (
              <Text fw={600} lh={1.2} size="sm">
                {category.name}
              </Text>
            )
          ) : null}
          {model ? (
            <Text fw={600} lh={1.2} size="sm">
              {model.name}
            </Text>
          ) : null}
        </Breadcrumbs>
      </Group>

      {model && selectedVehicle ? (
        <Stack gap="md" h={0} p="xs" style={{ flex: 1, minHeight: 0 }}>
          <Box className={classes.summary}>
            <Box className={classes.preview}>
              {selectedVehicle.image ? (
                <Image
                  alt=""
                  fit="contain"
                  h={140}
                  src={selectedVehicle.image}
                  style={{ transform: "scale(1.32)" }}
                />
              ) : (
                <IconCar
                  aria-hidden="true"
                  color="var(--mantine-color-dimmed)"
                  size={52}
                />
              )}
            </Box>
            <Stack gap="xs" miw={0}>
              <Stack gap={0}>
                <Text fw={600} size="lg">
                  {selectedVehicle.name}
                </Text>
                {selectedVehicle.variant ? (
                  <Text c="dimmed" size="sm">
                    {selectedVehicle.variant}
                  </Text>
                ) : null}
              </Stack>
              <VehicleIdCopyButton id={selectedVehicle.id} />
            </Stack>
            <Box className={classes.summaryStats}>
              {summaryStats
                .filter((stat) => selectedVehicle.stats[stat] !== undefined)
                .map((stat) => (
                  <Fragment key={stat}>
                    <Group gap={4} wrap="nowrap">
                      <Image
                        aria-hidden="true"
                        fit="contain"
                        h={16}
                        src={vehicleStatIcons[stat]}
                        w={16}
                      />
                      <Text c="dimmed" fz={12} lh={1.15}>
                        {vehicleT(summaryStatLabelKeys[stat])}
                      </Text>
                    </Group>
                    <Text fw={500} fz={13} lh={1.15}>
                      {formatVehicleStat(
                        vehicleT,
                        stat,
                        selectedVehicle.stats[stat],
                      )}
                    </Text>
                  </Fragment>
                ))}
            </Box>
          </Box>

          {variants.length > 1 ? (
            <Stack gap="xs" h={0} style={{ flex: 1, minHeight: 0 }}>
              <Text fw={600} size="sm">
                {t("spawnVehicleDialog.variants")}
              </Text>
              <ScrollArea
                h={0}
                offsetScrollbars
                overscrollBehavior="contain"
                style={{ flex: 1, minHeight: 0 }}
                type="auto"
              >
                <SimpleGrid
                  cols={{ base: 2, "18rem": 3, "30rem": 4, "42rem": 6 }}
                  spacing="xs"
                  type="container"
                >
                  {variants.map((variant) => {
                    const label = variant.variant ?? variant.name;
                    const selected = variant.id === selectedVehicle.id;
                    return (
                      <Tooltip key={variant.id} label={label} withArrow>
                        <UnstyledButton
                          aria-current={selected ? "true" : undefined}
                          aria-label={t("spawnVehicleDialog.selectVariant", {
                            variant: label,
                          })}
                          className={classes.variant}
                          data-selected={selected || undefined}
                          onClick={() => onChange(variant)}
                        >
                          {variant.image ? (
                            <Image
                              alt=""
                              fit="contain"
                              h={78}
                              loading="lazy"
                              src={variant.image}
                              style={{
                                transform: "translate(4px, -7px) scale(1.34)",
                              }}
                            />
                          ) : (
                            <IconCar
                              aria-hidden="true"
                              color="var(--mantine-color-dimmed)"
                              size={28}
                            />
                          )}
                          <Text
                            className={classes.variantLabel}
                            fw={600}
                            lineClamp={1}
                            size="xs"
                          >
                            {label}
                          </Text>
                        </UnstyledButton>
                      </Tooltip>
                    );
                  })}
                </SimpleGrid>
              </ScrollArea>
            </Stack>
          ) : null}
        </Stack>
      ) : (
        <ScrollArea
          h={0}
          offsetScrollbars
          overscrollBehavior="contain"
          style={{ flex: 1, minHeight: 0 }}
          type="auto"
        >
          <SimpleGrid
            cols={{ base: 2, "32rem": 3, "46rem": 4 }}
            p="xs"
            spacing="sm"
            type="container"
          >
            {cards.map((card) => (
              <PickerCard
                images={card.images}
                key={card.label}
                label={card.label}
                onClick={card.onClick}
              />
            ))}
          </SimpleGrid>
        </ScrollArea>
      )}
    </Stack>
  );
}
