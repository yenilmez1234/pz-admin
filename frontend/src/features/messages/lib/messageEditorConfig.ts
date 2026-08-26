import { Color } from "@tiptap/extension-color";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import type { GameBuild } from "@/features/game/types";
import { defaultGameMessageColor } from "./gameMessageColors";

export const messageEditorExtensions = [
  StarterKit.configure({
    blockquote: false,
    bold: false,
    bulletList: false,
    code: false,
    codeBlock: false,
    hardBreak: false,
    heading: false,
    horizontalRule: false,
    italic: false,
    link: false,
    listItem: false,
    orderedList: false,
    strike: false,
    underline: false,
  }),
  TextStyle,
  Color,
  FontSize,
];

export const messageColorSwatches: Record<GameBuild, string[]> = {
  "41": [
    "#ffffe0", // LightYellow
    "#ffa500", // Orange
    "#ffff00", // Yellow
    "#00ff00", // Lime
    "#00ffff", // Cyan
    defaultGameMessageColor,
    "#0000ff", // Blue
    "#ff00ff", // Magenta
    "#ff0000", // Red
  ],
  "42": [
    "#ffffff", // White
    "#ffa500", // Orange
    "#ffff00", // Yellow
    "#00ff00", // Lime
    "#00ffff", // Cyan
    defaultGameMessageColor,
    "#0000ff", // Blue
    "#ff00ff", // Magenta
    "#ff0000", // Red
  ],
};
