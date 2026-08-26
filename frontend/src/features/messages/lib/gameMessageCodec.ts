import { createEmptyMessageDocument } from "@/features/messages/lib/messageDocument";
import type {
  MessageDocument,
  MessageParagraph,
  MessageSize,
  MessageText,
  MessageTextStyle,
} from "@/features/messages/types";

// Game format

export const defaultGameMessageColor = "#0080ff";

const DEFAULT_SIZE: MessageSize = "medium";
const LINE_TOKEN = "<LINE>";
const TOKEN_PATTERN = /<([^<>]+)>/g;
const FORBIDDEN_CHARACTER_PATTERN = /[<>"\0]/;
const ALL_FORBIDDEN_CHARACTERS_PATTERN = /[<>"\0]/g;
const HEX_CHANNEL_OFFSETS = [0, 2, 4] as const;

const fontSizes: Record<MessageSize, string> = {
  small: "0.75em",
  medium: "1em",
  large: "1.25em",
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
  apply(match: RegExpMatchArray, state: FormatState): void;
}

const formattingTokens: FormattingToken[] = [
  {
    pattern: /^RGB:([\d.]+),([\d.]+),([\d.]+)$/,
    apply(match, state) {
      state.color = gameRgbToHex(match[1], match[2], match[3]);
    },
  },
  {
    pattern: /^SIZE:(small|medium|large)$/,
    apply(match, state) {
      state.size = match[1] as MessageSize;
    },
  },
];

// Public API

export function parseGameMessage(value: string): MessageDocument {
  if (!value) return createEmptyMessageDocument();

  const format: FormatState = {};
  const paragraphs: MessageParagraph[] = [createParagraph()];
  let textStart = 0;

  for (const tokenMatch of value.matchAll(TOKEN_PATTERN)) {
    appendText(
      currentParagraph(paragraphs),
      value.slice(textStart, tokenMatch.index),
      format,
    );
    applyToken(tokenMatch[1], paragraphs, format);
    textStart = tokenMatch.index + tokenMatch[0].length;
  }

  appendText(currentParagraph(paragraphs), value.slice(textStart), format);
  return { type: "doc", content: paragraphs };
}

export function serializeGameMessage(document: MessageDocument): string {
  const format = createDefaultFormat();

  return document.content
    .map((paragraph) =>
      (paragraph.content ?? [])
        .map((text) => serializeText(text, format))
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
) {
  if (token === "LINE") {
    paragraphs.push(createParagraph());
    return;
  }

  for (const definition of formattingTokens) {
    const match = token.match(definition.pattern);
    if (!match) continue;
    definition.apply(match, format);
    return;
  }
}

function appendText(
  paragraph: MessageParagraph,
  text: string,
  format: FormatState,
) {
  if (!text) return;

  const style = formatToTextStyle(format);
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

function serializeText(text: MessageText, current: ResolvedFormat): string {
  const next = resolveTextFormat(findTextStyle(text));
  const prefix = encodeFormatTransition(current, next);

  current.color = next.color;
  current.size = next.size;
  return prefix + sanitizeGameMessageText(text.text);
}

function encodeFormatTransition(
  current: ResolvedFormat,
  next: ResolvedFormat,
): string {
  let encoded = "";
  if (next.color !== current.color) {
    encoded += `<RGB:${hexToGameRgb(next.color)}>`;
  }
  if (next.size !== current.size) {
    encoded += `<SIZE:${next.size}>`;
  }
  return encoded;
}

function findTextStyle(text: MessageText): MessageTextStyle | undefined {
  return text.marks?.find((mark) => mark.type === "textStyle")?.attrs;
}

// Format mapping

function createDefaultFormat(): ResolvedFormat {
  return { color: defaultGameMessageColor, size: DEFAULT_SIZE };
}

function formatToTextStyle(
  format: FormatState,
): MessageTextStyle | undefined {
  if (!format.color && !format.size) return undefined;
  return {
    ...(format.color ? { color: format.color } : {}),
    ...(format.size ? { fontSize: fontSizes[format.size] } : {}),
  };
}

function resolveTextFormat(style?: MessageTextStyle): ResolvedFormat {
  return {
    color: style?.color ?? defaultGameMessageColor,
    size: fontSizeToMessageSize(style?.fontSize),
  };
}

function fontSizeToMessageSize(fontSize?: string): MessageSize {
  for (const [size, value] of Object.entries(fontSizes)) {
    if (value === fontSize) return size as MessageSize;
  }
  return DEFAULT_SIZE;
}

// Color conversion

function gameRgbToHex(red: string, green: string, blue: string): string {
  const channels = [red, green, blue].map((channel) =>
    Math.round(clamp(Number.parseFloat(channel), 0, 1) * 255),
  );
  return `#${channels.map(toHexChannel).join("")}`;
}

function hexToGameRgb(color: string): string {
  const hex = color.replace("#", "");
  return HEX_CHANNEL_OFFSETS.map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  )
    .map((channel) => formatGameChannel(channel / 255))
    .join(",");
}

function toHexChannel(channel: number): string {
  return channel.toString(16).padStart(2, "0");
}

function formatGameChannel(channel: number): string {
  return Number(channel.toFixed(2)).toString();
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(value, minimum), maximum);
}
