import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@mantine/form";
import { List, Update } from "@bindings/internal/options/service";
import type { UpdateResult } from "@bindings/internal/options/models";
import type { OptionCategory } from "../catalog";
import {
  availableOptionCategories,
  flattenOptionDefinitions,
} from "../lib/catalog";
import {
  optionValues,
  serializeOptionValue,
  type OptionFormValues,
} from "../lib/values";
import { validateOptionValues } from "../lib/validation";
import { createOptionFormUpdates } from "../lib/formUpdates";

interface SaveOutcome {
  refreshed: boolean;
  result: UpdateResult;
}

export function useOptionsEditor(catalog: readonly OptionCategory[]) {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updates] = useState(createOptionFormUpdates);
  const definitions = useMemo(
    () => flattenOptionDefinitions(categories),
    [categories],
  );
  const form = useForm<OptionFormValues>({
    mode: "uncontrolled",
    initialValues: {},
  });
  const { clearErrors, resetDirty, setInitialValues, setValues } = form;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rawValues = await List();
      const nextCategories = availableOptionCategories(catalog, rawValues);
      const nextDefinitions = flattenOptionDefinitions(nextCategories);
      const values = optionValues(nextDefinitions, rawValues);
      setCategories(nextCategories);
      setInitialValues(values);
      setValues(values);
      resetDirty(values);
      clearErrors();
      updates.notify();
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [catalog, clearErrors, resetDirty, setInitialValues, setValues, updates]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<SaveOutcome | null> {
    if (
      Object.keys(validateOptionValues(definitions, form.getValues())).length >
      0
    ) {
      return null;
    }
    const changes: Record<string, string> = {};
    const values = form.getValues();
    for (const definition of definitions) {
      if (form.isDirty(definition.name)) {
        changes[definition.name] = serializeOptionValue(
          values[definition.name],
        );
      }
    }
    if (Object.keys(changes).length === 0) return null;

    setSaving(true);
    form.clearErrors();
    try {
      const result = await Update(changes);
      let refreshed = false;
      try {
        const rawValues = await List();
        const nextCategories = availableOptionCategories(catalog, rawValues);
        const nextDefinitions = flattenOptionDefinitions(nextCategories);
        const refreshedValues = optionValues(nextDefinitions, rawValues);
        const displayedValues = { ...refreshedValues };
        for (const name of Object.keys(result.failed)) {
          displayedValues[name] = values[name];
        }
        setCategories(nextCategories);
        form.setInitialValues(refreshedValues);
        form.setValues(displayedValues);
        form.resetDirty(refreshedValues);
        updates.notify();
        refreshed = true;
      } catch {
        // Keep local edits dirty when the authoritative state cannot be reloaded.
      }
      form.setErrors(result.failed);
      return { refreshed, result };
    } finally {
      setSaving(false);
    }
  }

  return {
    categories,
    definitions,
    form,
    load,
    loadError,
    loading,
    reset() {
      form.reset();
      updates.notify();
    },
    save,
    saving,
    updates,
  };
}
