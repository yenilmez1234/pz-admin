import type { ReactElement, ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import {
  render as testingLibraryRender,
  type RenderOptions,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { theme } from "@/app/theme";
import i18n from "@/i18n";

function TestProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider env="test" theme={theme}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MantineProvider>
  );
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return testingLibraryRender(ui, { wrapper: TestProvider, ...options });
}

export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
