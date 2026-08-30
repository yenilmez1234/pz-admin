import { describe, expect, it } from "vitest";
import type { OptionDefinition, OptionValue } from "../catalog";
import {
  validateOptionValue,
  validateOptionValues,
  type OptionValidationIssue,
} from "./validation";

function definition(
  overrides: Partial<OptionDefinition> = {},
): OptionDefinition {
  return { name: "TestOption", type: "string", ...overrides };
}

describe("validateOptionValue", () => {
  it.each([
    { label: "an empty string", value: "" },
    { label: "an absent value", value: undefined },
  ])("requires a value instead of $label", ({ value }) => {
    expect(
      validateOptionValue(definition({ required: true }), {
        TestOption: value,
      }),
    ).toEqual({ type: "required" } satisfies OptionValidationIssue);
  });

  it.each([
    { label: "false", value: false },
    { label: "zero", value: 0 },
  ])("accepts $label as a required value", ({ value }) => {
    expect(
      validateOptionValue(definition({ required: true }), {
        TestOption: value,
      }),
    ).toBeUndefined();
  });

  const integerCases = [
    { expected: { type: "number" }, label: "non-numeric", value: "12" },
    { expected: { type: "number" }, label: "infinite", value: Infinity },
    { expected: { type: "integer" }, label: "fractional", value: 1.5 },
    {
      expected: { type: "minimum", value: 1 },
      label: "below the minimum",
      value: 0,
    },
    {
      expected: { type: "maximum", value: 10 },
      label: "above the maximum",
      value: 11,
    },
    { expected: undefined, label: "at the minimum", value: 1 },
    { expected: undefined, label: "at the maximum", value: 10 },
  ] satisfies readonly {
    expected: OptionValidationIssue | undefined;
    label: string;
    value: OptionValue | undefined;
  }[];

  it.each(integerCases)(
    "validates an integer that is $label",
    ({ expected, value }) => {
      expect(
        validateOptionValue(
          definition({ type: "integer", minimum: 1, maximum: 10 }),
          { TestOption: value },
        ),
      ).toEqual(expected);
    },
  );

  it("allows fractional values for number options", () => {
    expect(
      validateOptionValue(definition({ type: "number" }), {
        TestOption: 1.5,
      }),
    ).toBeUndefined();
  });

  it("reports the configured string length limit", () => {
    expect(
      validateOptionValue(definition({ maximumLength: 3 }), {
        TestOption: "four",
      }),
    ).toEqual({
      type: "maximumLength",
      value: 3,
    } satisfies OptionValidationIssue);
  });

  it.each([
    { label: "a scalar selection", value: 2 },
    { label: "multiple selections", value: ["one", "two"] },
  ])("accepts $label when every choice is allowed", ({ value }) => {
    expect(
      validateOptionValue(
        definition({
          choices: [
            { id: "one", value: "one" },
            { id: "two", value: "two" },
            { id: "numeric", value: 2 },
          ],
        }),
        { TestOption: value },
      ),
    ).toBeUndefined();
  });

  it("rejects a multiple selection if any choice is unknown", () => {
    expect(
      validateOptionValue(
        definition({ choices: [{ id: "one", value: "one" }] }),
        { TestOption: ["one", "unknown"] },
      ),
    ).toEqual({ type: "invalidChoice" } satisfies OptionValidationIssue);
  });

  it("does not validate read-only options", () => {
    expect(
      validateOptionValue(
        definition({ readOnly: true, required: true, maximumLength: 1 }),
        { TestOption: "invalid" },
      ),
    ).toBeUndefined();
  });
});

describe("validateOptionValues", () => {
  it("returns issues keyed by option name and omits valid options", () => {
    const definitions = [
      definition({ name: "Required", required: true }),
      definition({ name: "Limited", maximumLength: 3 }),
      definition({ name: "Valid" }),
    ];
    const values: Record<string, OptionValue | undefined> = {
      Required: "",
      Limited: "too long",
      Valid: "okay",
    };

    const expected = {
      Required: { type: "required" },
      Limited: { type: "maximumLength", value: 3 },
    } satisfies Record<string, OptionValidationIssue>;

    expect(validateOptionValues(definitions, values)).toEqual(expected);
  });
});
