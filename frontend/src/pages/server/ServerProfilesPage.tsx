import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { IconAlertCircle, IconPlus, IconServer } from "@tabler/icons-react";
import type { Profile } from "@bindings/internal/profile/models";
import { Delete, List, Save } from "@bindings/internal/profile/service";
import { DeleteServerModal } from "@/components/server/DeleteServerModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { ServerCard } from "@/components/server/ServerCard";
import { ServerFormModal } from "@/components/server/ServerFormModal";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { useSession } from "@/providers/SessionProvider";
import { errorMessage } from "@/utils/errors";

interface PageError {
  message: string;
  title: string;
}

interface DialogState {
  opened: boolean;
  profile: Profile | null;
}

const closedDialog: DialogState = { opened: false, profile: null };

let profileListRequest: ReturnType<typeof List> | null = null;

function listProfiles() {
  if (profileListRequest) return profileListRequest;

  const request = List();
  profileListRequest = request;
  const clearRequest = () => {
    if (profileListRequest === request) profileListRequest = null;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}

export function ServerProfilesPage() {
  const { t } = useTranslation(["servers", "common"]);
  const { config } = useAppConfig();
  const {
    connect,
    initializationError,
    profile: sessionProfile,
    retryInitialization,
    state: sessionState,
  } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<PageError | null>(null);
  const [formDialog, setFormDialog] = useState(closedDialog);
  const [deleteDialog, setDeleteDialog] = useState(closedDialog);
  const sortedProfiles = [...profiles].sort((a, b) =>
    a.name.localeCompare(b.name, config?.language),
  );
  const connecting = sessionState === "connecting";

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setProfiles(await listProfiles());
    } catch (loadError) {
      setPageError({
        title: t("profiles.errors.loadTitle"),
        message: errorMessage(loadError),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  function openFormDialog(profile: Profile | null) {
    setFormDialog({ opened: true, profile });
  }

  function closeFormDialog() {
    setFormDialog((current) => ({ ...current, opened: false }));
  }

  function openDeleteDialog(profile: Profile) {
    setDeleteDialog({ opened: true, profile });
  }

  function closeDeleteDialog() {
    setDeleteDialog((current) => ({ ...current, opened: false }));
  }

  async function handleSave(profile: Profile, password: string) {
    setPageError(null);
    // Let save errors reach the form modal so it can stay open and show them.
    const savedProfile = await Save(profile, password);
    setProfiles((current) => {
      const index = current.findIndex((item) => item.id === savedProfile.id);
      if (index === -1) return [...current, savedProfile];

      const next = [...current];
      next[index] = savedProfile;
      return next;
    });
  }

  async function handleDelete(profile: Profile) {
    setPageError(null);
    // Let delete errors reach the delete dialog for consistency.
    await Delete(profile.id);
    setProfiles((current) => current.filter((item) => item.id !== profile.id));
  }

  async function handleConnect(profile: Profile) {
    try {
      await connect(profile);
    } catch (connectionError) {
      notifications.show({
        color: "red",
        title: t("profiles.errors.connectTitle"),
        message: `${errorMessage(connectionError)} ${t("profiles.errors.connectDetailsSuffix")}`,
      });
    }
  }

  return (
    <>
      <PageContainer contentWidth="standard" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Title order={1}>{t("profiles.title")}</Title>
            {!loading && profiles.length > 0 && (
              <Button
                leftSection={<IconPlus size={16} aria-hidden="true" />}
                disabled={connecting}
                onClick={() => openFormDialog(null)}
              >
                {t("profiles.addButton")}
              </Button>
            )}
          </Group>

          {initializationError ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={t("profiles.errors.connectionCheckTitle")}
              aria-live="polite"
            >
              <Stack gap="xs" align="flex-start">
                <Text size="sm">{initializationError}</Text>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => void retryInitialization()}
                >
                  {t("actions.retry", { ns: "common" })}
                </Button>
              </Stack>
            </Alert>
          ) : null}

          {pageError ? (
            <Alert
              color="red"
              icon={<IconAlertCircle size={20} aria-hidden="true" />}
              title={pageError.title}
              aria-live="polite"
              withCloseButton={profiles.length > 0}
              closeButtonLabel={t("profiles.errors.dismissLabel")}
              onClose={() => setPageError(null)}
            >
              <Stack gap="xs" align="flex-start">
                <Text size="sm">{pageError.message}</Text>
                {profiles.length === 0 && (
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => void loadProfiles()}
                  >
                    {t("actions.retry", { ns: "common" })}
                  </Button>
                )}
              </Stack>
            </Alert>
          ) : null}

          {loading ? (
            <SimpleGrid
              minColWidth={260}
              aria-busy="true"
              aria-label={t("profiles.loadingLabel")}
            >
              <Skeleton height={112} />
              <Skeleton height={112} />
              <Skeleton height={112} />
            </SimpleGrid>
          ) : pageError && profiles.length === 0 ? null : profiles.length ===
            0 ? (
            <Paper withBorder p="xl">
              <Stack align="center" ta="center" py="xl">
                <IconServer
                  size={40}
                  stroke={1.5}
                  color="var(--mantine-color-dimmed)"
                  aria-hidden="true"
                />
                <Box>
                  <Title order={2} size="h3">
                    {t("profiles.emptyTitle")}
                  </Title>
                  <Text c="dimmed" mt={4}>
                    {t("profiles.emptyDescription")}
                  </Text>
                </Box>
                <Button
                  leftSection={<IconPlus size={16} aria-hidden="true" />}
                  disabled={connecting}
                  onClick={() => openFormDialog(null)}
                >
                  {t("profiles.addButton")}
                </Button>
              </Stack>
            </Paper>
          ) : (
            <SimpleGrid minColWidth={260}>
              {sortedProfiles.map((profile) => (
                <ServerCard
                  key={profile.id}
                  connecting={connecting && sessionProfile?.id === profile.id}
                  disabled={connecting}
                  onConnect={(selectedProfile) =>
                    void handleConnect(selectedProfile)
                  }
                  profile={profile}
                  onDelete={openDeleteDialog}
                  onEdit={openFormDialog}
                />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </PageContainer>

      <ServerFormModal
        opened={formDialog.opened}
        onClose={closeFormDialog}
        onSave={handleSave}
        profile={formDialog.profile}
      />

      <DeleteServerModal
        opened={deleteDialog.opened}
        onClose={closeDeleteDialog}
        onDelete={handleDelete}
        profile={deleteDialog.profile}
      />
    </>
  );
}
