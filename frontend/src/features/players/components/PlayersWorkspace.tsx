import { useState } from "react";
import { Alert, Box, Button, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { defaultLanguage } from "@/i18n/locales";
import { PageContainer } from "@/shared/layout/PageContainer";
import { useAppConfig } from "@/features/config/AppConfigProvider";
import { usePlayers } from "@/features/players/PlayersProvider";
import { PlayerBulkActions } from "./PlayerBulkActions";
import { PlayerTable } from "./PlayerTable";

export function PlayersWorkspace() {
  const { t } = useTranslation(["players", "common"]);
  const { config } = useAppConfig();
  const { error, loading, players, refresh } = usePlayers();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const selectedPlayers = players.filter((player) =>
    selectedPlayerIds.has(player.id),
  );

  return (
    <PageContainer
      contentWidth="wide"
      h="100%"
      pos="relative"
      px={0}
      style={{ overflow: "hidden" }}
    >
      <Stack
        gap="md"
        h="100%"
        px="xl"
        py="md"
        pb={selectedPlayers.length > 0 ? 88 : "md"}
        aria-busy={loading}
        style={{ overflowY: "auto" }}
      >
        {error ? (
          <Alert
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={t("loadError.title")}
            aria-live="polite"
          >
            <Stack gap="xs" align="flex-start">
              <Text size="sm">{error}</Text>
              <Button variant="light" size="xs" onClick={() => void refresh()}>
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <PlayerTable
          language={config?.language ?? defaultLanguage}
          loading={loading}
          onSelectionChange={setSelectedPlayerIds}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          showEmptyState={!error}
        />
      </Stack>

      {selectedPlayers.length > 0 ? (
        <Box
          bottom="var(--mantine-spacing-md)"
          left="var(--mantine-spacing-md)"
          pos="absolute"
          right="var(--mantine-spacing-md)"
          style={{
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <PlayerBulkActions
            onClear={() => setSelectedPlayerIds(new Set())}
            players={selectedPlayers}
          />
        </Box>
      ) : null}
    </PageContainer>
  );
}
