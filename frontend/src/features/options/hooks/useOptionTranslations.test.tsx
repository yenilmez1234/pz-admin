import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import optionCatalog from "@/i18n/resources/en-US/optionCatalog.json";
import { useOptionTranslations } from "./useOptionTranslations";

describe("useOptionTranslations", () => {
  it("resolves shared enforcement choices", () => {
    const { result } = renderHook(() => useOptionTranslations());

    expect(
      result.current.choiceLabel("AntiCheatChecksum", "ban", "enforcement"),
    ).toBe(optionCatalog.choiceSets.enforcement.ban);
    expect(
      result.current.choiceLabel("BadWordPolicy", "log", "enforcement"),
    ).toBe(optionCatalog.choiceSets.enforcement.log);
  });

  it("keeps field-specific choices and unknown fallbacks", () => {
    const { result } = renderHook(() => useOptionTranslations());

    expect(result.current.choiceLabel("SteamScoreboard", "everyone")).toBe(
      optionCatalog.fields.SteamScoreboard.choices.everyone,
    );
    expect(result.current.choiceLabel("Unknown", "custom")).toBe("custom");
  });
});
