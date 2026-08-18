import React from "react";
import ReactDOM from "react-dom/client";
import { Badge, createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./i18n";
import App from "./App";
import { nonPersistentColorSchemeManager } from "./config/colorSchemeManager";
import { AppConfigProvider } from "./providers/AppConfigProvider";
import { PlayersProvider } from "./providers/PlayersProvider";
import { SessionProvider } from "./providers/SessionProvider";

const rootElement = document.getElementById("root");
const theme = createTheme({
  components: {
    Badge: Badge.extend({ defaultProps: { tt: "none" } }),
  },
  fontFamily: '"Inter Variable", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono Variable", monospace',
  headings: { fontFamily: '"Inter Variable", sans-serif' },
});

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <MantineProvider
      colorSchemeManager={nonPersistentColorSchemeManager}
      defaultColorScheme="auto"
      theme={theme}
    >
      <Notifications />
      <AppConfigProvider>
        <SessionProvider>
          <PlayersProvider>
            <App />
          </PlayersProvider>
        </SessionProvider>
      </AppConfigProvider>
    </MantineProvider>
  </React.StrictMode>,
);
