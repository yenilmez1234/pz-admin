import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { SearchResultsSentinel } from "./components/SearchResultsSentinel";
import { useOptionsEditor } from "./hooks/useOptionsEditor";
import { optionSections } from "./lib/catalog";
import { nestedTranslationText, translationText } from "./lib/translations";
import classes from "./OptionsPage.module.css";

const searchResultBatchSize = 20;

export function OptionsPage() {
  const { i18n, t } = useTranslation("options");
  const { profile } = useSession();
  const build =
    profile && isGameBuild(profile.version) ? profile.version : "41";
  const editor = useOptionsEditor(optionCatalogs[build]);
  const [requestedCategory, setRequestedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleSearchResults, setVisibleSearchResults] = useState(
    searchResultBatchSize,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const locale = i18n.resolvedLanguage;
  const activeCategory =
    editor.categories.find((category) => category.id === requestedCategory) ??
    editor.categories[0];
  const searchIndex = useMemo(() => {
    const normalize = (value: string) =>
      locale ? value.toLocaleLowerCase(locale) : value.toLocaleLowerCase();
    const categoryTranslations = t("categories", { returnObjects: true });
    const sectionTranslations = t("sections", { returnObjects: true });
    const fieldTranslations = t("fields", { returnObjects: true });
    return editor.categories.flatMap((category) => {
      const categoryText = translationText(
        categoryTranslations,
        category.id,
        category.id,
      );
      return category.sections.flatMap((section) => {
        const sectionText = translationText(
          sectionTranslations,
          section.id,
          section.id,
        );
        return section.options.map((definition) => {
          const label = nestedTranslationText(
            fieldTranslations,
            definition.name,
            "label",
            definition.name,
          );
          const description = nestedTranslationText(
            fieldTranslations,
            definition.name,
            "description",
            "",
          );
          return {
            definition,
            text: normalize(
              `${definition.name} ${categoryText} ${sectionText} ${label} ${description}`,
            ),
          };
        });
      });
    });
  }, [editor.categories, locale, t]);
  const searchResult = useMemo(() => {
    if (!searchQuery) return null;

    const query = locale
      ? searchQuery.toLocaleLowerCase(locale)
      : searchQuery.toLocaleLowerCase();
    const matches = searchIndex.filter((entry) => entry.text.includes(query));
    const visibleNames = new Set(
      matches
        .slice(0, visibleSearchResults)
        .map((entry) => entry.definition.name),
    );
    const categories = editor.categories.flatMap((category) => {
      const sections = category.sections.flatMap((section) => {
        const options = section.options.filter((definition) =>
          visibleNames.has(definition.name),
        );
        return options.length > 0 ? [{ ...section, options }] : [];
      });
      return sections.length > 0 ? [{ ...category, sections }] : [];
    });

    return { categories, total: matches.length };
  }, [
    editor.categories,
    locale,
    searchIndex,
    searchQuery,
    visibleSearchResults,
  ]);
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setVisibleSearchResults(searchResultBatchSize);
  }, []);
  const showMoreSearchResults = useCallback(() => {
    setVisibleSearchResults((current) => current + searchResultBatchSize);
  }, []);
  const visibleCategories = useMemo(
    () => searchResult?.categories ?? (activeCategory ? [activeCategory] : []),
    [activeCategory, searchResult],
  );
  const sections = useMemo(
    () => optionSections(visibleCategories),
    [visibleCategories],
  );

  useLayoutEffect(() => {
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
          onSearchChange={handleSearchChange}
          searching={Boolean(searchQuery)}
        />

        <div className={classes.content}>
          <div ref={scrollerRef} className={classes.scroller}>
            {sections.length > 0 ? (
              <Stack gap="xl">
                {sections.map((entry, index) => (
                  <OptionsSection
                    key={`${entry.category.id}:${entry.section.id}`}
                    entry={entry}
                    form={editor.form}
                    showCategory={
                      index === 0 ||
                      sections[index - 1]?.category.id !== entry.category.id
                    }
                    updates={editor.updates}
                  />
                ))}
                {searchResult && visibleSearchResults < searchResult.total ? (
                  <SearchResultsSentinel onVisible={showMoreSearchResults} />
                ) : null}
              </Stack>
            ) : (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                {t("navigation.noResults")}
              </Text>
            )}
          </div>
          <div className={classes.actions}>
            <OptionsActions
              definitions={editor.definitions}
              form={editor.form}
              onReset={() => editor.reset()}
              saving={editor.saving}
              updates={editor.updates}
            />
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
