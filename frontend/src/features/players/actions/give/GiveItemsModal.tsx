import { useState } from "react";
import { Alert, Box, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ItemGrant, type Player } from "@bindings/internal/player/models";
import { ItemBrowser } from "@/features/items/components/ItemBrowser";
import type { GameBuild } from "@/features/game/types";
import { useItemCatalog } from "@/features/items/hooks/useItemCatalog";
import { useItemSelection } from "@/features/items/hooks/useItemSelection";

interface GiveItemsModalProps {
  build: GameBuild;
  onClose: () => void;
  onGive: (players: Player[], items: ItemGrant[]) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function GiveItemsModal({
  build,
  onClose,
  onGive,
  opened,
  players,
}: GiveItemsModalProps) {
  const { i18n, t } = useTranslation(["players", "common"]);
  const { t: itemT } = useTranslation("items");
  const language = i18n.resolvedLanguage ?? i18n.language;
  const { catalog, error, loading, reload } = useItemCatalog(build, language);
  const selection = useItemSelection();
  const [browserRevision, setBrowserRevision] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function handleGive() {
    if (selection.selection.size === 0) return;

    const items = Array.from(
      selection.selection,
      ([item, count]) => new ItemGrant({ item, count }),
    );
    setSubmitting(true);
    try {
      if (await onGive(players, items)) onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function resetBrowser() {
    selection.clear();
    setBrowserRevision((current) => current + 1);
  }

  return (
    <Modal
      centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      onClose={onClose}
      onExitTransitionEnd={resetBrowser}
      opened={opened}
      size="xl"
      title={t("dialogs.giveItems.title", { count: players.length })}
      withCloseButton={!submitting}
    >
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          {t("dialogs.giveItems.description", {
            count: players.length,
            username: players[0]?.username,
          })}
        </Text>

        {error ? (
          <Alert
            aria-live="polite"
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={itemT("errors.loadTitle")}
          >
            <Stack align="flex-start" gap="xs">
              <Text size="sm">{error}</Text>
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : (
          <Box
            aria-busy={loading}
            h="min(62vh, 34rem)"
            style={{ display: "flex", minHeight: 0, overflow: "hidden" }}
          >
            <ItemBrowser
              key={`${build}:${language}:${browserRevision}`}
              catalog={catalog}
              loading={loading}
              selection={selection}
            />
          </Box>
        )}

        <Group justify="flex-end">
          <Button disabled={submitting} onClick={onClose} variant="default">
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button
            disabled={selection.selection.size === 0}
            loading={submitting}
            onClick={() => void handleGive()}
          >
            {t("dialogs.giveItems.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
