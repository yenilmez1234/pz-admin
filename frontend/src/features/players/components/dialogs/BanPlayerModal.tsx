import { useEffectEvent, useLayoutEffect } from "react";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";

interface BanFormValues {
  banIP: boolean;
  reason: string;
}

interface BanPlayerModalProps {
  onBan: (
    players: Player[],
    reason: string,
    banIP: boolean,
  ) => Promise<boolean>;
  onClose: () => void;
  opened: boolean;
  players: Player[];
}

export function BanPlayerModal({
  onBan,
  onClose,
  opened,
  players,
}: BanPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const form = useForm<BanFormValues>({
    mode: "uncontrolled",
    initialValues: { banIP: false, reason: "" },
  });

  const resetForm = useEffectEvent(() => form.reset());

  useLayoutEffect(() => {
    if (opened) resetForm();
  }, [opened]);

  async function handleSubmit(values: BanFormValues) {
    const succeeded = await onBan(players, values.reason.trim(), values.banIP);
    if (succeeded) onClose();
  }

  const targetDescription = t("banDialog.description", {
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
      title={t("banDialog.title", { count: players.length })}
      withCloseButton={!form.submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text c="dimmed" size="sm">
            {targetDescription}
          </Text>
          <Textarea
            key={form.key("reason")}
            autosize
            label={t("fields.reason", { ns: "common" })}
            maxRows={5}
            minRows={3}
            name="reason"
            placeholder={t("placeholders.optional", { ns: "common" })}
            {...form.getInputProps("reason")}
          />
          <Checkbox
            key={form.key("banIP")}
            label={t("banDialog.banIpLabel")}
            {...form.getInputProps("banIP", { type: "checkbox" })}
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
              {t("banDialog.submit")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
