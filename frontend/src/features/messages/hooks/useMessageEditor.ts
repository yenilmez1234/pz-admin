import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  closestCaretPosition,
  measureCaretX,
} from "@/features/messages/lib/caretPosition";
import { createMessageLine } from "@/features/messages/lib/messageDocument";
import type { MessageDocument } from "@/features/messages/types";

export function useMessageEditor(
  document: MessageDocument,
  onChange: (document: MessageDocument) => void,
) {
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<{ id: string; position: number } | null>(null);
  const preferredCaretX = useRef<number | null>(null);

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;

    const input = inputs.current.get(target.id);
    if (!input) return;

    input.focus();
    input.setSelectionRange(target.position, target.position);
    pendingFocus.current = null;
  }, [document]);

  function registerInput(id: string, input: HTMLTextAreaElement | null) {
    if (input) inputs.current.set(id, input);
    else inputs.current.delete(id);
  }

  function handleLineChange(
    lineIndex: number,
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    resetVerticalCaret();
    const value = event.currentTarget.value.replace(/\r\n?/g, "\n");
    const texts = value.split("\n");

    if (texts.length === 1) {
      replaceLine(lineIndex, { text: value });
      return;
    }

    const currentLine = document.lines[lineIndex];
    const caretPrefix = value.slice(0, event.currentTarget.selectionStart);
    const focusOffset = caretPrefix.split("\n").length - 1;
    const replacement = [
      { ...currentLine, text: texts[0] },
      ...texts
        .slice(1)
        .map((text) => createMessageLine(text, currentLine.color)),
    ];

    pendingFocus.current = {
      id: replacement[focusOffset].id,
      position: caretPrefix.slice(caretPrefix.lastIndexOf("\n") + 1).length,
    };

    const lines = [...document.lines];
    lines.splice(lineIndex, 1, ...replacement);
    onChange({ lines });
  }

  function handleLineKeyDown(
    lineIndex: number,
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    const input = event.currentTarget;
    const hasSelection = input.selectionStart !== input.selectionEnd;
    const hasModifier =
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    const isVerticalArrow =
      event.key === "ArrowUp" || event.key === "ArrowDown";

    if (!isVerticalArrow || hasSelection || hasModifier) resetVerticalCaret();

    if (!hasSelection && !hasModifier && event.key === "ArrowUp") {
      if (lineIndex > 0) {
        event.preventDefault();
        focusLineAtPreferredX(lineIndex - 1, input);
      }
      return;
    }

    if (!hasSelection && !hasModifier && event.key === "ArrowDown") {
      if (lineIndex < document.lines.length - 1) {
        event.preventDefault();
        focusLineAtPreferredX(lineIndex + 1, input);
      }
      return;
    }

    if (
      event.key === "Backspace" &&
      !hasSelection &&
      input.selectionStart === 0 &&
      lineIndex > 0
    ) {
      event.preventDefault();
      joinWithPreviousLine(lineIndex);
      return;
    }

    if (
      event.key === "Delete" &&
      !hasSelection &&
      input.selectionStart === input.value.length &&
      lineIndex < document.lines.length - 1
    ) {
      event.preventDefault();
      joinWithNextLine(lineIndex);
    }
  }

  function setLineColor(lineIndex: number, color: string | null) {
    replaceLine(lineIndex, { color });
  }

  function resetVerticalCaret() {
    preferredCaretX.current = null;
  }

  function focusLineAtPreferredX(
    lineIndex: number,
    currentInput: HTMLTextAreaElement,
  ) {
    const line = document.lines[lineIndex];
    const input = inputs.current.get(line.id);
    if (!input) return;

    preferredCaretX.current ??= measureCaretX(
      currentInput,
      currentInput.selectionStart,
    );
    const nextPosition = closestCaretPosition(input, preferredCaretX.current);
    input.focus();
    input.setSelectionRange(nextPosition, nextPosition);
  }

  function replaceLine(
    lineIndex: number,
    changes: Partial<(typeof document.lines)[number]>,
  ) {
    const lines = [...document.lines];
    lines[lineIndex] = { ...lines[lineIndex], ...changes };
    onChange({ lines });
  }

  function joinWithPreviousLine(lineIndex: number) {
    const previous = document.lines[lineIndex - 1];
    const current = document.lines[lineIndex];
    const lines = [...document.lines];
    lines.splice(lineIndex - 1, 2, {
      ...previous,
      text: previous.text + current.text,
    });
    pendingFocus.current = { id: previous.id, position: previous.text.length };
    onChange({ lines });
  }

  function joinWithNextLine(lineIndex: number) {
    const current = document.lines[lineIndex];
    const next = document.lines[lineIndex + 1];
    const lines = [...document.lines];
    lines.splice(lineIndex, 2, {
      ...current,
      text: current.text + next.text,
    });
    pendingFocus.current = { id: current.id, position: current.text.length };
    onChange({ lines });
  }

  return {
    handleLineChange,
    handleLineKeyDown,
    registerInput,
    resetVerticalCaret,
    setLineColor,
  };
}
