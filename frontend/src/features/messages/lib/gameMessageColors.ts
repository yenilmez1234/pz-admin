import { convertHsvaTo, isColorValid, parseColor } from "@mantine/core";

import type { GameBuild } from "@/features/game/types";

export const defaultGameMessageColor = "#0080ff";

const HEX_CHANNEL_OFFSETS = [0, 2, 4] as const;

// Extracted from zombie.core.Colors in each game build.
const colorsByBuild: Record<GameBuild, Readonly<Record<string, string>>> = {
  "41": {
    "IndianRed": "#cd5c5c",
    "LightCoral": "#f08080",
    "Salmon": "#fa8072",
    "DarkSalmon": "#e9967a",
    "LightSalmon": "#ffa07a",
    "Crimson": "#dc143c",
    "Red": "#ff0000",
    "FireBrick": "#b22222",
    "DarkRed": "#8b0000",
    "Pink": "#ffc0cb",
    "LightPink": "#ffb6c1",
    "HotPink": "#ff69b4",
    "DeepPink": "#ff1493",
    "MediumVioletRed": "#c71585",
    "PaleVioletRed": "#db7093",
    "Coral": "#ff7f50",
    "Tomato": "#ff6347",
    "OrangeRed": "#ff4500",
    "DarkOrange": "#ff8c00",
    "Orange": "#ffa500",
    "Gold": "#ffd700",
    "Yellow": "#ffff00",
    "LightYellow": "#ffffe0",
    "LemonChiffon": "#fffacd",
    "LightGoldenrodYellow": "#fafad2",
    "PapayaWhip": "#ffefd5",
    "Moccasin": "#ffe4b5",
    "PeachPu": "#ffdab9",
    "PaleGoldenrod": "#eee8aa",
    "Khaki": "#f0e68c",
    "DarkKhaki": "#bdb76b",
    "Lavender": "#e6e6fa",
    "Thistle": "#d8bfd8",
    "Plum": "#dda0dd",
    "Violet": "#ee82ee",
    "Orchid": "#da70d6",
    "Fuchsia": "#ff00ff",
    "Magenta": "#ff00ff",
    "MediumOrchid": "#ba55d3",
    "MediumPurple": "#9370db",
    "BlueViolet": "#8a2be2",
    "DarkViolet": "#9400d3",
    "DarkOrchid": "#9932cc",
    "DarkMagenta": "#8b008b",
    "Purple": "#800080",
    "Indigo": "#4b0082",
    "SlateBlue": "#6a5acd",
    "DarkSlateBlue": "#483d8b",
    "GreenYellow": "#adff2f",
    "Chartreuse": "#7fff00",
    "LawnGreen": "#7cfc00",
    "Lime": "#00ff00",
    "LimeGreen": "#32cd32",
    "PaleGreen": "#98fb98",
    "LightGreen": "#90ee90",
    "MediumSpringGreen": "#00fa9a",
    "SpringGreen": "#00ff7f",
    "MediumSeaGreen": "#3cb371",
    "SeaGreen": "#2e8b57",
    "ForestGreen": "#228b22",
    "Green": "#008000",
    "DarkGreen": "#006400",
    "YellowGreen": "#9acd32",
    "OliveDrab": "#6b8e23",
    "Olive": "#808000",
    "DarkOliveGreen": "#556b2f",
    "MediumAquamarine": "#66cdaa",
    "DarkSeaGreen": "#8fbc8f",
    "LightSeaGreen": "#20b2aa",
    "DarkCyan": "#008b8b",
    "Teal": "#008080",
    "Aqua": "#00ffff",
    "Cyan": "#00ffff",
    "LightCyan": "#e0ffff",
    "PaleTurquoise": "#afeeee",
    "Aquamarine": "#7fffd4",
    "Turquoise": "#40e0d0",
    "MediumTurquoise": "#48d1cc",
    "DarkTurquoise": "#00ced1",
    "CadetBlue": "#5f9ea0",
    "SteelBlue": "#4682b4",
    "LightSteelBlue": "#b0c4de",
    "PowderBlue": "#b0e0e6",
    "LightBlue": "#add8e6",
    "SkyBlue": "#87ceeb",
    "LightSkyBlue": "#87cefa",
    "DeepSkyBlue": "#00bfff",
    "DodgerBlue": "#1e90ff",
    "CornFlowerBlue": "#6495ed",
    "MediumSlateBlue": "#7b68ee",
    "RoyalBlue": "#4169e1",
    "Blue": "#0000ff",
    "MediumBlue": "#0000cd",
    "DarkBlue": "#00008b",
    "Navy": "#000080",
    "MidnightBlue": "#191970",
    "CornSilk": "#fff8dc",
    "BlanchedAlmond": "#ffebcd",
    "Bisque": "#ffe4c4",
    "NavajoWhite": "#ffdead",
    "Wheat": "#f5deb3",
    "BurlyWood": "#deb887",
    "Tan": "#d2b48c",
    "RosyBrown": "#bc8f8f",
    "SandyBrown": "#f4a460",
    "Goldenrod": "#daa520",
    "DarkGoldenrod": "#b8860b",
    "Peru": "#cd853f",
    "Chocolate": "#d2691e",
    "SaddleBrown": "#8b4513",
    "Sienna": "#a0522d",
    "Brown": "#a52a2a",
    "Maroon": "#800000",
  },
  "42": {
    "UI_Background": "#000000",
    "Black": "#000000",
    "White": "#ffffff",
    "Silver": "#c0c0c0",
    "Gray": "#808080",
    "Red": "#ff0000",
    "Maroon": "#800000",
    "Yellow": "#ffff00",
    "Olive": "#808000",
    "Lime": "#00ff00",
    "Green": "#008000",
    "Cyan": "#00ffff",
    "Teal": "#008080",
    "Blue": "#0000ff",
    "Navy": "#000080",
    "Magenta": "#ff00ff",
    "Purple": "#800080",
    "Orange": "#ffa500",
    "Pink": "#ffc0cb",
    "Brown": "#a52a2a",
    "Gainsboro": "#dcdcdc",
    "LightGray": "#d3d3d3",
    "DarkGray": "#a9a9a9",
    "DimGray": "#696969",
    "LightSlateGray": "#778899",
    "SlateGray": "#708090",
    "DarkSlateGray": "#2f4f4f",
    "IndianRed": "#cd5c5c",
    "LightCoral": "#f08080",
    "Salmon": "#fa8072",
    "DarkSalmon": "#e9967a",
    "LightSalmon": "#ffa07a",
    "Crimson": "#dc143c",
    "FireBrick": "#b22222",
    "DarkRed": "#8b0000",
    "LightPink": "#ffb6c1",
    "HotPink": "#ff69b4",
    "DeepPink": "#ff1493",
    "MediumVioletRed": "#c71585",
    "PaleVioletRed": "#db7093",
    "Coral": "#ff7f50",
    "Tomato": "#ff6347",
    "OrangeRed": "#ff4500",
    "DarkOrange": "#ff8c00",
    "Gold": "#ffd700",
    "LightYellow": "#ffffe0",
    "LemonChiffon": "#fffacd",
    "LightGoldenrodYellow": "#fafad2",
    "PapayaWhip": "#ffefd5",
    "Moccasin": "#ffe4b5",
    "PeachPuff": "#ffdab9",
    "PaleGoldenrod": "#eee8aa",
    "Khaki": "#f0e68c",
    "DarkKhaki": "#bdb76b",
    "Lavender": "#e6e6fa",
    "Thistle": "#d8bfd8",
    "Plum": "#dda0dd",
    "Violet": "#ee82ee",
    "Orchid": "#da70d6",
    "MediumOrchid": "#ba55d3",
    "MediumPurple": "#9370db",
    "RebeccaPurple": "#663399",
    "BlueViolet": "#8a2be2",
    "DarkViolet": "#9400d3",
    "DarkOrchid": "#9932cc",
    "DarkMagenta": "#8b008b",
    "Indigo": "#4b0082",
    "SlateBlue": "#6a5acd",
    "DarkSlateBlue": "#483d8b",
    "MediumSlateBlue": "#7b68ee",
    "GreenYellow": "#adff2f",
    "Chartreuse": "#7fff00",
    "LawnGreen": "#7cfc00",
    "LimeGreen": "#32cd32",
    "PaleGreen": "#98fb98",
    "LightGreen": "#90ee90",
    "MediumSpringGreen": "#00fa9a",
    "SpringGreen": "#00ff7f",
    "MediumSeaGreen": "#3cb371",
    "SeaGreen": "#2e8b57",
    "ForestGreen": "#228b22",
    "DarkGreen": "#006400",
    "YellowGreen": "#9acd32",
    "OliveDrab": "#6b8e23",
    "DarkOliveGreen": "#556b2f",
    "MediumAquamarine": "#66cdaa",
    "DarkSeaGreen": "#8fbc8b",
    "LightSeaGreen": "#20b2aa",
    "DarkCyan": "#008b8b",
    "LightCyan": "#e0ffff",
    "PaleTurquoise": "#afeeee",
    "Aquamarine": "#7fffd4",
    "Turquoise": "#40e0d0",
    "MediumTurquoise": "#48d1cc",
    "DarkTurquoise": "#00ced1",
    "CadetBlue": "#5f9ea0",
    "SteelBlue": "#4682b4",
    "LightSteelBlue": "#b0c4de",
    "PowderBlue": "#b0e0e6",
    "LightBlue": "#add8e6",
    "SkyBlue": "#87ceeb",
    "LightSkyBlue": "#87cefa",
    "DeepSkyBlue": "#00bfff",
    "DodgerBlue": "#1e90ff",
    "CornFlowerBlue": "#6495ed",
    "RoyalBlue": "#4169e1",
    "MediumBlue": "#0000cd",
    "DarkBlue": "#00008b",
    "MidnightBlue": "#191970",
    "Cornsilk": "#fff8dc",
    "BlanchedAlmond": "#ffebcd",
    "Bisque": "#ffe4c4",
    "NavajoWhite": "#ffdead",
    "Wheat": "#f5deb3",
    "BurlyWood": "#deb887",
    "Tan": "#d2b48c",
    "RosyBrown": "#bc8f8f",
    "SandyBrown": "#f4a460",
    "Goldenrod": "#daa520",
    "DarkGoldenrod": "#b8860b",
    "Peru": "#cd853f",
    "Chocolate": "#d2691e",
    "SaddleBrown": "#8b4513",
    "Sienna": "#a0522d",
    "Snow": "#fffafa",
    "HoneyDew": "#f0fff0",
    "MintCream": "#f5fffa",
    "Azure": "#f0ffff",
    "AliceBlue": "#f0f8ff",
    "GhostWhite": "#f8f8ff",
    "WhiteSmoke": "#f5f5f5",
    "SeaShell": "#fff5ee",
    "Beige": "#f5f5dc",
    "OldLace": "#fdf5e6",
    "FloralWhite": "#fffaf0",
    "Ivory": "#fffff0",
    "AntiqueWhite": "#faebd7",
    "Linen": "#faf0e6",
    "LavenderBlush": "#fff0f5",
    "MistyRose": "#ffe4e1",
    "Grenadine": "#ac545e",
    "Cola": "#3c2f23",
    "Ginger": "#b06500",
    "FruitPunch": "#ce3d48",
  },
};

