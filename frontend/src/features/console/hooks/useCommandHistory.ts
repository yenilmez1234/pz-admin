import { useRef } from "react";

export function useCommandHistory() {
  const commands = useRef<string[]>([]);
  const edits = useRef(new Map<number, string>());
  const index = useRef(0);
  const draft = useRef("");

  function record(command: string) {
    commands.current.push(command);
    edits.current.clear();
    index.current = commands.current.length;
    draft.current = "";
  }

  function update(value: string) {
    if (index.current === commands.current.length) {
      draft.current = value;
    } else {
      edits.current.set(index.current, value);
    }
  }

  function navigate(direction: -1 | 1) {
    if (commands.current.length === 0) return null;

    index.current = Math.min(
      commands.current.length,
      Math.max(0, index.current + direction),
    );
    return index.current === commands.current.length
      ? draft.current
      : (edits.current.get(index.current) ?? commands.current[index.current]);
  }

  return { navigate, record, update };
}
