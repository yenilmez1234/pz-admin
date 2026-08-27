import {
  Alert,
  Group,
  Radio,
  Select,
  Skeleton,
  Stack,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  isThemeSetting,
  useAppConfig,
} from "@/features/config/AppConfigProvider";
import { defaultLanguage, isSupportedLanguage, locales } from "@/i18n/locales";

const languageOptions = locales.map(({ code, nativeName }) => ({
  value: code,
  label: nativeName,
}));

export function SettingsPage() {
  const { t } = useTranslation("settings");
  const { config, error, loading, setLanguage, setTheme } = useAppConfig();

  function handleThemeChange(theme: string) {
    if (isThemeSetting(theme)) void setTheme(theme);
  }

  function handleLanguageChange(language: string | null) {
    if (language && isSupportedLanguage(language)) void setLanguage(language);
  }

  return (
    <Stack gap="md">
      <Title order={1}>{t("page.title")}</Title>

      {!loading && !config && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={20} aria-hidden="true" />}
          title={t("errors.loadTitle")}
        >
          {error} {t("errors.loadRetryInstruction")}
        </Alert>
      )}

      {(loading || config) && (
        <Stack aria-busy={loading}>
          {error && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("errors.saveTitle")}
              aria-live="polite"
            >
              {error} {t("errors.saveRetryInstruction")}
            </Alert>
          )}

          <Skeleton visible={loading}>
            <Radio.Group
              name="theme"
              label={t("appearance.colorSchemeLabel")}
              description={t("appearance.description")}
              value={config?.theme ?? "system"}
              disabled={loading}
              onChange={handleThemeChange}
            >
              <Group mt="xs">
                <Radio value="system" label={t("appearance.system")} />
                <Radio value="light" label={t("appearance.light")} />
                <Radio value="dark" label={t("appearance.dark")} />
              </Group>
            </Radio.Group>
          </Skeleton>

          <Skeleton visible={loading}>
            <Select
              label={t("language.label")}
              description={t("language.description")}
              data={languageOptions}
              value={config?.language ?? defaultLanguage}
              disabled={loading}
              allowDeselect={false}
              autoComplete="off"
              name="language"
              onChange={handleLanguageChange}
            />
          </Skeleton>
        </Stack>
      )}
    </Stack>
  );
}