const colorsByLowercaseName: Record<
  GameBuild,
  ReadonlyMap<string, string>
> = {
  "41": createColorsByLowercaseName(colorsByBuild["41"]),
  "42": createColorsByLowercaseName(colorsByBuild["42"]),
};

function createColorsByLowercaseName(
  colors: Readonly<Record<string, string>>,
): ReadonlyMap<string, string> {
  return new Map(
    Object.entries(colors).map(([name, color]) => [name.toLowerCase(), color]),
  );
}

export function getGameMessageNamedColor(
  build: GameBuild,
  name: string,
): string | undefined {
  return colorsByLowercaseName[build].get(name.toLowerCase());
}

export function decodeGameMessageRgb(
  red: string,
  green: string,
  blue: string,
): string {
  const channels = [red, green, blue].map((channel) =>
    Math.round(clamp(Number.parseFloat(channel), 0, 1) * 255),
  );
  return `#${channels.map(toHexChannel).join("")}`;
}

export function encodeGameMessageColorToken(
  color: string,
  build: GameBuild,
): string {
  const normalizedColor = normalizeColor(color);
  const rgb = encodeGameMessageRgb(normalizedColor);
  const rgbToken = `<RGB:${rgb}>`;
  const rgbColor = decodeGameMessageRgb(
    ...(rgb.split(",") as [string, string, string]),
  );
  const named = getClosestGameMessageNamedColor(build, normalizedColor);
  if (!named) return rgbToken;

  const namedToken = `<${named.name.toUpperCase()}>`;
  return namedToken.length < rgbToken.length &&
    getGameMessageColorDistance(named.color, normalizedColor) <=
      getGameMessageColorDistance(rgbColor, normalizedColor)
    ? namedToken
    : rgbToken;
}

