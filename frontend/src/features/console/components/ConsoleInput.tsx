import { Box, Combobox, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useConsoleInput } from "@/features/console/useConsoleInput";
import { ConsoleSuggestionList } from "./ConsoleSuggestionList";
import classes from "./ConsolePage.module.css";

interface ConsoleInputProps {
  executing: boolean;
  onExecute: (command: string) => void;
}

export function ConsoleInput({ executing, onExecute }: ConsoleInputProps) {
  const { t } = useTranslation("servers");
  const input = useConsoleInput({ executing, onExecute });

  return (
    <Combobox
      store={input.combobox}
      position="top-start"
      offset={2}
      width="max-content"
      dropdownPadding={0}
      onOptionSubmit={input.applyCompletion}
    >
      <Box
        component="form"
        className={classes.inputRow}
        onSubmit={(event) => {
          event.preventDefault();
          input.submit();
        }}
      >
        <Text className={classes.inputPrompt} aria-hidden="true">
          $
        </Text>
        <span className={classes.caretMirror} aria-hidden="true">
          {input.command.slice(0, input.caretAnchorPosition)}
          <Combobox.DropdownTarget>
            <span className={classes.caretAnchor} />
          </Combobox.DropdownTarget>
        </span>
        <Combobox.EventsTarget
          withKeyboardNavigation={input.combobox.dropdownOpened}
        >
          <input
            ref={input.inputRef}
            type="text"
            value={input.command}
            onChange={input.handleChange}
            onFocus={input.handleFocus}
            onSelect={input.handleSelection}
            onBlur={input.closeSuggestions}
            onKeyDown={input.handleKeyDown}
            placeholder={t("console.commandPlaceholder")}
            aria-label={t("console.commandLabel")}
            name="server-command"
            autoComplete="off"
            spellCheck={false}
            className={classes.inputControl}
          />
        </Combobox.EventsTarget>
      </Box>

      {input.showSuggestions ? (
        <ConsoleSuggestionList suggestions={input.suggestions} />
      ) : null}
    </Combobox>
  );
}
