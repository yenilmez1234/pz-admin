import { beforeEach, describe, expect, it, vi } from "vitest";
import { System } from "@wailsio/runtime";
import i18n from "@/i18n";
import { fireEvent, render, screen } from "@/test/render";
import { DiagnosticsSection } from "@/features/settings/components/DiagnosticsSection";
import { formatDiagnostics } from "@/features/settings/lib/diagnostics";

vi.mock("@wailsio/runtime", () => ({
  System: { Environment: vi.fn() },
}));

const environment: System.EnvironmentInfo = {
  OS: "linux",
  Arch: "arm64",
  Debug: false,
  OSInfo: { Name: "Example OS", Version: "1", ID: "example", Branding: "" },
  PlatformInfo: { wayland: true, "gtk4-runtime": "4.20.0" },
};

describe("DiagnosticsSection", () => {
  beforeEach(() => {
    vi.mocked(System.Environment).mockReset();
    vi.mocked(System.Environment).mockResolvedValue(environment);
  });

  it("formats environment data including false flags and sorted platform fields", () => {
    const report = formatDiagnostics(environment);
    expect(report).toContain("os: linux\narch: arm64\ndebug: false");
    expect(report).toContain(
      "os_details.name: Example OS\nos_details.version: 1",
    );
    expect(report).toContain(
      "platform.gtk4-runtime: 4.20.0\nplatform.wayland: true",
    );
    expect(
      formatDiagnostics({
        ...environment,
        OSInfo: null,
        PlatformInfo: null,
      }),
    ).not.toContain("os_details");
  });

  it("shows the report and enables copying after loading", async () => {
    render(<DiagnosticsSection />);
    expect(
      await screen.findByText(/platform\.wayland: true/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: i18n.t("diagnostics.actions.copy", { ns: "settings" }),
      }),
    ).toBeEnabled();
  });

  it("allows retrying a failed environment request", async () => {
    vi.mocked(System.Environment).mockRejectedValueOnce(
      new Error("Unavailable"),
    );
    render(<DiagnosticsSection />);
    expect(await screen.findByText("Unavailable")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: i18n.t("actions.retry", { ns: "common" }),
      }),
    );
    expect(
      await screen.findByText(/platform\.wayland: true/),
    ).toBeInTheDocument();
    expect(System.Environment).toHaveBeenCalledTimes(2);
  });
});
