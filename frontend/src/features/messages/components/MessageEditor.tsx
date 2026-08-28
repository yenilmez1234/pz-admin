import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { defaultGameMessageColor } from "@/features/messages/lib/gameMessageColors";
import { messageEditorExtensions } from "@/features/messages/lib/messageEditorConfig";
import {
  readStringAttribute,
  toMessageDocument,
} from "@/features/messages/lib/messageEditorAdapter";
import type { MessageDocument } from "@/features/messages/types";
import { MessageColorControl } from "./MessageColorControl";
import { MessageSizeControl } from "./MessageSizeControl";
import classes from "./MessageEditor.module.css";

interface MessageEditorProps {
  build: GameBuild;
  className?: string;
  initialDocument: MessageDocument;
  isTextAllowed?: (value: string) => boolean;
  maxHeight?: CSSProperties["maxHeight"];
  onChange: (document: MessageDocument) => void;
  sanitizePastedText?: (value: string) => string;
}

export function MessageEditor({
  build,
  className,
  initialDocument,
  isTextAllowed,
  maxHeight,
  onChange,
  sanitizePastedText,
}: MessageEditorProps) {
  const { t } = useTranslation("messages");
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: messageEditorExtensions,
    content: initialDocument,
    editorProps: {
      handleTextInput: (_view, _from, _to, text) =>
        isTextAllowed ? !isTextAllowed(text) : false,
      transformPastedText: (text) => sanitizePastedText?.(text) ?? text,
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(toMessageDocument(currentEditor.getJSON()));
    },
  });
  const attributes: unknown = editor?.getAttributes("textStyle");
  const caretColor =
    readStringAttribute(attributes, "color") ?? defaultGameMessageColor;

  return (
    <RichTextEditor
      className={className}
      classNames={{
        content: classes.content,
        root: classes.root,
        Typography: classes.typography,
      }}
      data-game-build={build}
      editor={editor}
      labels={{
        alignCenterControlLabel: t("editor.alignments.center"),
        alignLeftControlLabel: t("editor.alignments.left"),
        alignRightControlLabel: t("editor.alignments.right"),
      }}
      styles={{
        content: {
          caretColor,
          color: defaultGameMessageColor,
          maxHeight,
          minHeight: "14rem",
          overflowY: "auto",
        },
      }}
    >
      <RichTextEditor.Toolbar sticky>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.ClearFormatting />
        </RichTextEditor.ControlsGroup>

        <MessageColorControl />
        <MessageSizeControl build={build} />

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
