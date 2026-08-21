import type { OptionDefinition, OptionValue } from "../catalog";

export type OptionFormValue = OptionValue | string[];
export type OptionFormValues = Record<string, OptionFormValue>;

export function parseOptionValue(
  definition: OptionDefinition,
  rawValue: string,
): OptionFormValue {
  if (definition.multiple) {
    return rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (definition.type === "boolean") {
    if (rawValue === "true") return true;
    if (rawValue === "false") return false;
    throw new Error(`${definition.name} returned an invalid boolean value`);
  }

  if (definition.type === "integer" || definition.type === "number") {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`${definition.name} returned an invalid number`);
    }
    return value;
  }

  return rawValue;
}

export function serializeOptionValue(value: OptionFormValue): string {
  if (Array.isArray(value)) return value.join(",");
  return String(value);
}

export function optionValues(
  definitions: readonly OptionDefinition[],
  rawValues: Record<string, string | undefined>,
): OptionFormValues {
  const values: OptionFormValues = {};
  for (const definition of definitions) {
    const rawValue = rawValues[definition.name];
    if (rawValue !== undefined) {
      values[definition.name] = parseOptionValue(definition, rawValue);
    }
  }
  return values;
}
