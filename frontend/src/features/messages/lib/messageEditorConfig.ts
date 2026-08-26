import { Color } from "@tiptap/extension-color";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { defaultGameMessageColor } from "./gameMessageCodec";

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

export const messageColorSwatches = [
  "#ffffff",
  "#ff8033",
  "#e6cc1a",
  "#b3e6b3",
  "#33b3ff",
  defaultGameMessageColor,
  "#b399ff",
  "#ff80b3",
  "#ff8080",
];
