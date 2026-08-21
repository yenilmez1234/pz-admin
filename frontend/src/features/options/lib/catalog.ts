import type {
  OptionCategory,
  OptionDefinition,
  OptionSection,
} from "../catalog";

export interface OptionSectionEntry {
  category: OptionCategory;
  section: OptionSection;
}

export function flattenOptionDefinitions(
  categories: readonly OptionCategory[],
) {
  return categories.flatMap((category) =>
    category.sections.flatMap((section) => section.options),
  );
}

export function optionSections(
  categories: readonly OptionCategory[],
): OptionSectionEntry[] {
  return categories.flatMap((category) =>
    category.sections.map((section) => ({ category, section })),
  );
}

export function availableOptionCategories(
  categories: readonly OptionCategory[],
  values: Record<string, string | undefined>,
): OptionCategory[] {
  return categories.flatMap((category) => {
    const sections = category.sections.flatMap((section) => {
      const options = section.options.filter(
        (definition) => values[definition.name] !== undefined,
      );
      return options.length > 0 ? [{ ...section, options }] : [];
    });
    return sections.length > 0 ? [{ ...category, sections }] : [];
  });
}

export function unmetRequirements(
  definition: OptionDefinition,
  values: Record<string, unknown>,
) {
  return (definition.requirements ?? []).filter(
    (requirement) => values[requirement.option] !== requirement.equals,
  );
}
