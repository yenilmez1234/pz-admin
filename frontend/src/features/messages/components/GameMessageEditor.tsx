import type { CSSProperties } from "react";
import {
  isGameMessageTextAllowed,
  parseGameMessage,
  sanitizeGameMessageText,
  serializeGameMessage,
} from "@/features/messages/lib/gameMessageCodec";
import { MessageEditor } from "./MessageEditor";

interface GameMessageEditorProps {
  maxHeight?: CSSProperties["maxHeight"];
  onChange: (value: string) => void;
  value: string;
}

export function GameMessageEditor({
  maxHeight,
  onChange,
  value,
}: GameMessageEditorProps) {
  return (
    <MessageEditor
      initialDocument={parseGameMessage(value)}
      isTextAllowed={isGameMessageTextAllowed}
      maxHeight={maxHeight}
      onChange={(document) => onChange(serializeGameMessage(document))}
      sanitizePastedText={sanitizeGameMessageText}
    />
  );
}
