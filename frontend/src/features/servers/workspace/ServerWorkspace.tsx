import type { ReactNode } from "react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { IconTerminal2, IconUsers } from "@tabler/icons-react";
import {
  SectionNavigation,
  SectionNavigationPanel,
} from "@/shared/layout/SectionNavigation";
import { useSession } from "@/features/session/useSession";
import { errorMessage } from "@/shared/lib/errors";
import { ConsolePage } from "@/features/console/components/ConsolePage";
import { PlayersPage } from "@/features/players/PlayersPage";
import { ServerConnectionFooter } from "./ServerConnectionFooter";
import { usePersistentNavigation } from "@/shared/layout/usePersistentNavigation";

type ServerWorkspacePage = "players" | "console";

export function ServerWorkspace() {
  const { t } = useTranslation("servers");
  const navigation = usePersistentNavigation<ServerWorkspacePage>("players");
  const { disconnect, profile, state } = useSession();
  const pages = [
    {
      value: "players",
      label: t("workspace.players"),
      icon: <IconUsers size={16} aria-hidden="true" />,
    },
    {
      value: "console",
      label: t("workspace.console"),
      icon: <IconTerminal2 size={16} aria-hidden="true" />,
    },
  ] satisfies Array<{
    icon: ReactNode;
    label: string;
    value: ServerWorkspacePage;
  }>;

  if (!profile || (state !== "connected" && state !== "disconnecting")) {
    return null;
  }

  async function handleDisconnect() {
    try {
      await disconnect();
    } catch (disconnectError) {
      notifications.show({
        color: "red",
        title: t("session.disconnectErrorTitle"),
        message: errorMessage(disconnectError),
      });
    }
  }

  return (
    <SectionNavigation
      activePage={navigation.activePage}
      items={pages}
      label={t("session.serverNavigationLabel")}
      onPageChange={navigation.changePage}
      sidebarWidth={208}
      footer={
        <ServerConnectionFooter
          profile={profile}
          state={state}
          onDisconnect={() => void handleDisconnect()}
        />
      }
    >
      <SectionNavigationPanel page="players">
        <PlayersPage />
      </SectionNavigationPanel>
      <SectionNavigationPanel page="console">
        {navigation.isVisited("console") ? <ConsolePage /> : null}
      </SectionNavigationPanel>
    </SectionNavigation>
  );
}
