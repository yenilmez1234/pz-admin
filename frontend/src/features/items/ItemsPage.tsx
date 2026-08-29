import { Alert, Button, Group, Stack, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ItemBrowser } from "@/features/items/components/ItemBrowser";
import { PageContainer } from "@/shared/layout/PageContainer";
import { GameBuildSelector } from "@/features/game/components/GameBuildSelector";
import type { GameBuild } from "@/features/game/types";
import { useItemCatalog } from "@/features/items/hooks/useItemCatalog";
import { useItemSelection } from "@/features/items/hooks/useItemSelection";

interface ItemsPageProps {
  build: GameBuild;
  onBuildChange: (build: GameBuild) => void;
}

export function ItemsPage({ build, onBuildChange }: ItemsPageProps) {
  const { i18n, t } = useTranslation(["items", "common"]);
  const language = i18n.language;
  const { catalog, error, loading, reload } = useItemCatalog(build, language);
  const selection = useItemSelection();

  return (
    <PageContainer
      contentWidth="wide"
      h="100%"
      py="md"
      style={{ display: "flex", minHeight: 0, overflow: "hidden" }}
    >
      <Stack gap="md" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Group justify="space-between">
          <Title order={1}>{t("page.title")}</Title>
          <GameBuildSelector onChange={onBuildChange} value={build} />
        </Group>

        {error ? (
          <Alert
            color="red"
            icon={<IconAlertCircle aria-hidden="true" size={20} />}
            title={t("errors.loadTitle")}
          >
            <Stack align="flex-start" gap="xs">
              {error}
              <Button onClick={reload} size="xs" variant="light">
                {t("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <ItemBrowser
          key={`${build}:${language}`}
          catalog={catalog}
          loading={loading}
          selection={selection}
        />
      </Stack>
    </PageContainer>
  );
}
