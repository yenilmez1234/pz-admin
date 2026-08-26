import { useState } from "react";
import { Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { utf8ByteLength } from "@/shared/lib/text";
import { FormattedMessagePreview } from "./FormattedMessagePreview";
import { GameMessageEditor } from "./GameMessageEditor";

interface MessageEditorDialogProps {
  descriptionId?: string;
  disabled?: boolean;
  invalid?: boolean;
  labelId?: string;
  maxBytes?: number;
  onChange: (value: string) => void;
  value: string;
}

/** Edits a serialized game message without exposing its document model to callers. */
export function MessageEditorDialog({
  descriptionId,
  disabled,
  invalid,
  labelId,
  maxBytes,
  onChange,
  value,
}: MessageEditorDialogProps) {
  const { t } = useTranslation(["messages", "common"]);
  const [opened, modal] = useDisclosure(false);
  const [draft, setDraft] = useState("");
  const overLimit =
    maxBytes !== undefined && utf8ByteLength(draft) > maxBytes;

  function openEditor() {
    setDraft(value);
    modal.open();
  }

  function applyChanges() {
    onChange(draft);
    modal.close();
  }

  return (
    <>
      <Button
        aria-describedby={descriptionId}
        aria-invalid={invalid || undefined}
        aria-labelledby={labelId}
        disabled={disabled}
        fullWidth
        leftSection={<IconEdit size={15} aria-hidden="true" />}
        onClick={openEditor}
        type="button"
        variant="default"
      >
        {t("actions.edit", { ns: "messages" })}
      </Button>

      <Modal
        centered
        opened={opened}
        onClose={modal.close}
        size="lg"
        title={t("dialog.title", { ns: "messages" })}
      >
        <Stack gap="md">
          <GameMessageEditor
            maxHeight="min(22rem, 40vh)"
            onChange={setDraft}
            value={draft}
          />
          <FormattedMessagePreview maxBytes={maxBytes} value={draft} />
          <Group justify="flex-end">
            <Button onClick={modal.close} variant="default">
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button disabled={overLimit} onClick={applyChanges}>
              {t("actions.apply", { ns: "messages" })}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
