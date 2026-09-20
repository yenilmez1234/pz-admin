import { afterEach, describe, expect, it } from "vitest";
import {
  defaultResources,
  interfaceTranslationCoverage,
  resources,
} from "./resources";

const testLanguage = "coverage-test";

afterEach(() => {
  delete resources[testLanguage];
});

describe("interface translation coverage", () => {
  it("returns zero for a language without translations", () => {
    expect(interfaceTranslationCoverage(testLanguage)).toBe(0);
  });

  it("returns full coverage for complete translations", () => {
    resources[testLanguage] = { ...defaultResources };
    expect(interfaceTranslationCoverage(testLanguage)).toBe(100);
  });

  it("gives a missing catalog the same weight as any other namespace", () => {
    const namespaceCount = Object.keys(defaultResources).length;
    const expected = Math.round(((namespaceCount - 1) / namespaceCount) * 100);

    for (const namespace of ["optionCatalog", "settings"] as const) {
      resources[testLanguage] = { ...defaultResources };
      delete resources[testLanguage][namespace];
      expect(interfaceTranslationCoverage(testLanguage)).toBe(expected);
    }
  });
});
