import type { Player } from "@bindings/internal/player/models";
import { setGodMode, setInvisible, setNoClip } from "./actions/playerActions";

const playerModeById = {
  invisible: {
    feature: "player.setInvisible",
    label: "actions.modes.invisible.label",
    enableLabel: "actions.modes.invisible.enable",
    disableLabel: "actions.modes.invisible.disable",
    value: (player: Player) => player.invisible,
    execute: setInvisible,
  },
  godMode: {
    feature: null,
    label: "actions.modes.godMode.label",
    enableLabel: "actions.modes.godMode.enable",
    disableLabel: "actions.modes.godMode.disable",
    value: (player: Player) => player.godMode,
    execute: setGodMode,
  },
  noClip: {
    feature: "player.setNoClip",
    label: "actions.modes.noClip.label",
    enableLabel: "actions.modes.noClip.enable",
    disableLabel: "actions.modes.noClip.disable",
    value: (player: Player) => player.noClip,
    execute: setNoClip,
  },
} as const;

export type PlayerModeDefinition =
  (typeof playerModeById)[keyof typeof playerModeById];

// Object insertion order is the intended menu order.
export const playerModes: readonly PlayerModeDefinition[] =
  Object.values(playerModeById);
