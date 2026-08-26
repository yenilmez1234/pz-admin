import { createEmptyMessageDocument } from "@/features/messages/lib/messageDocument";
import type {
  MessageDocument,
  MessageMark,
  MessageParagraph,
  MessageSize,
  MessageText,
} from "@/features/messages/types";

export const defaultGameMessageColor = "#0080ff";

const fontSizes: Record<MessageSize, string> = {
  small: "0.75em",
  medium: "1em",
  large: "1.25em",
};

interface GameFormatState {
  color?: string;
  size?: MessageSize;
}

interface GameMarkupToken {
  match(value: string): RegExpMatchArray | null;
  apply(match: RegExpMatchArray, state: GameFormatState): void;
}

const formattingTokens: GameMarkupToken[] = [
  defineToken(/^RGB:([\d.]+),([\d.]+),([\d.]+)$/, (match, state) => {
    state.color = rgbFloatsToHex(match[1], match[2], match[3]);
  }),
  defineToken(/^SIZE:(small|medium|large)$/, (match, state) => {
    state.size = match[1] as MessageSize;
  }),
];

const markupToken = /<([^<>]+)>/g;
const forbiddenCharacter = /[<>"\0]/;
const forbiddenCharacters = /[<>"\0]/g;

export function parseGameMessage(value: string): MessageDocument {
  if (!value) return createEmptyMessageDocument();

  const state: GameFormatState = {};
  const content: MessageParagraph[] = [{ type: "paragraph" }];
  let cursor = 0;

  for (const tokenMatch of value.matchAll(markupToken)) {
    appendText(
      content[content.length - 1],
      value.slice(cursor, tokenMatch.index),
      state,
    );
    const token = tokenMatch[1];

    if (token === "LINE") {
      content.push({ type: "paragraph" });
    } else {
      applyFormattingToken(token, state);
    }
    cursor = tokenMatch.index + tokenMatch[0].length;
  }

  appendText(content[content.length - 1], value.slice(cursor), state);
  return { type: "doc", content };
}

export function serializeGameMessage(document: MessageDocument): string {
  const state: Required<GameFormatState> = {
    color: defaultGameMessageColor,
    size: "medium",
  };

  return document.content
    .map((paragraph) =>
      (paragraph.content ?? [])
        .map((text) => serializeText(text, state))
        .join(""),
    )
    .join("<LINE>");
}

export function containsForbiddenGameMessageCharacters(
  value: string,
): boolean {
  return forbiddenCharacter.test(value);
}

export function sanitizeGameMessageText(value: string): string {
  return value.replace(forbiddenCharacters, "");
}

function defineToken(
  pattern: RegExp,
  apply: GameMarkupToken["apply"],
): GameMarkupToken {
  return { match: (value) => value.match(pattern), apply };
}

function applyFormattingToken(token: string, state: GameFormatState) {
  for (const definition of formattingTokens) {
    const match = definition.match(token);
    if (!match) continue;
    definition.apply(match, state);
    return;
  }
}

function appendText(
  paragraph: MessageParagraph,
  text: string,
  state: GameFormatState,
) {
  if (!text) return;
  const marks: MessageMark[] = [];

  if (state.color || state.size) {
    marks.push({
      type: "textStyle",
      attrs: {
        ...(state.color ? { color: state.color } : {}),
        ...(state.size ? { fontSize: fontSizes[state.size] } : {}),
      },
    });
  }
  paragraph.content ??= [];
  paragraph.content.push({ type: "text", text, marks });
}

function serializeText(
  text: MessageText,
  state: Required<GameFormatState>,
): string {
  const attributes = text.marks?.find(
    (mark) => mark.type === "textStyle",
  )?.attrs;
  const color = attributes?.color ?? defaultGameMessageColor;
  const size = messageSizeFromFontSize(attributes?.fontSize);
  let prefix = "";

  if (color !== state.color) {
    prefix += `<RGB:${hexToRgbFloats(color)}>`;
    state.color = color;
  }
  if (size !== state.size) {
    prefix += `<SIZE:${size}>`;
    state.size = size;
  }
  return prefix + sanitizeGameMessageText(text.text);
}

function messageSizeFromFontSize(fontSize?: string): MessageSize {
  return (
    (Object.entries(fontSizes).find(([, value]) => value === fontSize)?.[0] as
      | MessageSize
      | undefined) ?? "medium"
  );
}

function hexToRgbFloats(color: string): string {
  const normalized = color.replace("#", "");
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(normalized.slice(offset, offset + 2), 16),
  );
  return channels.map((channel) => formatFloat(channel / 255)).join(",");
}

function rgbFloatsToHex(red: string, green: string, blue: string): string {
  const channels = [red, green, blue].map((channel) =>
    Math.round(clamp(Number.parseFloat(channel), 0, 1) * 255),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function formatFloat(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(value, minimum), maximum);
}
