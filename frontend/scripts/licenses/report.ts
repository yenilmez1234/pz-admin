import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Plugin } from "vite";
import additionalNotices from "./additional-notices.json" with { type: "json" };

export const frontendLicenseAssetName = "licenses/frontend.json";

interface LicenseEntry {
  name: string;
  text?: string;
  source?: string;
  note?: string;
}

export function combineFrontendNotices(
  dependencies: LicenseEntry[],
  additions: LicenseEntry[],
) {
  const combined = structuredClone(dependencies);
  for (const addition of additions) {
    const matches = combined.filter((entry) => entry.name === addition.name);
    if (matches.length === 0) {
      combined.push(structuredClone(addition));
      continue;
    }
    for (const entry of matches) {
      if (!entry.text?.trim()) {
        entry.text = addition.text;
        entry.source = addition.source;
        entry.note = addition.note;
      }
    }
  }
  return combined;
}

function readAdditionalNotice({
  file,
  ...metadata
}: (typeof additionalNotices)[number]) {
  const text = readFileSync(new URL(file, import.meta.url), "utf8");
  return { ...metadata, text };
}

export function frontendLicenseReport(): Plugin {
  const output = new URL(
    "../../../.generated/licenses/frontend/",
    import.meta.url,
  );
  let dependencyReport: string;

  return {
    name: "frontend-license-report",
    apply: "build",
    generateBundle: {
      // Collect Vite's report without including it in the application bundle.
      order: "post",
      handler(_, bundle) {
        const report = bundle[frontendLicenseAssetName];
        if (report?.type !== "asset" || typeof report.source !== "string") {
          throw new Error("Vite did not generate the frontend license report");
        }
        dependencyReport = report.source;
        delete bundle[frontendLicenseAssetName];
      },
    },
    writeBundle() {
      const dependencies: LicenseEntry[] = JSON.parse(dependencyReport);
      const notices = additionalNotices.map(readAdditionalNotice);
      const combined = combineFrontendNotices(dependencies, notices);

      mkdirSync(output, { recursive: true });
      writeFileSync(
        new URL("dependencies.json", output),
        `${JSON.stringify(combined, null, 2)}\n`,
      );
    },
  };
}
