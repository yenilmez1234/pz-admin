import { useId, useMemo } from "react";
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconRestore } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OptionDefinition, OptionValue } from "../catalog";
import type { OptionFormEvents } from "../hooks/useOptionFormEvents";
import { useOptionValueUpdates } from "../hooks/useOptionFormEvents";
import { unmetRequirements } from "../lib/catalogQueries";
import type { OptionFormValue, OptionFormValues } from "../lib/optionValues";
import { nestedTranslationText } from "../lib/translationLookup";
import type { OptionValidationIssue } from "../lib/validation";
import { validateOptionValue } from "../lib/validation";
import classes from "./OptionField.module.css";
import { OptionInput, optionControlSize } from "./OptionInput";
import { SpecialValueControl } from "./SpecialValueControl";

interface OptionFieldProps {
  definition: OptionDefinition;
  form: UseFormReturnType<OptionFormValues>;
  events: OptionFormEvents;
}

function expectedValueLabel(
  value: OptionValue,
  enabled: string,
  disabled: string,
) {
  if (value === true) return enabled;
  if (value === false) return disabled;
  return String(value);
}

function OptionFieldComponent({ definition, events, form }: OptionFieldProps) {
  const id = useId();
  // An uncontrolled field rerenders only for values that affect its derived UI.
  const dependencies = useMemo(
    () => [
      ...(definition.specialValue ? [definition.name] : []),
      ...(definition.requirements ?? []).map((item) => item.option),
    ],
    [definition],
  );
  useOptionValueUpdates(events, dependencies);
  const { t } = useTranslation("options");
  const fields = t("fields", { returnObjects: true });
  const label = nestedTranslationText(
    fields,
    definition.name,
    "label",
    definition.name,
  );
  const description = nestedTranslationText(
    fields,
    definition.name,
    "description",
    "",
  );
  const values = form.getValues();
  const value = values[definition.name];
  const specialActive =
    definition.specialValue !== undefined &&
    value === definition.specialValue.value;
  const validationIssue: OptionValidationIssue | undefined =
    validateOptionValue(definition, values);
  const validationError = validationIssue
    ? t(`validation.${validationIssue.type}`, {
        value: "value" in validationIssue ? validationIssue.value : undefined,
      })
    : null;
  const error = form.errors[definition.name] ?? validationError;
  const unmet = unmetRequirements(definition, values);
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const isBoolean = definition.type === "boolean";
  const canRestoreDefault =
    !definition.readOnly &&
    definition.defaultValue !== undefined &&
    value !== definition.defaultValue;
  const setValue = (nextValue: OptionFormValue) => {
    // Keep typing in the DOM; the targeted event updates only dependent UI.
    form.setFieldValue(definition.name, nextValue, { forceUpdate: false });
    if (form.errors[definition.name]) {
      form.clearFieldError(definition.name);
    }
    events.notify(definition.name);
  };
  const restoreCatalogDefault = () => {
    const defaultValue = definition.defaultValue;
    if (defaultValue === undefined) return;

    form.setFieldValue(definition.name, defaultValue);
    form.clearFieldError(definition.name);
    events.notify(definition.name);
  };

  let control = (
    <OptionInput
      definition={definition}
      descriptionId={descriptionId}
      disabled={definition.readOnly || specialActive}
      error={error}
      inputId={id}
      inputKey={form.key(definition.name)}
      labelId={labelId}
      onChange={setValue}
      value={value}
    />
  );

  if (definition.specialValue) {
    control = (
      <SpecialValueControl
        definition={definition}
        onChange={setValue}
        specialValue={definition.specialValue}
        value={value}
      >
        {control}
      </SpecialValueControl>
    );
  }

  return (
    <div
      className={classes.root}
      data-boolean={isBoolean || undefined}
      data-inactive={unmet.length > 0 || undefined}
    >
      <Stack id={descriptionId} gap={3} className={classes.details}>
        <Group gap="xs" wrap="nowrap">
          <Text id={labelId} fw={500} size="sm">
            {label}
          </Text>
          {canRestoreDefault ? (
            <Tooltip label={t("field.restoreCatalogDefault")}>
              <ActionIcon
                aria-label={t("field.restoreCatalogDefault")}
                color="gray"
                onClick={restoreCatalogDefault}
                size="xs"
                variant="subtle"
              >
                <IconRestore size={13} aria-hidden="true" />
              </ActionIcon>
            </Tooltip>
          ) : null}
          {unmet.length > 0 ? (
            <Badge color="gray" size="xs" variant="light">
              {t("field.notInEffect")}
            </Badge>
          ) : null}
          {definition.writeOnly ? (
            <Tooltip label={t("field.writeOnlyDescription")}>
              <Badge color="gray" size="xs" variant="light">
                {t("field.writeOnly")}
              </Badge>
            </Tooltip>
          ) : null}
        </Group>
        {description ? (
          <Text c="dimmed" size="xs">
            {description}
          </Text>
        ) : null}
        {unmet.map((requirement) => (
          <Text key={requirement.option} size="xs" c="dimmed">
            {t("field.requirement", {
              option: nestedTranslationText(
                fields,
                requirement.option,
                "label",
                requirement.option,
              ),
              value: expectedValueLabel(
                requirement.equals,
                t("values.enabled"),
                t("values.disabled"),
              ),
            })}
          </Text>
        ))}
        {error ? (
          <Text c="red" size="xs" role="alert">
            {error}
          </Text>
        ) : null}
      </Stack>
      <div
        className={classes.control}
        data-size={optionControlSize(definition)}
        data-special={definition.specialValue ? true : undefined}
      >
        {control}
      </div>
    </div>
  );
}

export const OptionField = OptionFieldComponent;
