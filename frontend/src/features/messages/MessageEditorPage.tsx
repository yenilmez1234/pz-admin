import { Button, CopyButton, Group, Stack, Title } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormattedMessagePreview } from "@/features/messages/components/FormattedMessagePreview";
import { MessageEditor } from "@/features/messages/components/MessageEditor";
import {
  createEmptyMessage,
  serializeMessage,
} from "@/features/messages/lib/messageDocument";
import type { MessageDocument } from "@/features/messages/types";
import { PageContainer } from "@/shared/layout/PageContainer";
import classes from "./MessageEditorPage.module.css";

export function MessageEditorPage() {
  const { t } = useTranslation("messages");
  const [document, setDocument] = useState<MessageDocument>(createEmptyMessage);
  const formattedMessage = useMemo(
    () => serializeMessage(document),
    [document],
  );

  return (
    <PageContainer
      contentWidth="wide"
      h="100%"
      py="md"
      style={{ display: "flex", minHeight: 0, overflow: "hidden" }}
    >
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Title order={1}>{t("page.title")}</Title>

        <MessageEditor document={document} onChange={setDocument} />

        <FormattedMessagePreview value={formattedMessage} />

        <Group justify="flex-start">
          <CopyButton value={formattedMessage} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                aria-label={copied ? t("actions.copied") : t("actions.copy")}
                className={classes.copyButton}
                data-copied={copied || undefined}
                disabled={!formattedMessage}
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
