import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import type { CSSProperties } from "react";
import { defaultGameMessageColor } from "@/features/messages/lib/gameMessageCodec";
import { messageEditorExtensions } from "@/features/messages/lib/messageEditorConfig";
import type { MessageDocument } from "@/features/messages/types";
import { MessageColorControl } from "./MessageColorControl";
import classes from "./MessageEditor.module.css";

interface MessageEditorProps {
  initialDocument: MessageDocument;
  isTextAllowed?: (value: string) => boolean;
  maxHeight?: CSSProperties["maxHeight"];
  onChange: (document: MessageDocument) => void;
  sanitizePastedText?: (value: string) => string;
}

export function MessageEditor({
  initialDocument,
  isTextAllowed,
  maxHeight,
  onChange,
  sanitizePastedText,
}: MessageEditorProps) {
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
      onChange(currentEditor.getJSON() as MessageDocument);
    },
  });
  const caretColor =
    (editor?.getAttributes("textStyle").color as string | undefined) ??
    defaultGameMessageColor;

  return (
    <RichTextEditor
      classNames={{ content: classes.content, root: classes.root }}
      editor={editor}
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

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
