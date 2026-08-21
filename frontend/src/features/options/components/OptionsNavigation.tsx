import { useDeferredValue, useEffect, useState } from "react";
import { CloseButton, Text, TextInput, UnstyledButton } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OptionCategory } from "../catalog";
import { translationText } from "../lib/translations";
import classes from "./OptionsNavigation.module.css";

interface OptionsNavigationProps {
  activeCategory: string;
  categories: readonly OptionCategory[];
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  searching: boolean;
}

export function OptionsNavigation({
  activeCategory,
  categories,
  onCategoryChange,
  onSearchChange,
  searching,
}: OptionsNavigationProps) {
  const { t } = useTranslation("options");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const categoryTranslations = t("categories", { returnObjects: true });

  useEffect(() => {
    onSearchChange(deferredQuery);
  }, [deferredQuery, onSearchChange]);

  return (
    <div className={classes.root}>
      <nav aria-label={t("navigation.label")} className={classes.categories}>
        {categories.map((category) => (
          <UnstyledButton
            aria-current={
              !searching && category.id === activeCategory ? "page" : undefined
            }
            key={category.id}
            className={classes.section}
            data-active={
              !searching && category.id === activeCategory ? true : undefined
            }
            onClick={() => {
              setQuery("");
              onCategoryChange(category.id);
            }}
          >
            <span>
              {translationText(categoryTranslations, category.id, category.id)}
            </span>
            <Text component="span" className={classes.count}>
              {category.sections.reduce(
                (count, section) => count + section.options.length,
                0,
              )}
            </Text>
          </UnstyledButton>
        ))}
      </nav>

      <TextInput
        aria-label={t("navigation.searchLabel")}
        className={classes.search}
        leftSection={<IconSearch size={15} aria-hidden="true" />}
        placeholder={t("navigation.searchPlaceholder")}
        rightSection={
          query ? (
            <CloseButton
              aria-label={t("navigation.clearSearch")}
              size="sm"
              onClick={() => setQuery("")}
            />
          ) : null
        }
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
    </div>
  );
}
