import { SimpleGrid, Skeleton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout/PageContainer";
import { useSession } from "@/providers/SessionProvider";
import { ServerProfilesPage } from "./server/ServerProfilesPage";
import { ServerWorkspace } from "./server/ServerWorkspace";

export function ServerPage() {
  const { t } = useTranslation("servers");
  const { profile, state } = useSession();

  if (state === "initializing") {
    return (
      <PageContainer
        contentWidth="standard"
        py="xl"
        aria-busy="true"
        aria-label={t("session.loadingLabel")}
      >
        <SimpleGrid minColWidth={260}>
          <Skeleton height={112} />
          <Skeleton height={112} />
          <Skeleton height={112} />
        </SimpleGrid>
      </PageContainer>
    );
  }

  if (profile && (state === "connected" || state === "disconnecting")) {
    return <ServerWorkspace />;
  }

  return <ServerProfilesPage />;
}
