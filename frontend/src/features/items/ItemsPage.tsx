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
import { ItemBrowser } from "@/features/items/components/ItemBrowser";
import { PageContainer } from "@/shared/layout/PageContainer";
import {
  gameBuilds,
  isGameBuild,
  latestGameBuild,
  type GameBuild,
} from "@/features/game/types";
import { useItemCatalog } from "@/features/items/hooks/useItemCatalog";
import { useItemSelection } from "@/features/items/hooks/useItemSelection";

export function ItemsPage() {
  const { i18n, t } = useTranslation(["items", "common"]);
  const [build, setBuild] = useState<GameBuild>(latestGameBuild);
  const language = i18n.language;
  const { catalog, error, loading, reload } = useItemCatalog(build, language);
  const selection = useItemSelection();

  function handleBuildChange(value: string) {
    if (isGameBuild(value)) setBuild(value);
  }

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
          <SegmentedControl
            aria-label={t("gameBuild.label", { ns: "common" })}
            data={gameBuilds.map((value) => ({
              label: t(`gameBuild.options.${value}`, { ns: "common" }),
              value,
            }))}
            onChange={handleBuildChange}
            value={build}
          />
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
