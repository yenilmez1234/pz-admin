import type { ReactNode } from "react";
import {
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { OptionDefinition } from "../catalog";
import { nestedTranslationText } from "../lib/translationLookup";
import {
  serializeOptionValue,
  type OptionFormValue,
} from "../lib/optionValues";

interface OptionInputProps {
  definition: OptionDefinition;
  descriptionId: string;
  disabled: boolean;
  error: ReactNode;
  inputId: string;
  inputKey: string;
  labelId: string;
  onChange: (value: OptionFormValue) => void;
  value: OptionFormValue | undefined;
}

export function optionControlSize(definition: OptionDefinition) {
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

export function OptionInput({
  definition,
  descriptionId,
  disabled,
  error,
  inputId,
  inputKey,
  labelId,
  onChange,
  value,
}: OptionInputProps) {
  const { t } = useTranslation("options");
  const fields = t("fields", { returnObjects: true });
  const commonProps = {
    "aria-describedby": descriptionId,
    "aria-invalid": Boolean(error),
    "aria-labelledby": labelId,
    autoComplete: "off",
    disabled,
    id: inputId,
    name: definition.name,
  };

  if (definition.type === "boolean") {
    return (
      <Switch
        {...commonProps}
        key={inputKey}
        defaultChecked={value === true}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    );
  }

  if (definition.choices && definition.multiple) {
    return (
      <MultiSelect
        {...commonProps}
        key={inputKey}
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
        onChange={onChange}
      />
    );
  }

  if (definition.choices) {
    return (
      <Select
        {...commonProps}
        key={inputKey}
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
        onChange={(selectedValue) => {
          const choice = definition.choices?.find(
            (candidate) =>
              serializeOptionValue(candidate.value) === selectedValue,
          );
          if (choice) onChange(choice.value);
        }}
      />
    );
  }

  if (definition.type === "integer" || definition.type === "number") {
    // Integer.MAX_VALUE is an implementation ceiling, not useful user guidance.
    const displayedMaximum =
      definition.maximum === 2_147_483_647 ? undefined : definition.maximum;
    return (
      <Stack gap={2}>
        <NumberInput
          {...commonProps}
          key={inputKey}
          allowDecimal={definition.type === "number"}
          clampBehavior="blur"
          max={definition.maximum}
          min={definition.minimum}
          {...(definition.specialValue
            ? { value: typeof value === "number" ? value : "" }
            : { defaultValue: typeof value === "number" ? value : "" })}
          onChange={onChange}
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
  }

  if (definition.type === "text" || definition.editor === "message") {
    // Generic multiline options use literal `\n`; the message editor owns its
    // own serialization and therefore receives the value unchanged.
    const escapesLineBreaks = definition.editor !== "message";
    return (
      <Textarea
        {...commonProps}
        key={inputKey}
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
          onChange(
            escapesLineBreaks
              ? event.currentTarget.value.split("\n").join("\\n")
              : event.currentTarget.value,
          )
        }
      />
    );
  }

  return (
    <TextInput
      {...commonProps}
      key={inputKey}
      maxLength={definition.maximumLength}
      type={definition.secret ? "password" : "text"}
      {...(definition.specialValue
        ? { value: typeof value === "string" ? value : "" }
        : { defaultValue: typeof value === "string" ? value : "" })}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
