import type { ReactNode } from "react";
import { act, render, waitFor } from "@/test/render";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Config as ConfigModel } from "@bindings/internal/config/models";
import {
  Config,
  SetLanguage,
  SetTheme,
} from "@bindings/internal/config/service";
import i18n from "@/i18n";
import { defaultLanguage } from "@/i18n/locales";
import { AppConfigProvider, useAppConfig } from "./AppConfigProvider";

const { setColorScheme } = vi.hoisted(() => ({
  setColorScheme: vi.fn(),
}));

vi.mock("@mantine/core", async (importOriginal) => {
  const mantine = await importOriginal<typeof import("@mantine/core")>();
  return {
    ...mantine,
    useMantineColorScheme: () => ({ setColorScheme }),
  };
});

vi.mock("@bindings/internal/config/service", () => ({
  Config: vi.fn(),
  SetLanguage: vi.fn(),
  SetTheme: vi.fn(),
}));

let appConfig: ReturnType<typeof useAppConfig>;

function ConfigProbe() {
  appConfig = useAppConfig();
  return null;
}

function renderProvider(children: ReactNode = <ConfigProbe />) {
  return render(<AppConfigProvider>{children}</AppConfigProvider>);
}

afterEach(() => {
  vi.resetAllMocks();
  document.documentElement.lang = defaultLanguage;
});

describe("AppConfigProvider", () => {
  it.each([
    {
      expectedLanguage: "tr-TR",
      expectedScheme: "dark",
      language: "tr-TR",
      theme: "dark",
    },
    {
      expectedLanguage: defaultLanguage,
      expectedScheme: "auto",
      language: "unsupported",
      theme: "system",
    },
  ] as const)(
    "loads language $language and applies theme $theme",
    async ({ expectedLanguage, expectedScheme, language, theme }) => {
      vi.mocked(Config).mockResolvedValue(new ConfigModel({ language, theme }));

      renderProvider();
      expect(appConfig.loading).toBe(true);

      await waitFor(() => expect(appConfig.loading).toBe(false));
      await waitFor(() => expect(i18n.language).toBe(expectedLanguage));

      expect(appConfig.config).toEqual({
        language: expectedLanguage,
        theme,
      });
      expect(document.documentElement.lang).toBe(expectedLanguage);
      expect(setColorScheme).toHaveBeenCalledOnce();
      expect(setColorScheme).toHaveBeenCalledWith(expectedScheme);
    },
  );

  it("exposes a configuration load failure", async () => {
    vi.mocked(Config).mockRejectedValue(new Error("config-load-failure"));

    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));

    expect(appConfig.config).toBeNull();
    expect(appConfig.error).toBe("config-load-failure");
    expect(setColorScheme).not.toHaveBeenCalled();
  });

  it("saves and applies language and theme changes", async () => {
    vi.mocked(Config).mockResolvedValue(
      new ConfigModel({ language: defaultLanguage, theme: "dark" }),
    );
    vi.mocked(SetLanguage).mockResolvedValue(undefined);
    vi.mocked(SetTheme).mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));

    await act(async () => {
      await appConfig.setLanguage("tr-TR");
    });
    await waitFor(() => expect(i18n.language).toBe("tr-TR"));

    expect(SetLanguage).toHaveBeenCalledOnce();
    expect(SetLanguage).toHaveBeenCalledWith("tr-TR");
    expect(appConfig.config).toEqual({ language: "tr-TR", theme: "dark" });
    expect(document.documentElement.lang).toBe("tr-TR");

    await act(async () => {
      await appConfig.setTheme("system");
    });

    expect(SetTheme).toHaveBeenCalledOnce();
    expect(SetTheme).toHaveBeenCalledWith("system");
    expect(appConfig.config).toEqual({ language: "tr-TR", theme: "system" });
    expect(setColorScheme).toHaveBeenLastCalledWith("auto");
    expect(appConfig.error).toBeNull();
  });

  it("preserves loaded settings and exposes failed writes", async () => {
    const initialConfig = { language: defaultLanguage, theme: "dark" } as const;
    vi.mocked(Config).mockResolvedValue(new ConfigModel(initialConfig));
    vi.mocked(SetLanguage).mockRejectedValue(
      new Error("language-write-failure"),
    );
    vi.mocked(SetTheme).mockRejectedValue(new Error("theme-write-failure"));
    renderProvider();
    await waitFor(() => expect(appConfig.loading).toBe(false));

    await act(async () => {
      await expect(appConfig.setLanguage("tr-TR")).resolves.toBeUndefined();
    });

    expect(appConfig.config).toEqual(initialConfig);
    expect(appConfig.error).toBe("language-write-failure");
    expect(document.documentElement.lang).toBe(defaultLanguage);
    expect(i18n.language).toBe(defaultLanguage);

    await act(async () => {
      await expect(appConfig.setTheme("light")).resolves.toBeUndefined();
    });

    expect(appConfig.config).toEqual(initialConfig);
    expect(appConfig.error).toBe("theme-write-failure");
    expect(setColorScheme).toHaveBeenCalledOnce();
    expect(setColorScheme).toHaveBeenCalledWith("dark");
  });
});
