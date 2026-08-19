import { useEffectEvent, useLayoutEffect } from "react";
import { Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";

interface RemoveFromWhitelistFormValues {
  deleteLocal: boolean;
}

interface RemoveFromWhitelistModalProps {
  onClose: () => void;
  onRemove: (players: Player[], deleteLocal: boolean) => Promise<boolean>;
  opened: boolean;
  players: Player[];
}

export function RemoveFromWhitelistModal({
  onClose,
  onRemove,
  opened,
  players,
}: RemoveFromWhitelistModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<RemoveFromWhitelistFormValues>({
    mode: "controlled",
    initialValues: { deleteLocal: false },
  });
  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleRemove(values: RemoveFromWhitelistFormValues) {
    const succeeded = await onRemove(players, values.deleteLocal);
    if (succeeded) onClose();
  }

  const targetDescription = t("dialogs.removeFromWhitelist.description", {
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
      title={t("dialogs.removeFromWhitelist.title", { count: players.length })}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleRemove)}>
        <Stack>
          <Text size="sm">{targetDescription}</Text>
          <Checkbox
            label={t("dialogs.removeFromWhitelist.deleteLocalLabel")}
            {...form.getInputProps("deleteLocal", { type: "checkbox" })}
          />
          <Group justify="flex-end" mt="xs">
            <Button
              disabled={form.submitting}
              onClick={onClose}
              variant="default"
            >
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button
              color="red"
              disabled={!form.isValid()}
              loading={form.submitting}
              type="submit"
            >
              {t("actions.remove", { ns: "common" })}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
