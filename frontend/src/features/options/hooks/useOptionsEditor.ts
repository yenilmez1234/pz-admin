import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@mantine/form";
import { List, Update } from "@bindings/internal/options/service";
import type { UpdateResult } from "@bindings/internal/options/models";
import type { OptionCategory, OptionDefinition } from "../catalog";
import {
  availableOptionCategories,
  flattenOptionDefinitions,
} from "../lib/catalogQueries";
import {
  optionValues,
  serializeOptionValue,
  type OptionFormValues,
} from "../lib/optionValues";
import { validateOptionValues } from "../lib/validation";
import { createOptionFormEvents } from "./useOptionFormEvents";

interface SaveOutcome {
  refreshed: boolean;
  result: UpdateResult;
}

function readCatalog(
  catalog: readonly OptionCategory[],
  rawValues: Record<string, string | undefined>,
) {
  const categories = availableOptionCategories(catalog, rawValues);
  const definitions = flattenOptionDefinitions(categories);
  return {
    categories,
    definitions,
    values: optionValues(definitions, rawValues),
  };
}

function changedValues(
  definitions: readonly OptionDefinition[],
  values: OptionFormValues,
  isDirty: (name: string) => boolean,
) {
  const changes: Record<string, string> = {};
  for (const definition of definitions) {
    if (isDirty(definition.name)) {
      changes[definition.name] = serializeOptionValue(values[definition.name]);
    }
  }
  return changes;
}

export function useOptionsEditor(catalog: readonly OptionCategory[]) {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events] = useState(createOptionFormEvents);
  const definitions = useMemo(
    () => flattenOptionDefinitions(categories),
    [categories],
  );
  const form = useForm<OptionFormValues>({
    // Over a hundred controlled inputs made typing noticeably block the UI.
    mode: "uncontrolled",
    initialValues: {},
  });
  const { clearErrors, resetDirty, setInitialValues, setValues } = form;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rawValues = await List();
      const loaded = readCatalog(catalog, rawValues);
      setCategories(loaded.categories);
      setInitialValues(loaded.values);
      setValues(loaded.values);
      resetDirty(loaded.values);
      clearErrors();
      events.notify();
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [catalog, clearErrors, events, resetDirty, setInitialValues, setValues]);

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
    const values = form.getValues();
    const changes = changedValues(definitions, values, form.isDirty);
    if (Object.keys(changes).length === 0) return null;

    setSaving(true);
    form.clearErrors();
    try {
      const result = await Update(changes);
      let refreshed = false;
      try {
        const rawValues = await List();
        const loaded = readCatalog(catalog, rawValues);
        const displayedValues = { ...loaded.values };

        // Successful changes adopt the server value. Failed changes stay in
        // the form so the user can correct and retry them.
        for (const name of Object.keys(result.failed)) {
          displayedValues[name] = values[name];
        }
        setCategories(loaded.categories);
        form.setInitialValues(loaded.values);
        form.setValues(displayedValues);
        form.resetDirty(loaded.values);
        events.notify();
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
      events.notify();
    },
    save,
    saving,
    events,
  };
}
