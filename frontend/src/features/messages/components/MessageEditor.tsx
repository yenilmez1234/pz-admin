import { Button, Group, Text, Textarea } from "@mantine/core";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  defaultMessageColor,
  MessageLineColorControl,
} from "@/features/messages/components/MessageLineColorControl";
import { useMessageEditor } from "@/features/messages/hooks/useMessageEditor";
import { createEmptyMessage } from "@/features/messages/lib/messageDocument";
import type { MessageDocument } from "@/features/messages/types";
import classes from "./MessageEditor.module.css";

interface MessageEditorProps {
  document: MessageDocument;
  onChange: (document: MessageDocument) => void;
}

export function MessageEditor({ document, onChange }: MessageEditorProps) {
  const { t } = useTranslation("messages");
  const labelId = useId();
  const editor = useMessageEditor(document, onChange);
  const isEmpty =
    document.lines.length === 1 &&
    document.lines[0].text === "" &&
    document.lines[0].color === null;

  return (
    <div className={classes.root}>
      <Group justify="space-between">
        <Text fw={500} id={labelId} size="sm">
          {t("editor.label")}
        </Text>
        <Button
          color="gray"
          disabled={isEmpty}
          onClick={() => onChange(createEmptyMessage())}
          size="compact-xs"
          variant="subtle"
        >
          {t("actions.clear")}
        </Button>
      </Group>
      <fieldset aria-labelledby={labelId} className={classes.editor}>
        {document.lines.map((line, lineIndex) => (
          <div className={classes.line} key={line.id}>
            <MessageLineColorControl
              color={line.color}
              lineNumber={lineIndex + 1}
              onChange={(color) => editor.setLineColor(lineIndex, color)}
            />
            <Textarea
              aria-label={t("editor.lineLabel", { line: lineIndex + 1 })}
              autoComplete="off"
              autosize
              classNames={{ input: classes.lineInput }}
              minRows={1}
              name={`message-line-${lineIndex + 1}`}
              onChange={(event) => editor.handleLineChange(lineIndex, event)}
              onKeyDown={(event) => editor.handleLineKeyDown(lineIndex, event)}
              onPointerDown={editor.resetVerticalCaret}
              placeholder={
                document.lines.length === 1
                  ? t("editor.placeholder")
                  : undefined
              }
              ref={(input) => editor.registerInput(line.id, input)}
              spellCheck
              styles={{ input: { color: line.color ?? defaultMessageColor } }}
              value={line.text}
              variant="unstyled"
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}
