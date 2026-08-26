import {
  Button,
  CopyButton,
  Group,
  SegmentedControl,
  Stack,
  Title,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { FormattedMessagePreview } from "@/features/messages/components/FormattedMessagePreview";
import { GameMessageEditor } from "@/features/messages/components/GameMessageEditor";
import { PageContainer } from "@/shared/layout/PageContainer";
import classes from "./MessageEditorPage.module.css";

export function MessageEditorPage() {
  const { t } = useTranslation(["messages", "common"]);
  const [build, setBuild] = useState<GameBuild>("42");
  const [message, setMessage] = useState("");

  function handleBuildChange(nextBuild: string) {
    if (nextBuild === "41" || nextBuild === "42") setBuild(nextBuild);
  }

  return (
    <PageContainer
      contentWidth="wide"
      h="100%"
      py="md"
      style={{ display: "flex", minHeight: 0, overflow: "hidden" }}
    >
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
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

        <GameMessageEditor
          key={build}
          build={build}
          onChange={setMessage}
          value={message}
        />

        <FormattedMessagePreview value={message} />

        <Group justify="flex-start">
          <CopyButton value={message} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                aria-label={copied ? t("actions.copied") : t("actions.copy")}
                className={classes.copyButton}
                data-copied={copied || undefined}
                disabled={!message}
                leftSection={
                  copied ? (
                    <IconCheck aria-hidden="true" size={16} />
                  ) : (
                    <IconCopy aria-hidden="true" size={16} />
                  )
                }
                onClick={copy}
                variant="default"
              >
                {t("actions.copy")}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Stack>
    </PageContainer>
  );
}
