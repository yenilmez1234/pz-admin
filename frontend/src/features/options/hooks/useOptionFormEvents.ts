import { startTransition, useEffect, useState } from "react";

type Listener = () => void;

/**
 * Mantine keeps this large form in refs to avoid rerendering every field on
 * each keystroke. These events refresh only the footer and fields with derived
 * UI, such as requirements or special-value controls.
 */
export interface OptionFormEvents {
  notify(name?: string): void;
  subscribe(listener: Listener, names?: readonly string[]): () => void;
}

export function createOptionFormEvents(): OptionFormEvents {
  const allFields = new Set<Listener>();
  const namedFields = new Map<string, Set<Listener>>();
  return {
    notify(name) {
      allFields.forEach((listener) => listener());
      if (name) namedFields.get(name)?.forEach((listener) => listener());
      else
        namedFields.forEach((entries) =>
          entries.forEach((listener) => listener()),
        );
    },
    subscribe(listener, names) {
      if (!names) {
        allFields.add(listener);
        return () => allFields.delete(listener);
      }
      names.forEach((name) => {
        const entries = namedFields.get(name) ?? new Set<Listener>();
        entries.add(listener);
        namedFields.set(name, entries);
      });
      return () => {
        names.forEach((name) => {
          const entries = namedFields.get(name);
          entries?.delete(listener);
          if (entries?.size === 0) namedFields.delete(name);
        });
      };
    },
  };
}

export function useFormSummaryUpdates(events: OptionFormEvents) {
  const [, setVersion] = useState(0);

  useEffect(
    () =>
      events.subscribe(() => {
        startTransition(() => setVersion((current) => current + 1));
      }),
    [events],
  );
}

export function useOptionValueUpdates(
  events: OptionFormEvents,
  names: readonly string[],
) {
  const [, setVersion] = useState(0);

  useEffect(
    () =>
      events.subscribe(() => {
        setVersion((current) => current + 1);
      }, names),
    [events, names],
  );
}
