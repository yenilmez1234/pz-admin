import {
  Alert,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { VehicleDetails } from "@/features/vehicles/components/VehicleDetails";
import { VehicleExplorer } from "@/features/vehicles/components/VehicleExplorer";
import { PageContainer } from "@/shared/layout/PageContainer";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { useVehicleCatalog } from "@/features/vehicles/useVehicleCatalog";

export function VehiclesPage() {
  const { t } = useTranslation(["vehicles", "common"]);
  const [build, setBuild] = useState<GameBuild>("42");
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCatalogEntry | null>(null);
  const { catalog, error, loading, reload } = useVehicleCatalog(build);
  const vehicleVariants = selectedVehicle
    ? (catalog?.variantsByVehicleId.get(selectedVehicle.id) ?? [])
    : [];

  function handleBuildChange(nextBuild: string) {
    if (nextBuild === "41" || nextBuild === "42") {
      setSelectedVehicle(null);
      setBuild(nextBuild);
    }
  }

  function returnToBrowser() {
    if (!selectedVehicle) return;
    const resultId = `vehicle-result-${selectedVehicle.id}`;
    setSelectedVehicle(null);
    requestAnimationFrame(() => document.getElementById(resultId)?.focus());
  }

  return (
    <>
      {selectedVehicle ? (
        <VehicleDetails
          onBack={returnToBrowser}
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
            <SegmentedControl
              aria-label={t("gameBuild.label", { ns: "common" })}
              data={[
                {
                  label: t("gameBuild.options.41", { ns: "common" }),
                  value: "41",
                },
                {
                  label: t("gameBuild.options.42", { ns: "common" }),
                  value: "42",
                },
              ]}
              onChange={handleBuildChange}
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
