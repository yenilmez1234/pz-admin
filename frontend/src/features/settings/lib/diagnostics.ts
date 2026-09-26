import type { System } from "@wailsio/runtime";

type DiagnosticEnvironment = Omit<
  System.EnvironmentInfo,
  "OSInfo" | "PlatformInfo"
> & {
  OSInfo: System.OSInfo | null;
  PlatformInfo: Record<string, unknown> | null;
};

export function formatDiagnostics(info: DiagnosticEnvironment): string {
  const fields: Record<string, unknown> = {
    version: APP_VERSION,
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
