import type { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AppConfigProvider } from "@/features/config/AppConfigProvider";
import { nonPersistentColorSchemeManager } from "@/features/config/colorSchemeManager";
import { PlayersProvider } from "@/features/players/PlayersProvider";
import { SessionProvider } from "@/features/session/SessionProvider";
import { theme } from "./theme";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MantineProvider
      colorSchemeManager={nonPersistentColorSchemeManager}
      defaultColorScheme="auto"
      theme={theme}
    >
      <Notifications />
      <AppConfigProvider>
        <SessionProvider>
          <PlayersProvider>{children}</PlayersProvider>
        </SessionProvider>
      </AppConfigProvider>
    </MantineProvider>
  );
}
