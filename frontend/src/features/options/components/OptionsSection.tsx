import { Paper, Stack, Title } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useTranslation } from "react-i18next";
import type { OptionSectionEntry } from "../lib/catalog";
import { translationText } from "../lib/translations";
import type { OptionFormValues } from "../lib/values";
import type { OptionFormUpdates } from "../lib/formUpdates";
import { OptionField } from "./OptionField";

interface OptionsSectionProps {
  entry: OptionSectionEntry;
  form: UseFormReturnType<OptionFormValues>;
  showCategory: boolean;
  updates: OptionFormUpdates;
}

export function OptionsSection({
  entry,
  form,
  showCategory,
  updates,
}: OptionsSectionProps) {
  const { t } = useTranslation("options");
  const categories = t("categories", { returnObjects: true });
  const sections = t("sections", { returnObjects: true });

  return (
    <Stack gap="sm">
      <div>
        {showCategory ? (
          <Title order={2} size="h3" mb={2}>
            {translationText(categories, entry.category.id, entry.category.id)}
          </Title>
        ) : null}
        <Title order={3} size="h4">
          {translationText(sections, entry.section.id, entry.section.id)}
        </Title>
      </div>

      <Paper withBorder>
        {entry.section.options.map((definition) => (
          <OptionField
            key={definition.name}
            definition={definition}
            form={form}
            updates={updates}
          />
        ))}
      </Paper>
    </Stack>
  );
}
