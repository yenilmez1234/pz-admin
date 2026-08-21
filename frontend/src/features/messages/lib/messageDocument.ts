import type { MessageDocument, MessageLine } from "@/features/messages/types";

const colorPrefix = /^<RGB:([\d.]+),([\d.]+),([\d.]+)>/;
let nextLineId = 0;

export function createMessageLine(
  text = "",
  color: string | null = null,
): MessageLine {
  nextLineId += 1;
  return { color, id: `message-line-${nextLineId}`, text };
}

export function createEmptyMessage(): MessageDocument {
  return { lines: [createMessageLine()] };
}

export function parseMessage(value: string): MessageDocument {
  if (!value) return createEmptyMessage();

  return {
    lines: value.split("<LINE>").map((encodedLine) => {
      const match = encodedLine.match(colorPrefix);
      if (!match) return createMessageLine(encodedLine);

      const [, red, green, blue] = match;
      return createMessageLine(
        encodedLine.slice(match[0].length),
        rgbFloatsToHex(red, green, blue),
      );
    }),
  };
}

export function serializeMessage(document: MessageDocument): string {
  return document.lines
    .map((line) => {
      if (!line.color || !line.text.trim()) return line.text;
      return `<RGB:${hexToRgbFloats(line.color)}>${line.text}`;
    })
    .join("<LINE>");
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