export function getClosestGameMessageNamedColor(
  build: GameBuild,
  color: string,
): { color: string; name: string } | undefined {
  let closest: { color: string; name: string } | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const [name, namedColor] of Object.entries(colorsByBuild[build])) {
    const distance = getGameMessageColorDistance(color, namedColor);
    if (
      distance < closestDistance ||
      (distance === closestDistance && name.length < (closest?.name.length ?? Infinity))
    ) {
      closest = { color: namedColor, name };
      closestDistance = distance;
    }
  }

  return closest;
}

export function getGameMessageColorDistance(
  first: string,
  second: string,
): number {
  const firstChannels = hexChannels(first);
  const secondChannels = hexChannels(second);
  return firstChannels.reduce((distance, channel, index) => {
    const difference = channel - secondChannels[index];
    return distance + difference * difference;
  }, 0);
}

function hexChannels(color: string): number[] {
  const hex = color.replace("#", "");
  return [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
}

function encodeGameMessageRgb(color: string): string {
  const hex = normalizeColor(color).replace("#", "");
  return HEX_CHANNEL_OFFSETS.map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  )
    .map((channel) => formatGameChannel(channel / 255))
    .join(",");
}

function normalizeColor(color: string): string {
  return isColorValid(color)
    ? convertHsvaTo("hex", parseColor(color)).toLowerCase()
    : defaultGameMessageColor;
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
