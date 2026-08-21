import { Button, Group, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OptionDefinition } from "../catalog";
import type { OptionFormEvents } from "../hooks/useOptionFormEvents";
import { useFormSummaryUpdates } from "../hooks/useOptionFormEvents";
import type { OptionFormValues } from "../lib/optionValues";
import { validateOptionValues } from "../lib/validation";

interface OptionsActionsProps {
  definitions: readonly OptionDefinition[];
  form: UseFormReturnType<OptionFormValues>;
  onReset: () => void;
  saving: boolean;
  events: OptionFormEvents;
}

export function OptionsActions({
  definitions,
  form,
  onReset,
  saving,
  events,
}: OptionsActionsProps) {
  const { t } = useTranslation("options");
  useFormSummaryUpdates(events);
  const dirtyCount = definitions.reduce(
    (count, definition) => count + Number(form.isDirty(definition.name)),
    0,
  );
  const invalid =
    Object.keys(validateOptionValues(definitions, form.getValues())).length > 0;

  return (
    <>
      <Text c="dimmed" size="sm">
        {t("actions.unsaved", { count: dirtyCount })}
      </Text>
      <Group gap="sm" ml="auto">
        <Button
          disabled={dirtyCount === 0 || saving}
          variant="default"
          onClick={onReset}
        >
          {t("actions.reset")}
        </Button>
        <Button
          disabled={dirtyCount === 0 || invalid}
          leftSection={<IconDeviceFloppy size={16} aria-hidden="true" />}
          loading={saving}
          type="submit"
        >
          {t("actions.save")}
        </Button>
      </Group>
    </>
  );
}
