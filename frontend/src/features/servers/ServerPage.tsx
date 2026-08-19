import { SimpleGrid, Skeleton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/PageContainer";
import { useSession } from "@/features/session/useSession";
import { ServerProfilesPage } from "./profiles/ServerProfilesPage";
import { ServerWorkspace } from "./workspace/ServerWorkspace";

export function ServerPage() {
  const { t } = useTranslation("session");
  const { profile, state } = useSession();

  if (state === "initializing") {
    return (
      <PageContainer
        contentWidth="standard"
        py="xl"
        aria-busy="true"
        aria-label={t("loadingLabel")}
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
