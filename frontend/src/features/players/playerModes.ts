import type { Player } from "@bindings/internal/player/models";
import { setGodMode, setInvisible, setNoClip } from "./actions/playerActions";

const playerModeById = {
  invisible: {
    feature: "player.setInvisible",
    label: "actionsMenu.invisible",
    enableLabel: "actionsMenu.enableInvisible",
    disableLabel: "actionsMenu.disableInvisible",
    enabledStateLabel: "actionsMenu.invisibleEnabledState",
    disabledStateLabel: "actionsMenu.invisibleDisabledState",
    unknownStateLabel: "actionsMenu.invisibleUnknownState",
    value: (player: Player) => player.invisible,
    execute: setInvisible,
  },
  godMode: {
    feature: null,
    label: "actionsMenu.godMode",
    enableLabel: "actionsMenu.enableGodMode",
    disableLabel: "actionsMenu.disableGodMode",
    enabledStateLabel: "actionsMenu.godModeEnabledState",
    disabledStateLabel: "actionsMenu.godModeDisabledState",
    unknownStateLabel: "actionsMenu.godModeUnknownState",
    value: (player: Player) => player.godMode,
    execute: setGodMode,
  },
  noClip: {
    feature: "player.setNoClip",
    label: "actionsMenu.noClip",
    enableLabel: "actionsMenu.enableNoClip",
    disableLabel: "actionsMenu.disableNoClip",
    enabledStateLabel: "actionsMenu.noClipEnabledState",
    disabledStateLabel: "actionsMenu.noClipDisabledState",
    unknownStateLabel: "actionsMenu.noClipUnknownState",
    value: (player: Player) => player.noClip,
    execute: setNoClip,
  },
} as const;

export type PlayerModeDefinition =
  (typeof playerModeById)[keyof typeof playerModeById];

// Object insertion order is the intended menu order.
export const playerModes: readonly PlayerModeDefinition[] =
  Object.values(playerModeById);
