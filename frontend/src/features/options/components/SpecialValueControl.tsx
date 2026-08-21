import { useRef, type ReactNode } from "react";
import { Checkbox } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type {
  OptionDefinition,
  OptionSpecialValue,
  OptionValue,
} from "../catalog";
import { translationText } from "../lib/translationLookup";
import type { OptionFormValue } from "../lib/optionValues";
import classes from "./OptionField.module.css";

interface SpecialValueControlProps {
  children: ReactNode;
  definition: OptionDefinition;
  onChange: (value: OptionFormValue) => void;
  specialValue: OptionSpecialValue;
  value: OptionFormValue | undefined;
}

function initialOrdinaryValue(definition: OptionDefinition): OptionValue {
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

/** Keeps the user's ordinary value while a semantic sentinel is active. */
export function SpecialValueControl({
  children,
  definition,
  onChange,
  specialValue,
  value,
}: SpecialValueControlProps) {
  const { t } = useTranslation("options");
  const labels = t("specialValues", { returnObjects: true });
  const active = value === specialValue.value;
  const ordinaryValue = useRef<OptionValue | undefined>(
    active || Array.isArray(value) ? undefined : value,
  );
  if (!active && !Array.isArray(value)) ordinaryValue.current = value;

  return (
    <div className={classes.specialControl}>
      <Checkbox
        checked={active}
        classNames={{ label: classes.specialCheckboxLabel }}
        disabled={definition.readOnly}
        label={translationText(
          labels,
          specialValue.meaning,
          specialValue.meaning,
        )}
        onChange={(event) => {
          onChange(
            event.currentTarget.checked
              ? specialValue.value
              : (ordinaryValue.current ?? initialOrdinaryValue(definition)),
          );
        }}
        size="xs"
      />
      <div className={classes.specialValue}>{children}</div>
    </div>
  );
}
