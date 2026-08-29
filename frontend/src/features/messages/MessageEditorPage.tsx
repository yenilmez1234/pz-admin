import { Group, Stack, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GameBuildSelector } from "@/features/game/components/GameBuildSelector";
import type { GameBuild } from "@/features/game/types";
import { FormattedMessagePreview } from "@/features/messages/components/FormattedMessagePreview";
import { GameMessageEditor } from "@/features/messages/components/GameMessageEditor";
import { PageContainer } from "@/shared/layout/PageContainer";
import classes from "./MessageEditorPage.module.css";

interface MessageEditorPageProps {
  build: GameBuild;
  onBuildChange: (build: GameBuild) => void;
}

export function MessageEditorPage({
  build,
  onBuildChange,
}: MessageEditorPageProps) {
  const { t } = useTranslation(["messages", "common"]);
  const [message, setMessage] = useState("");

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
          <GameBuildSelector
            onChange={onBuildChange}
            value={build}
          />
        </Group>

        <GameMessageEditor
          key={build}
          build={build}
          className={classes.editor}
          onChange={setMessage}
          value={message}
        />

        <FormattedMessagePreview value={message} />
      </Stack>
    </PageContainer>
  );
}
