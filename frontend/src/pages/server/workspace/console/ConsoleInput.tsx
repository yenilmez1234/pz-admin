import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { Box, Combobox, Text, useCombobox } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  consoleCompletionSource,
  consoleSuggestions,
} from "@/features/console/catalog";
import { useCommandHistory } from "@/features/console/useCommandHistory";
import { useConsoleCompletions } from "@/features/console/useConsoleCompletions";
import { useSession } from "@/providers/SessionProvider";
import { ConsoleSuggestionList } from "./ConsoleSuggestionList";
import classes from "../ConsolePage.module.css";

interface ConsoleInputProps {
  executing: boolean;
  onExecute: (command: string) => void;
}

export function ConsoleInput({ executing, onExecute }: ConsoleInputProps) {
  const { t } = useTranslation("servers");
  const { profile } = useSession();
  const [command, setCommand] = useState("");
  const [caretPosition, setCaretPosition] = useState(0);
  const history = useCommandHistory();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const input = useRef<HTMLInputElement>(null);
  const pendingCaretPosition = useRef<number | null>(null);
  const suggestionsActive = useRef(false);
  const build =
    profile?.version === "41" || profile?.version === "42"
      ? profile.version
      : undefined;
  const completionSource = consoleCompletionSource(
    build,
    command,
    caretPosition,
  );
  const completionValues = useConsoleCompletions(build, completionSource);
  const suggestions = consoleSuggestions(
    build,
    command,
    completionValues,
    caretPosition,
  );
  const hasSuggestions = suggestions.matches.length > 0;
  const showSuggestions =
    hasSuggestions && (command.trim().length > 0 || combobox.dropdownOpened);

  useEffect(() => {
    if (
      hasSuggestions &&
      command.trim() &&
      suggestionsActive.current &&
      document.activeElement === input.current
    ) {
      combobox.openDropdown();
    }
  }, [combobox, command, hasSuggestions]);

  useEffect(() => {
    if (!combobox.dropdownOpened) return undefined;
    if (!showSuggestions) {
      combobox.closeDropdown();
      return undefined;
    }
    const frame = requestAnimationFrame(() => combobox.selectFirstOption());
    return () => cancelAnimationFrame(frame);
  }, [caretPosition, combobox, command, showSuggestions]);

  useLayoutEffect(() => {
    if (pendingCaretPosition.current === null) return;

    const position = pendingCaretPosition.current;
    pendingCaretPosition.current = null;
    input.current?.setSelectionRange(position, position);
  });

  function setBuffer(value: string, position = value.length) {
    setCommand(value);
    setCaretPosition(position);
    history.update(value);
  }

  function updateSuggestionVisibility(value: string, position: number) {
    const next = consoleSuggestions(build, value, completionValues, position);
    if (suggestionsActive.current && value.trim() && next.matches.length > 0) {
      combobox.openDropdown();
    } else {
      combobox.closeDropdown();
    }
  }

  function deactivateSuggestions() {
    suggestionsActive.current = false;
    combobox.closeDropdown();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    const position = event.currentTarget.selectionStart ?? value.length;
    suggestionsActive.current = true;
    setBuffer(value, position);
    updateSuggestionVisibility(value, position);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    const position = event.currentTarget.selectionStart ?? command.length;
    setCaretPosition(position);
    updateSuggestionVisibility(command, position);
  }

  function handleSelection(event: SyntheticEvent<HTMLInputElement>) {
    const position = event.currentTarget.selectionStart ?? command.length;
    setCaretPosition(position);
    updateSuggestionVisibility(command, position);
  }

  function navigateHistory(direction: -1 | 1) {
    const recalledCommand = history.navigate(direction);
    if (recalledCommand === null) return;

    deactivateSuggestions();
    setCommand(recalledCommand);
    setCaretPosition(recalledCommand.length);
  }

  function applyCompletion(value: string) {
    const before = command.slice(0, suggestions.replacementStart);
    const after = command.slice(suggestions.replacementEnd);
    const quote = suggestions.quote ?? (/\s/.test(value) ? '"' : "");
    const replacement = quote ? `${quote}${value}${quote}` : value;
    const separator = after.length === 0 && !value.endsWith("=") ? " " : "";
    const nextCommand = `${before}${replacement}${separator}${after}`;
    const nextPosition = before.length + replacement.length + separator.length;
    suggestionsActive.current = true;
    pendingCaretPosition.current = nextPosition;
    setBuffer(nextCommand, nextPosition);
    combobox.resetSelectedOption();
    updateSuggestionVisibility(nextCommand, nextPosition);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const onlySuggestion = suggestions.matches[0];
    if (
      event.key === "Enter" &&
      suggestions.matches.length === 1 &&
      onlySuggestion.toLocaleLowerCase() ===
        suggestions.query.toLocaleLowerCase()
    ) {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === "Escape" && combobox.dropdownOpened) {
      event.preventDefault();
      deactivateSuggestions();
      return;
    }

    if (event.key === "Tab") {
      if (suggestions.matches.length === 0) return;
      event.preventDefault();
      suggestionsActive.current = true;
      if (!combobox.dropdownOpened) {
        combobox.openDropdown("keyboard");
        return;
      }
      const selectedIndex = combobox.getSelectedOptionIndex();
      applyCompletion(
        suggestions.matches[selectedIndex === -1 ? 0 : selectedIndex],
      );
      return;
    }

    if (
      combobox.dropdownOpened &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    navigateHistory(event.key === "ArrowUp" ? -1 : 1);
  }

  function submit() {
    const nextCommand = command.trim();
    if (!nextCommand || executing) return;

    history.record(nextCommand);
    deactivateSuggestions();
    setCommand("");
    setCaretPosition(0);
    onExecute(nextCommand);
  }

  return (
    <Combobox
      store={combobox}
      position="top-start"
      offset={2}
      width="max-content"
      dropdownPadding={0}
      onOptionSubmit={applyCompletion}
    >
      <Box
        component="form"
        className={classes.inputRow}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Text className={classes.inputPrompt} aria-hidden="true">
          $
        </Text>
        <span className={classes.caretMirror} aria-hidden="true">
          {command.slice(0, suggestions.anchorPosition)}
          <Combobox.DropdownTarget>
            <span className={classes.caretAnchor} />
          </Combobox.DropdownTarget>
        </span>
        <Combobox.EventsTarget withKeyboardNavigation={combobox.dropdownOpened}>
          <input
            ref={input}
            type="text"
            value={command}
            onChange={handleChange}
            onFocus={handleFocus}
            onSelect={handleSelection}
            onBlur={deactivateSuggestions}
            onKeyDown={handleKeyDown}
            placeholder={t("console.commandPlaceholder")}
            aria-label={t("console.commandLabel")}
            name="server-command"
            autoComplete="off"
            spellCheck={false}
            className={classes.inputControl}
          />
        </Combobox.EventsTarget>
      </Box>

      {showSuggestions ? (
        <ConsoleSuggestionList suggestions={suggestions} />
      ) : null}
    </Combobox>
  );
}
