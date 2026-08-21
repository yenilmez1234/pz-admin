import { useId, useMemo, useRef, type ReactNode } from "react";
import {
  ActionIcon,
  Badge,
  Checkbox,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconRestore } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OptionDefinition, OptionValue } from "../catalog";
import { unmetRequirements } from "../lib/catalog";
import { nestedTranslationText, translationText } from "../lib/translations";
import { serializeOptionValue, type OptionFormValues } from "../lib/values";
import type { OptionValidationIssue } from "../lib/validation";
import { validateOptionValues } from "../lib/validation";
import type { OptionFormUpdates } from "../lib/formUpdates";
import { useOptionDependencies } from "../lib/formUpdates";
import classes from "./OptionField.module.css";

interface OptionFieldProps {
  definition: OptionDefinition;
  form: UseFormReturnType<OptionFormValues>;
  updates: OptionFormUpdates;
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

function controlSize(definition: OptionDefinition) {
  if (definition.type === "boolean") return "intrinsic";
  if (definition.type === "integer" || definition.type === "number") {
    return "compact";
  }
  if (definition.choices && !definition.multiple) return "medium";
  if (
    definition.type === "string" &&
    definition.maximumLength !== undefined &&
    definition.maximumLength <= 24
  ) {
    return "medium";
  }
  return "wide";
}

function ordinaryValue(definition: OptionDefinition): OptionValue {
  const special = definition.specialValue?.value;
  if (
    definition.defaultValue !== undefined &&
    definition.defaultValue !== special
  ) {
    return definition.defaultValue;
  }
  if (definition.type === "integer" || definition.type === "number") {
    const minimum = definition.minimum ?? 0;
    if (minimum !== special) return minimum;
    return Math.min(minimum + 1, definition.maximum ?? minimum + 1);
  }
  return "";
}

function OptionFieldComponent({ definition, form, updates }: OptionFieldProps) {
  const id = useId();
  const dependencies = useMemo(
    () => [
      ...(definition.specialValue ? [definition.name] : []),
      ...(definition.requirements ?? []).map((item) => item.option),
    ],
    [definition],
  );
  useOptionDependencies(updates, dependencies);
  const { t } = useTranslation("options");
  const fields = t("fields", { returnObjects: true });
  const specialValues = t("specialValues", { returnObjects: true });
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
  const ordinaryValueRef = useRef<OptionValue | undefined>(
    specialActive || Array.isArray(value) ? undefined : value,
  );
  if (!specialActive && !Array.isArray(value)) ordinaryValueRef.current = value;
  const validationIssue: OptionValidationIssue | undefined =
    validateOptionValues([definition], values)[definition.name];
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
  const controlProps = {
    "aria-describedby": descriptionId,
    "aria-invalid": Boolean(error),
    "aria-labelledby": labelId,
    autoComplete: "off",
    disabled: definition.readOnly || specialActive,
    id,
    name: definition.name,
  };
  let control: ReactNode;
  const setValue = (nextValue: OptionValue | string[]) => {
    form.setFieldValue(definition.name, nextValue, { forceUpdate: false });
    if (form.errors[definition.name]) {
      form.clearFieldError(definition.name);
    }
    updates.notify(definition.name);
  };
  const restoreCatalogDefault = () => {
    const defaultValue = definition.defaultValue;
    if (defaultValue === undefined) return;

    form.setFieldValue(definition.name, defaultValue);
    form.clearFieldError(definition.name);
    updates.notify(definition.name);
  };

  if (definition.type === "boolean") {
    control = (
      <Switch
        {...controlProps}
        key={form.key(definition.name)}
        defaultChecked={value === true}
        onChange={(event) => setValue(event.currentTarget.checked)}
      />
    );
  } else if (definition.choices && definition.multiple) {
    control = (
      <MultiSelect
        {...controlProps}
        key={form.key(definition.name)}
        clearable
        data={definition.choices.map((choice) => ({
          label: nestedTranslationText(
            fields,
            definition.name,
            `choices.${choice.id}`,
            choice.id,
          ),
          value: serializeOptionValue(choice.value),
        }))}
        defaultValue={Array.isArray(value) ? value : []}
        onChange={setValue}
      />
    );
  } else if (definition.choices) {
    control = (
      <Select
        {...controlProps}
        key={form.key(definition.name)}
        allowDeselect={false}
        data={definition.choices.map((choice) => ({
          label: nestedTranslationText(
            fields,
            definition.name,
            `choices.${choice.id}`,
            choice.id,
          ),
          value: serializeOptionValue(choice.value),
        }))}
        defaultValue={value === undefined ? null : serializeOptionValue(value)}
        onChange={(nextValue) => {
          const choice = definition.choices?.find(
            (candidate) => serializeOptionValue(candidate.value) === nextValue,
          );
          if (choice) {
            setValue(choice.value);
          }
        }}
      />
    );
  } else if (definition.type === "integer" || definition.type === "number") {
    const displayedMaximum =
      definition.maximum === 2_147_483_647 ? undefined : definition.maximum;
    control = (
      <Stack gap={2}>
        <NumberInput
          {...controlProps}
          key={form.key(definition.name)}
          allowDecimal={definition.type === "number"}
          clampBehavior="blur"
          max={definition.maximum}
          min={definition.minimum}
          {...(definition.specialValue
            ? { value: typeof value === "number" ? value : "" }
            : { defaultValue: typeof value === "number" ? value : "" })}
          onChange={setValue}
        />
        {definition.minimum !== undefined || displayedMaximum !== undefined ? (
          <Text
            aria-label={t("field.numericRange", {
              context:
                definition.minimum === undefined
                  ? "maximum"
                  : displayedMaximum === undefined
                    ? "minimum"
                    : undefined,
              maximum: displayedMaximum,
              minimum: definition.minimum,
            })}
            c="dimmed"
            size="xs"
            ta="center"
          >
            {definition.minimum !== undefined && displayedMaximum !== undefined
              ? `${definition.minimum}–${displayedMaximum}`
              : definition.minimum !== undefined
                ? `≥ ${definition.minimum}`
                : `≤ ${displayedMaximum}`}
          </Text>
        ) : null}
      </Stack>
    );
  } else if (definition.type === "text" || definition.editor === "message") {
    const escapesLineBreaks = definition.editor !== "message";
    control = (
      <Textarea
        {...controlProps}
        key={form.key(definition.name)}
        autosize
        maxLength={definition.maximumLength}
        maxRows={10}
        minRows={3}
        defaultValue={
          typeof value === "string" && escapesLineBreaks
            ? value.split("\\n").join("\n")
            : typeof value === "string"
              ? value
              : ""
        }
        onChange={(event) =>
          setValue(
            escapesLineBreaks
              ? event.currentTarget.value.split("\n").join("\\n")
              : event.currentTarget.value,
          )
        }
      />
    );
  } else {
    control = (
      <TextInput
        {...controlProps}
        key={form.key(definition.name)}
        maxLength={definition.maximumLength}
        {...(definition.specialValue
          ? { value: typeof value === "string" ? value : "" }
          : { defaultValue: typeof value === "string" ? value : "" })}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
    );
  }

  if (definition.specialValue) {
    const specialValue = definition.specialValue;
    control = (
      <div className={classes.specialControl}>
        <Checkbox
          checked={specialActive}
          classNames={{ label: classes.specialCheckboxLabel }}
          disabled={definition.readOnly}
          label={translationText(
            specialValues,
            specialValue.meaning,
            specialValue.meaning,
          )}
          onChange={(event) => {
            if (event.currentTarget.checked) {
              if (!specialActive && !Array.isArray(value)) {
                ordinaryValueRef.current = value;
              }
              setValue(specialValue.value);
            } else {
              setValue(ordinaryValueRef.current ?? ordinaryValue(definition));
            }
          }}
          size="xs"
        />
        <div className={classes.specialValue}>{control}</div>
      </div>
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
        data-size={controlSize(definition)}
        data-special={definition.specialValue ? true : undefined}
      >
        {control}
      </div>
    </div>
  );
}

export const OptionField = OptionFieldComponent;
