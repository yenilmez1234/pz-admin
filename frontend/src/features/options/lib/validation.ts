import type { OptionDefinition } from "../catalog";
import { serializeOptionValue, type OptionFormValues } from "./values";

export type OptionValidationIssue =
  | { type: "invalidChoice" }
  | { type: "integer" }
  | { type: "maximum"; value: number }
  | { type: "maximumLength"; value: number }
  | { type: "minimum"; value: number }
  | { type: "number" }
  | { type: "required" };

export function validateOptionValues(
  definitions: readonly OptionDefinition[],
  values: OptionFormValues,
) {
  const issues: Record<string, OptionValidationIssue> = {};

  for (const definition of definitions) {
    if (definition.readOnly) continue;
    const value = values[definition.name];

    if (
      definition.specialValue?.meaning === "useSpawnRegions" &&
      value === ""
    ) {
      issues[definition.name] = { type: "required" };
      continue;
    }

    if (definition.choices) {
      const allowed = new Set(
        definition.choices.map((choice) => serializeOptionValue(choice.value)),
      );
      const selected = Array.isArray(value)
        ? value
        : [serializeOptionValue(value)];
      if (selected.some((choice) => !allowed.has(choice))) {
        issues[definition.name] = { type: "invalidChoice" };
      }
      continue;
    }

    if (definition.type === "integer" || definition.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        issues[definition.name] = { type: "number" };
      } else if (definition.type === "integer" && !Number.isInteger(value)) {
        issues[definition.name] = { type: "integer" };
      } else if (
        definition.minimum !== undefined &&
        value < definition.minimum
      ) {
        issues[definition.name] = {
          type: "minimum",
          value: definition.minimum,
        };
      } else if (
        definition.maximum !== undefined &&
        value > definition.maximum
      ) {
        issues[definition.name] = {
          type: "maximum",
          value: definition.maximum,
        };
      }
    } else if (
      typeof value === "string" &&
      definition.maximumLength !== undefined &&
      value.length > definition.maximumLength
    ) {
      issues[definition.name] = {
        type: "maximumLength",
        value: definition.maximumLength,
      };
    }
  }

  return issues;
}
