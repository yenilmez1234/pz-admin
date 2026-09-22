import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Code,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { System } from "@wailsio/runtime";
import { useTranslation } from "react-i18next";
import { errorMessage } from "@/shared/lib/errors";
import { CopyValueButton } from "@/shared/components/CopyValueButton";

type DiagnosticEnvironment = Omit<
  System.EnvironmentInfo,
  "OSInfo" | "PlatformInfo"
> & {
  OSInfo: System.OSInfo | null;
  PlatformInfo: Record<string, unknown> | null;
};

export function formatDiagnostics(info: DiagnosticEnvironment): string {
  const fields: Record<string, unknown> = {
    version: __APP_VERSION__,
    os: info.OS,
    arch: info.Arch,
    debug: info.Debug,
  };
  if (info.OSInfo) {
    fields["os_details.name"] = info.OSInfo.Name;
    fields["os_details.version"] = info.OSInfo.Version;
  }
  const platformEntries = Object.entries(info.PlatformInfo ?? {});
  // Sort a fresh array; toSorted is outside our ES2022 target.
  // oxlint-disable-next-line unicorn/no-array-sort
  platformEntries.sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of platformEntries) {
    fields[`platform.${key}`] = value;
  }
  return Object.entries(fields)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join("\n");
}

export function DiagnosticsSection() {
  const { t } = useTranslation(["settings", "common"]);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const info = await System.Environment();
        if (active) setReport(formatDiagnostics(info));
      } catch (cause) {
        if (active) setError(errorMessage(cause));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <Stack gap="sm" mt="md">
      <Title order={2}>{t("diagnostics.title")}</Title>
      <Text c="dimmed" size="sm">
        {t("diagnostics.description")}
      </Text>
      {error ? (
        <Alert color="red" title={t("diagnostics.errors.load.title")}>
          <Stack align="flex-start" gap="xs">
            {error}
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                setError(null);
                setAttempt((value) => value + 1);
              }}
            >
              {t("actions.retry", { ns: "common" })}
            </Button>
          </Stack>
        </Alert>
      ) : report === null ? (
        <Skeleton height={160} />
      ) : (
        <Box pos="relative">
          <Code
            block
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              paddingInlineEnd: 56,
            }}
          >
            {report}
          </Code>
          <Box pos="absolute" top={8} style={{ insetInlineEnd: 8 }}>
            <CopyValueButton
              variant="subtle"
              value={report}
              copyLabel={t("diagnostics.actions.copy")}
              copiedLabel={t("actions.copied", { ns: "common" })}
            />
          </Box>
        </Box>
      )}
    </Stack>
  );
}
