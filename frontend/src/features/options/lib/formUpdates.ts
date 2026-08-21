import { startTransition, useEffect, useState } from "react";

type Listener = () => void;

// Mantine stores uncontrolled values in refs. This small notifier updates only
// the footer and fields whose requirement hints depend on a changed option.
export interface OptionFormUpdates {
  notify(name?: string): void;
  subscribe(listener: Listener): () => void;
  subscribeTo(names: readonly string[], listener: Listener): () => void;
}

export function createOptionFormUpdates(): OptionFormUpdates {
  const listeners = new Set<Listener>();
  const fieldListeners = new Map<string, Set<Listener>>();
  return {
    notify(name) {
      listeners.forEach((listener) => listener());
      if (name) fieldListeners.get(name)?.forEach((listener) => listener());
      else
        fieldListeners.forEach((entries) =>
          entries.forEach((listener) => listener()),
        );
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeTo(names, listener) {
      names.forEach((name) => {
        const entries = fieldListeners.get(name) ?? new Set<Listener>();
        entries.add(listener);
        fieldListeners.set(name, entries);
      });
      return () => {
        names.forEach((name) => {
          const entries = fieldListeners.get(name);
          entries?.delete(listener);
          if (entries?.size === 0) fieldListeners.delete(name);
        });
      };
    },
  };
}

export function useOptionFormUpdates(updates: OptionFormUpdates) {
  const [, setVersion] = useState(0);

  useEffect(
    () =>
      updates.subscribe(() => {
        startTransition(() => setVersion((current) => current + 1));
      }),
    [updates],
  );
}

export function useOptionDependencies(
  updates: OptionFormUpdates,
  names: readonly string[],
) {
  const [, setVersion] = useState(0);

  useEffect(
    () =>
      updates.subscribeTo(names, () => {
        setVersion((current) => current + 1);
      }),
    [names, updates],
  );
}
