import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from "react";
import { useMantineColorScheme } from "@mantine/core";
import {
  Config,
  SetLanguage,
  SetTheme,
} from "@bindings/internal/config/service";
import { errorMessage } from "@/utils/errors";
import i18n from "@/i18n";
import type { SupportedLanguage } from "@/i18n/locales";

export type ThemeSetting = "system" | "dark" | "light";
export type LanguageSetting = SupportedLanguage;

interface AppConfig {
  language: LanguageSetting;
  theme: ThemeSetting;
}

interface AppConfigContextValue {
  config: AppConfig | null;
  error: string | null;
  loading: boolean;
  setLanguage: (language: LanguageSetting) => Promise<void>;
  setTheme: (theme: ThemeSetting) => Promise<void>;
}

interface AppConfigProviderProps {
  children: ReactNode;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);
let configRequest: ReturnType<typeof Config> | null = null;

function loadConfig() {
  if (configRequest) return configRequest;

  const request = Config();
  configRequest = request;

  const clearRequest = () => {
    if (configRequest === request) configRequest = null;
  };

  void request.then(clearRequest, clearRequest);

  return request;
}

export function AppConfigProvider({ children }: AppConfigProviderProps) {
  const { setColorScheme } = useMantineColorScheme();
  const applyColorScheme = useEffectEvent(setColorScheme);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const language = config?.language;

  useEffect(() => {
    let active = true;

    loadConfig()
      .then((loadedConfig) => {
        if (!active) return;

        setConfig({
          language: loadedConfig.language as LanguageSetting,
          theme: loadedConfig.theme as ThemeSetting,
        });
        applyColorScheme(
          loadedConfig.theme === "system"
            ? "auto"
            : (loadedConfig.theme as "dark" | "light"),
        );
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!language) return;
    document.documentElement.lang = language;
    void i18n.changeLanguage(language);
  }, [language]);

  async function updateTheme(theme: ThemeSetting) {
    setError(null);
    try {
      await SetTheme(theme);
      setConfig((current) => current && { ...current, theme });
      setColorScheme(theme === "system" ? "auto" : theme);
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  async function updateLanguage(language: LanguageSetting) {
    setError(null);
    try {
      await SetLanguage(language);
      setConfig((current) => current && { ...current, language });
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  return (
    <AppConfigContext.Provider
      value={{
        config,
        error,
        loading,
        setLanguage: updateLanguage,
        setTheme: updateTheme,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context;
}
