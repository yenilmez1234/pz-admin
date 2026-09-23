import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import wails from "@wailsio/runtime/plugins/vite";
import { defineConfig } from "vitest/config";
import {
  frontendLicenseAssetName,
  frontendLicenseReport,
} from "./scripts/licenses/report.ts";

export default defineConfig({
  build: {
    license: { fileName: frontendLicenseAssetName },
  },
  define: {
    APP_VERSION: JSON.stringify(
      readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(),
    ),
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [react(), wails("./bindings"), frontendLicenseReport()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/data/**",
        "src/test/**",
        "src/vite-env.d.ts",
      ],
    },
  },
});
