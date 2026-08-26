import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
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
  TextAlign.configure({
    alignments: ["left", "center", "right"],
    types: ["paragraph"],
  }),
];

export const messageColorSwatches: Record<GameBuild, string[]> = {
  "41": [
    "#ffffe0", // LightYellow
    "#e64d00", // Orange
    "#ffff00", // Yellow
    "#00ff00", // Green
    "#00ffff", // Cyan
    defaultGameMessageColor,
    "#0000ff", // Blue
    "#ff00ff", // Magenta
    "#ff0000", // Red
  ],
  "42": [
    "#ffffff", // White
    "#e64d00", // Orange
    "#ffff00", // Yellow
    "#00ff00", // Green
    "#00ffff", // Cyan
    defaultGameMessageColor,
    "#0000ff", // Blue
    "#ff00ff", // Magenta
    "#ff0000", // Red
  ],
};
