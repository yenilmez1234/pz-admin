import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMantineColorScheme } from "@mantine/core";
import {
  Config,
  SetLanguage,
  SetTheme,
} from "@bindings/internal/config/service";
import { errorMessage } from "@/shared/lib/errors";
import i18n from "@/i18n";
import { isSupportedLanguage, type SupportedLanguage } from "@/i18n/locales";

export type ThemeSetting = "system" | "dark" | "light";
export type LanguageSetting = SupportedLanguage;

interface AppConfig {
  language: LanguageSetting;
  theme: ThemeSetting;
}

export function isThemeSetting(theme: string): theme is ThemeSetting {
  return theme === "system" || theme === "dark" || theme === "light";
}

function appConfigFromBinding(config: {
  language: string;
  theme: string;
}): AppConfig {
  if (!isSupportedLanguage(config.language)) {
    throw new Error(`Unsupported language: ${config.language}`);
  }
  if (!isThemeSetting(config.theme)) {
    throw new Error(`Unsupported theme: ${config.theme}`);
  }
  return { language: config.language, theme: config.theme };
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
  const activeLanguage = config?.language;

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const loadedConfig = await loadConfig();
        if (!active) return;

        const nextConfig = appConfigFromBinding(loadedConfig);
        setConfig(nextConfig);
        applyColorScheme(
          nextConfig.theme === "system" ? "auto" : nextConfig.theme,
        );
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeLanguage) return;
    document.documentElement.lang = activeLanguage;
    void i18n.changeLanguage(activeLanguage);
  }, [activeLanguage]);

  const updateTheme = useCallback(
    async (theme: ThemeSetting) => {
      setError(null);
      try {
        await SetTheme(theme);
        setConfig((current) => current && { ...current, theme });
        setColorScheme(theme === "system" ? "auto" : theme);
      } catch (saveError) {
        setError(errorMessage(saveError));
      }
    },
    [setColorScheme],
  );

  const updateLanguage = useCallback(async (nextLanguage: LanguageSetting) => {
    setError(null);
    try {
      await SetLanguage(nextLanguage);
      setConfig((current) => current && { ...current, language: nextLanguage });
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }, []);

  const value = useMemo<AppConfigContextValue>(
    () => ({
      config,
      error,
      loading,
      setLanguage: updateLanguage,
      setTheme: updateTheme,
    }),
    [config, error, loading, updateLanguage, updateTheme],
  );

  return (
    <AppConfigContext.Provider value={value}>
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
