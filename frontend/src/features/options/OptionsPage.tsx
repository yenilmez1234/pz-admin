import { Activity, useLayoutEffect, useRef, useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/features/session/SessionProvider";
import { PageContainer } from "@/shared/layout/PageContainer";
import { errorMessage } from "@/shared/lib/errors";
import { isGameBuild } from "@/features/game/types";
import { optionCatalogs } from "./catalog";
import { OptionsNavigation } from "./components/OptionsNavigation";
import { OptionsSection } from "./components/OptionsSection";
import { OptionsActions } from "./components/OptionsActions";
import { useOptionsEditor } from "./hooks/useOptionsEditor";
import { useOptionsSearch } from "./hooks/useOptionsSearch";
import classes from "./OptionsPage.module.css";

export function OptionsPage() {
  const { t } = useTranslation("options");
  const { profile } = useSession();
  const build =
    profile && isGameBuild(profile.version) ? profile.version : "42";
  const editor = useOptionsEditor(optionCatalogs[build]);
  const search = useOptionsSearch(editor.categories);
  const [requestedCategory, setRequestedCategory] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeCategory =
    editor.categories.find((category) => category.id === requestedCategory) ??
    editor.categories[0];
  const searchCategories = search.results ?? [];
  const hasSearchResults = searchCategories.some(
    (category) => category.sections.length > 0,
  );

  useLayoutEffect(() => {
    // Category content replaces the current list; retaining its scroll offset
    // would open the next category at an arbitrary position.
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [activeCategory?.id]);

  async function handleSave() {
    try {
      const outcome = await editor.save();
      if (!outcome) return;
      const { result } = outcome;

      const failedCount = Object.keys(result.failed).length;
      if (failedCount === 0) {
        notifications.show({
          color: "green",
          title: t("notifications.updatedTitle"),
          message: t("notifications.updatedMessage", {
            count: result.updated.length,
          }),
        });
      } else if (result.updated.length > 0) {
        notifications.show({
          color: "yellow",
          title: t("notifications.partiallyUpdatedTitle"),
          message: t("notifications.partiallyUpdatedMessage", {
            failed: failedCount,
            updated: result.updated.length,
          }),
        });
      } else {
        notifications.show({
          color: "red",
          title: t("notifications.updateFailedTitle"),
          message: t("notifications.updateFailedMessage", {
            count: failedCount,
          }),
        });
      }
      if (!outcome.refreshed) {
        notifications.show({
          color: "yellow",
          title: t("notifications.refreshFailedTitle"),
          message: t("notifications.refreshFailedMessage"),
        });
      }
    } catch (saveError) {
      notifications.show({
        color: "red",
        title: t("notifications.updateFailedTitle"),
        message: errorMessage(saveError),
      });
    }
  }

  if (editor.loading) {
    return (
      <Stack p="xl" gap="lg" aria-busy="true">
        <Skeleton height={34} width="35%" />
        <Skeleton height={76} />
        <Skeleton height={76} />
        <Skeleton height={76} />
      </Stack>
    );
  }

  if (editor.loadError) {
    return (
      <Box p="xl">
        <Alert
          color="red"
          icon={<IconAlertCircle size={18} aria-hidden="true" />}
          title={t("errors.loadTitle")}
        >
          <Stack gap="sm">
            <Text size="sm">{errorMessage(editor.loadError)}</Text>
            <Button
              variant="light"
              size="xs"
              w="fit-content"
              onClick={() => void editor.load()}
            >
              {t("actions.retry")}
            </Button>
          </Stack>
        </Alert>
      </Box>
    );
  }

  if (editor.categories.length === 0) {
    return (
      <Stack h="100%" align="center" justify="center" p="xl">
        <Text fw={600}>{t("empty.title")}</Text>
        <Text c="dimmed" size="sm" ta="center">
          {t("empty.message")}
        </Text>
      </Stack>
    );
  }

  return (
    <PageContainer contentWidth="wide" h="100%" px={0}>
      <form
        className={classes.root}
        aria-busy={editor.saving}
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <OptionsNavigation
          activeCategory={activeCategory?.id ?? ""}
          categories={editor.categories}
          onCategoryChange={setRequestedCategory}
          onQueryChange={search.changeQuery}
          query={search.query}
          searching={search.searching}
        />

        <div className={classes.content}>
          <div ref={scrollerRef} className={classes.scroller}>
            {search.results ? (
              hasSearchResults ? (
                <Stack gap="xl">
                  {searchCategories.map((category) =>
                    category.sections.map((section, index) => (
                      <OptionsSection
                        build={build}
                        key={`${category.id}:${section.id}`}
                        category={category}
                        form={editor.form}
                        highlight={search.term}
                        section={section}
                        showCategory={index === 0}
                      />
                    )),
                  )}
                </Stack>
              ) : (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                  {t("navigation.noResults")}
                </Text>
              )
            ) : (
              <Stack gap="xl">
                {editor.categories.map((category) => (
                  <Activity
                    key={category.id}
                    mode={
                      category.id === activeCategory?.id ? "visible" : "hidden"
                    }
                  >
                    <Stack gap="xl">
                      {category.sections.map((section, index) => (
                        <OptionsSection
                          build={build}
                          key={section.id}
                          category={category}
                          form={editor.form}
                          section={section}
                          showCategory={index === 0}
                        />
                      ))}
                    </Stack>
                  </Activity>
                ))}
              </Stack>
            )}
          </div>
          <div className={classes.actions}>
            <OptionsActions
              definitions={editor.definitions}
              form={editor.form}
              onReset={() => editor.reset()}
              saving={editor.saving}
            />
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
