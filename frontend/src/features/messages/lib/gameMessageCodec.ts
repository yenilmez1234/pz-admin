import {
  decodeGameMessageRgb,
  defaultGameMessageColor,
  encodeGameMessageColorToken,
  getGameMessageNamedColor,
} from "@/features/messages/lib/gameMessageColors";
import { createEmptyMessageDocument } from "@/features/messages/lib/messageDocument";
import type { GameBuild } from "@/features/game/types";
import type {
  MessageDocument,
  MessageParagraph,
  MessageSize,
  MessageText,
  MessageTextStyle,
} from "@/features/messages/types";

// Game format

export const defaultGameMessageSize: MessageSize = "medium";
const LINE_TOKEN = " <LINE> ";
const TOKEN_PATTERN = / ?<([^<>]+)> ?/g;
const FORBIDDEN_CHARACTER_PATTERN = /[<>"\0]/;
const ALL_FORBIDDEN_CHARACTERS_PATTERN = /[<>"\0]/g;
interface GameMessageFontMetrics {
  family: string;
  lineHeights: Record<MessageSize, string>;
  sizes: Record<MessageSize, string>;
  weight: number;
}

export const gameMessageFontMetrics: Record<GameBuild, GameMessageFontMetrics> = {
  "41": {
    family: "Corbel",
    lineHeights: { small: "0.95rem", medium: "1.25rem", large: "1.5rem" },
    sizes: { small: "0.8em", medium: "1em", large: "1.2em" },
    weight: 700,
  },
  "42": {
    family: '"Noto Sans"',
    lineHeights: { small: "0.82rem", medium: "1.25rem", large: "1.42rem" },
    sizes: { small: "0.66em", medium: "1em", large: "1.14em" },
    weight: 600,
  },
};

interface FormatState {
  color?: string;
  size?: MessageSize;
}

interface ResolvedFormat {
  color: string;
  size: MessageSize;
}

interface FormattingToken {
  pattern: RegExp;
  apply(match: RegExpMatchArray, state: FormatState, build: GameBuild): void;
}

const formattingTokens: FormattingToken[] = [
  {
    pattern: /^RGB:([\d.]+),([\d.]+),([\d.]+)$/,
    apply(match, state) {
      state.color = decodeGameMessageRgb(match[1], match[2], match[3]);
    },
  },
  {
    pattern: /^SIZE:(small|medium|large)$/,
    apply(match, state) {
      state.size = match[1] as MessageSize;
    },
  },
  {
    pattern: /^([A-Za-z_]+)$/,
    apply(match, state, build) {
      const color = getGameMessageNamedColor(build, match[1]);
      if (color) state.color = color;
    },
  },
];

// Public API

export function parseGameMessage(
  value: string,
  build: GameBuild,
): MessageDocument {
  if (!value) return createEmptyMessageDocument();

  const format: FormatState = {};
  const paragraphs: MessageParagraph[] = [createParagraph()];
  let textStart = 0;

  for (const tokenMatch of value.matchAll(TOKEN_PATTERN)) {
    appendText(
      currentParagraph(paragraphs),
      value.slice(textStart, tokenMatch.index),
      format,
      build,
    );
    applyToken(tokenMatch[1], paragraphs, format, build);
    textStart = tokenMatch.index + tokenMatch[0].length;
  }

  appendText(
    currentParagraph(paragraphs),
    value.slice(textStart),
    format,
    build,
  );
  return { type: "doc", content: paragraphs };
}

export function serializeGameMessage(
  document: MessageDocument,
  build: GameBuild,
): string {
  const format = createDefaultFormat();

  return document.content
    .map((paragraph) =>
      (paragraph.content ?? [])
        .map((text) => serializeText(text, format, build))
        .join(""),
    )
    .join(LINE_TOKEN);
}

export function containsForbiddenGameMessageCharacters(
  value: string,
): boolean {
  return FORBIDDEN_CHARACTER_PATTERN.test(value);
}

export function isGameMessageTextAllowed(value: string): boolean {
  return !containsForbiddenGameMessageCharacters(value);
}

export function sanitizeGameMessageText(value: string): string {
  return value.replace(ALL_FORBIDDEN_CHARACTERS_PATTERN, "");
}

// Parsing

function applyToken(
  token: string,
  paragraphs: MessageParagraph[],
  format: FormatState,
  build: GameBuild,
) {
  if (token === "LINE") {
    paragraphs.push(createParagraph());
    return;
  }

  for (const definition of formattingTokens) {
    const match = token.match(definition.pattern);
    if (!match) continue;
    definition.apply(match, format, build);
    return;
  }
}

function appendText(
  paragraph: MessageParagraph,
  text: string,
  format: FormatState,
  build: GameBuild,
) {
  if (!text) return;

  const style = formatToTextStyle(format, build);
  paragraph.content ??= [];
  paragraph.content.push({
    type: "text",
    text,
    ...(style ? { marks: [{ type: "textStyle", attrs: style }] } : {}),
  });
}

function createParagraph(): MessageParagraph {
  return { type: "paragraph" };
}

function currentParagraph(
  paragraphs: MessageParagraph[],
): MessageParagraph {
  return paragraphs[paragraphs.length - 1];
}

// Serialization

function serializeText(
  text: MessageText,
  current: ResolvedFormat,
  build: GameBuild,
): string {
  const next = resolveTextFormat(findTextStyle(text), build);
  const prefix = encodeFormatTransition(current, next, build);

  current.color = next.color;
  current.size = next.size;
  return prefix + sanitizeGameMessageText(text.text);
}

function encodeFormatTransition(
  current: ResolvedFormat,
  next: ResolvedFormat,
  build: GameBuild,
): string {
  const tokens: string[] = [];
  if (next.color !== current.color) {
    tokens.push(encodeGameMessageColorToken(next.color, build));
  }
  if (next.size !== current.size) {
    tokens.push(`<SIZE:${next.size}>`);
  }
  return tokens.length > 0 ? ` ${tokens.join(" ")} ` : "";
}

function findTextStyle(text: MessageText): MessageTextStyle | undefined {
  return text.marks?.find((mark) => mark.type === "textStyle")?.attrs;
}

// Format mapping

function createDefaultFormat(): ResolvedFormat {
  return { color: defaultGameMessageColor, size: defaultGameMessageSize };
}

function formatToTextStyle(
  format: FormatState,
  build: GameBuild,
): MessageTextStyle | undefined {
  if (!format.color && !format.size) return undefined;
  return {
    ...(format.color ? { color: format.color } : {}),
    ...(format.size
      ? { fontSize: gameMessageFontMetrics[build].sizes[format.size] }
      : {}),
  };
}

function resolveTextFormat(
  style: MessageTextStyle | undefined,
  build: GameBuild,
): ResolvedFormat {
  return {
    color: style?.color ?? defaultGameMessageColor,
    size: fontSizeToMessageSize(style?.fontSize, build),
  };
}

function fontSizeToMessageSize(
  fontSize: string | undefined,
  build: GameBuild,
): MessageSize {
  for (const [size, value] of Object.entries(
    gameMessageFontMetrics[build].sizes,
  )) {
    if (value === fontSize) return size as MessageSize;
  }
  return defaultGameMessageSize;
}
