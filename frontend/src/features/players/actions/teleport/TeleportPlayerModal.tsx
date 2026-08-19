import { useEffectEvent, useLayoutEffect, useMemo } from "react";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { isOnline } from "../../status";

type TeleportMode = "coordinates" | "player";

interface TeleportFormValues {
  mode: TeleportMode;
  targetPlayerId: string;
  x: number | string;
  y: number | string;
  z: number | string;
}

interface TeleportPlayerModalProps {
  allPlayers: Player[];
  onClose: () => void;
  onTeleportToCoordinates: (
    players: Player[],
    coordinates: string,
  ) => Promise<boolean>;
  onTeleportToPlayer: (
    players: Player[],
    targetPlayerId: string,
  ) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

const initialValues: TeleportFormValues = {
  mode: "coordinates",
  targetPlayerId: "",
  x: "",
  y: "",
  z: 0,
};

function hasCoordinate(value: number | string) {
  return value !== "";
}

export function TeleportPlayerModal({
  allPlayers,
  onClose,
  onTeleportToCoordinates,
  onTeleportToPlayer,
  opened,
  players,
}: TeleportPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<TeleportFormValues>({
    mode: "controlled",
    initialValues,
    validate: {
      targetPlayerId: (value, values) =>
        values.mode === "player" && !value
          ? t("dialogs.teleport.validation.destinationRequired")
          : null,
      x: (value, values) =>
        values.mode === "coordinates" && !hasCoordinate(value)
          ? t("dialogs.teleport.validation.xRequired")
          : null,
      y: (value, values) =>
        values.mode === "coordinates" && !hasCoordinate(value)
          ? t("dialogs.teleport.validation.yRequired")
          : null,
      z: (value, values) =>
        values.mode === "coordinates" && !hasCoordinate(value)
          ? t("dialogs.teleport.validation.zRequired")
          : null,
    },
  });
  const sourcePlayerIds = useMemo(
    () => new Set(players.map((player) => player.id)),
    [players],
  );
  const destinationPlayers = useMemo(() => {
    const eligiblePlayers = allPlayers.filter(
      (player) => isOnline(player) && !sourcePlayerIds.has(player.id),
    );
    eligiblePlayers.sort((a, b) => a.username.localeCompare(b.username));
    return eligiblePlayers;
  }, [allPlayers, sourcePlayerIds]);

  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: TeleportFormValues) {
    const succeeded =
      values.mode === "player"
        ? await onTeleportToPlayer(players, values.targetPlayerId)
        : await onTeleportToCoordinates(
            players,
            `${values.x},${values.y},${values.z}`,
          );
    if (succeeded) onClose();
  }

  const targetDescription = t("dialogs.teleport.description", {
    count: players.length,
    username: players[0]?.username,
  });

  return (
    <Modal
      centered
      closeOnClickOutside={!form.submitting}
      closeOnEscape={!form.submitting}
      opened={opened}
      onClose={onClose}
      title={t("dialogs.teleport.title", { count: players.length })}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack>
          <Text c="dimmed" size="sm">
            {targetDescription}
          </Text>
          <SegmentedControl
            data={[
              {
                label: t("dialogs.teleport.coordinatesMode"),
                value: "coordinates",
              },
              { label: t("dialogs.teleport.playerMode"), value: "player" },
            ]}
            fullWidth
            {...form.getInputProps("mode")}
          />

          {form.values.mode === "coordinates" ? (
            <SimpleGrid cols={3}>
              <NumberInput
                label={t("dialogs.teleport.xCoordinateLabel")}
                name="x"
                placeholder="0"
                {...form.getInputProps("x")}
              />
              <NumberInput
                label={t("dialogs.teleport.yCoordinateLabel")}
                name="y"
                placeholder="0"
                {...form.getInputProps("y")}
              />
              <NumberInput
                label={t("dialogs.teleport.zCoordinateLabel")}
                name="z"
                placeholder="0"
                {...form.getInputProps("z")}
              />
            </SimpleGrid>
          ) : (
            <Select
              data={destinationPlayers.map((player) => ({
                label: player.username,
                value: player.id,
              }))}
              label={t("dialogs.teleport.destinationPlayerLabel")}
              name="targetPlayerId"
              nothingFoundMessage={t("dialogs.teleport.noDestinationPlayers")}
              placeholder={t("dialogs.teleport.selectPlayerPlaceholder")}
              searchable
              {...form.getInputProps("targetPlayerId")}
            />
          )}

          <Group justify="flex-end" mt="xs">
            <Button
              disabled={form.submitting}
              onClick={onClose}
              variant="default"
            >
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button
              disabled={!form.isValid()}
              loading={form.submitting}
              type="submit"
            >
              {t("dialogs.teleport.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
