import { useState, type ReactNode } from "react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { IconTerminal2, IconUsers } from "@tabler/icons-react";
import {
  SectionNavigation,
  SectionNavigationPanel,
} from "@/components/layout/SectionNavigation";
import { ServerConnectionFooter } from "@/components/server/ServerConnectionFooter";
import { useSession } from "@/providers/SessionProvider";
import { errorMessage } from "@/utils/errors";
import { ConsolePage } from "./workspace/ConsolePage";
import { PlayersPage } from "./workspace/PlayersPage";

type ServerWorkspacePage = "players" | "console";

export function ServerWorkspace() {
  const { t } = useTranslation("servers");
  const [activePage, setActivePage] = useState<ServerWorkspacePage>("players");
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
      activePage={activePage}
      items={pages}
      label={t("session.serverNavigationLabel")}
      onPageChange={setActivePage}
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
        <ConsolePage />
      </SectionNavigationPanel>
    </SectionNavigation>
  );
}
