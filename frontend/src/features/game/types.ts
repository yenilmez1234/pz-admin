export const gameBuilds = ["41", "42"] as const;

export type GameBuild = (typeof gameBuilds)[number];

export function isGameBuild(value: string): value is GameBuild {
  return gameBuilds.some((build) => build === value);
}
