import type { CSSProperties } from "react";
import type { GameBuild } from "@/features/game/types";
import {
  isGameMessageTextAllowed,
  parseGameMessage,
  sanitizeGameMessageText,
  serializeGameMessage,
} from "@/features/messages/lib/gameMessageCodec";
import { MessageEditor } from "./MessageEditor";

interface GameMessageEditorProps {
  build: GameBuild;
  className?: string;
  maxHeight?: CSSProperties["maxHeight"];
  onChange: (value: string) => void;
  value: string;
}

export function GameMessageEditor({
  build,
  className,
  maxHeight,
  onChange,
  value,
}: GameMessageEditorProps) {
  return (
    <MessageEditor
      build={build}
      className={className}
      initialDocument={parseGameMessage(value, build)}
      isTextAllowed={isGameMessageTextAllowed}
      maxHeight={maxHeight}
      onChange={(document) => onChange(serializeGameMessage(document, build))}
      sanitizePastedText={sanitizeGameMessageText}
    />
  );
}
