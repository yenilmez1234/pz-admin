import {
  Alert,
  Button,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameBuildSelector } from "@/features/game/components/GameBuildSelector";
import type { GameBuild } from "@/features/game/types";
import { VehicleDetails } from "@/features/vehicles/components/details/VehicleDetails";
import { VehicleExplorer } from "@/features/vehicles/components/explorer/VehicleExplorer";
import { PageContainer } from "@/shared/layout/PageContainer";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { useVehicleCatalog } from "@/features/vehicles/hooks/useVehicleCatalog";

interface VehiclesPageProps {
  build: GameBuild;
  onBuildChange: (build: GameBuild) => void;
}

export function VehiclesPage({ build, onBuildChange }: VehiclesPageProps) {
  const { t } = useTranslation(["vehicles", "common"]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCatalogEntry | null>(null);
  const { catalog, error, loading, reload } = useVehicleCatalog(build);
  const vehicleVariants = selectedVehicle
    ? (catalog?.variantsByVehicleId.get(selectedVehicle.id) ?? [])
    : [];

  useEffect(() => {
    setSelectedVehicle(null);
  }, [build]);

  function handleBack() {
    if (!selectedVehicle) return;
    const resultId = `vehicle-result-${selectedVehicle.id}`;
    setSelectedVehicle(null);
    requestAnimationFrame(() => document.getElementById(resultId)?.focus());
  }

  return (
    <>
      {selectedVehicle ? (
        <VehicleDetails
          onBack={handleBack}
          onVehicleChange={setSelectedVehicle}
          vehicle={selectedVehicle}
          variants={vehicleVariants}
        />
      ) : null}

      <PageContainer
        contentWidth="wide"
        h="100%"
        py="md"
        style={{
          display: selectedVehicle ? "none" : "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Stack gap="md" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Group justify="space-between">
            <Title order={1}>{t("page.title")}</Title>
            <GameBuildSelector
              onChange={onBuildChange}
              value={build}
            />
          </Group>

          {error ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("errors.loadTitle")}
            >
              <Stack gap="xs" align="flex-start">
                {error}
                <Button onClick={reload} size="xs" variant="light">
                  {t("actions.retry", { ns: "common" })}
                </Button>
              </Stack>
            </Alert>
          ) : null}

          <VehicleExplorer
            key={build}
            catalog={catalog}
            loading={loading}
            onVehicleSelect={setSelectedVehicle}
          />
        </Stack>
      </PageContainer>
    </>
  );
}
