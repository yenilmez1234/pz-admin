import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { VehiclePicker } from "@/features/vehicles/components/VehiclePicker";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import { useVehicleCatalog } from "@/features/vehicles/useVehicleCatalog";

interface SpawnVehicleModalProps {
  build: GameBuild;
  onSpawn: (
    players: Player[],
    vehicle: VehicleCatalogEntry,
  ) => Promise<boolean>;
  onClose: () => void;
  opened: boolean;
  players: Player[];
}

export function SpawnVehicleModal({
  build,
  onSpawn,
  onClose,
  opened,
  players,
}: SpawnVehicleModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const { catalog, error, loading, reload } = useVehicleCatalog(build);
  const [pickerRevision, setPickerRevision] = useState(0);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleCatalogEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSpawn() {
    if (!selectedVehicle) return;
    setSubmitting(true);
    try {
      if (await onSpawn(players, selectedVehicle)) onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function resetPicker() {
    setSelectedVehicle(null);
    setPickerRevision((current) => current + 1);
  }

  return (
    <Modal
      centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      onClose={onClose}
      onExitTransitionEnd={resetPicker}
      opened={opened}
      size="xl"
      title={t("spawnVehicleDialog.title", { count: players.length })}
      withCloseButton={!submitting}
    >
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          {t("spawnVehicleDialog.description", {
            count: players.length,
            username: players[0]?.username,
          })}
        </Text>

        {error ? (
          <Alert
            aria-live="polite"
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={t("spawnVehicleDialog.loadErrorTitle")}
          >
            <Stack align="flex-start" gap="xs">
              <Text size="sm">{error}</Text>
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : loading || !catalog ? (
          <Stack gap="sm" h="min(62vh, 34rem)" aria-busy="true">
            <Skeleton h={28} w="45%" />
            <Group align="stretch" grow>
              <Skeleton h={150} />
              <Skeleton h={150} />
              <Skeleton h={150} />
            </Group>
          </Stack>
        ) : (
          <VehiclePicker
            key={pickerRevision}
            catalog={catalog}
            onChange={setSelectedVehicle}
            selectedVehicle={selectedVehicle}
          />
        )}

        <Group justify="flex-end">
          <Button disabled={submitting} onClick={onClose} variant="default">
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button
            disabled={!selectedVehicle}
            loading={submitting}
            onClick={() => void handleSpawn()}
          >
            {t("spawnVehicleDialog.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
