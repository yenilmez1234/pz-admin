import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { usePlayers } from "@/features/players/PlayersProvider";
import { useSession } from "@/features/session/useSession";
import { AddLocalPlayerModal } from "../components/dialogs/AddLocalPlayerModal";
import { AddServerUserModal } from "../components/dialogs/AddServerUserModal";
import { AddXpModal } from "../components/dialogs/AddXpModal";
import { BanPlayerModal } from "../components/dialogs/BanPlayerModal";
import { CreateHordeModal } from "../components/dialogs/CreateHordeModal";
import { GiveItemsModal } from "../components/dialogs/GiveItemsModal";
import { KickPlayerModal } from "../components/dialogs/KickPlayerModal";
import { LightningPlayerModal } from "../components/dialogs/LightningPlayerModal";
import { RemoveFromWhitelistModal } from "../components/dialogs/RemoveFromWhitelistModal";
import { SetAccessLevelModal } from "../components/dialogs/SetAccessLevelModal";
import { SetPasswordModal } from "../components/dialogs/SetPasswordModal";
import { SpawnVehicleModal } from "../components/dialogs/SpawnVehicleModal";
import { TeleportPlayerModal } from "../components/dialogs/TeleportPlayerModal";
import { ThunderPlayerModal } from "../components/dialogs/ThunderPlayerModal";
import {
  addLocalPlayer,
  addServerUser,
  addXp,
  ban,
  createHorde,
  giveItems,
  kick,
  lightning,
  removeFromWhitelist,
  setAccessLevel,
  setPassword,
  setVoiceBanned,
  spawnVehicle,
  teleportToCoordinates,
  teleportToPlayer,
  thunder,
  unban,
} from "./playerActions";

type DialogType =
  | "accessLevel"
  | "addLocalPlayer"
  | "addServerUser"
  | "addXp"
  | "ban"
  | "createHorde"
  | "giveItems"
  | "kick"
  | "lightning"
  | "removeFromWhitelist"
  | "setPassword"
  | "spawnVehicle"
  | "teleport"
  | "thunder";

interface PlayerDialogState {
  opened: boolean;
  players: Player[];
  type: DialogType | null;
}

interface PlayerActions {
  openAccessLevel: (players: Player[]) => void;
  openAddLocalPlayer: () => void;
  openAddServerUser: () => void;
  openAddXp: (players: Player[]) => void;
  openBan: (players: Player[]) => void;
  openCreateHorde: (players: Player[]) => void;
  openGiveItems: (players: Player[]) => void;
  openKick: (players: Player[]) => void;
  openLightning: (players: Player[]) => void;
  openRemoveFromWhitelist: (players: Player[]) => void;
  openSetPassword: (players: Player[]) => void;
  openSpawnVehicle: (players: Player[]) => void;
  openTeleport: (players: Player[]) => void;
  openThunder: (players: Player[]) => void;
  setVoiceBanned: (players: Player[], banned: boolean) => void;
  unban: (players: Player[]) => void;
}

const PlayerActionsContext = createContext<PlayerActions | null>(null);

const initialDialog: PlayerDialogState = {
  opened: false,
  players: [],
  type: null,
};

interface PlayerActionsProviderProps {
  children: ReactNode;
}

export function PlayerActionsProvider({
  children,
}: PlayerActionsProviderProps) {
  const { players } = usePlayers();
  const { profile } = useSession();
  const [dialog, setDialog] = useState<PlayerDialogState>(initialDialog);
  const build: GameBuild = profile?.version === "41" ? "41" : "42";

  const openDialog = useCallback((type: DialogType, targets: Player[] = []) => {
    setDialog({ opened: true, players: targets, type });
  }, []);

  const closeDialog = useCallback(() => {
    // Retain the dialog contents while its exit transition finishes.
    setDialog((current) => ({ ...current, opened: false }));
  }, []);

  const actions = useMemo<PlayerActions>(
    () => ({
      openAccessLevel: (targets) => openDialog("accessLevel", targets),
      openAddLocalPlayer: () => openDialog("addLocalPlayer"),
      openAddServerUser: () => openDialog("addServerUser"),
      openAddXp: (targets) => openDialog("addXp", targets),
      openBan: (targets) => openDialog("ban", targets),
      openCreateHorde: (targets) => openDialog("createHorde", targets),
      openGiveItems: (targets) => openDialog("giveItems", targets),
      openKick: (targets) => openDialog("kick", targets),
      openLightning: (targets) => openDialog("lightning", targets),
      openRemoveFromWhitelist: (targets) =>
        openDialog("removeFromWhitelist", targets),
      openSetPassword: (targets) => openDialog("setPassword", targets),
      openSpawnVehicle: (targets) => openDialog("spawnVehicle", targets),
      openTeleport: (targets) => openDialog("teleport", targets),
      openThunder: (targets) => openDialog("thunder", targets),
      setVoiceBanned: (targets, banned) => void setVoiceBanned(targets, banned),
      unban: (targets) => void unban(targets),
    }),
    [openDialog],
  );

  return (
    <PlayerActionsContext value={actions}>
      {children}

      <SetAccessLevelModal
        build={build}
        opened={dialog.opened && dialog.type === "accessLevel"}
        players={dialog.players}
        onClose={closeDialog}
        onSetAccessLevel={setAccessLevel}
      />
      <SetPasswordModal
        opened={dialog.opened && dialog.type === "setPassword"}
        players={dialog.players}
        onClose={closeDialog}
        onSetPassword={setPassword}
      />
      <AddServerUserModal
        opened={dialog.opened && dialog.type === "addServerUser"}
        onAdd={addServerUser}
        onClose={closeDialog}
      />
      <AddLocalPlayerModal
        opened={dialog.opened && dialog.type === "addLocalPlayer"}
        onAdd={addLocalPlayer}
        onClose={closeDialog}
      />
      <BanPlayerModal
        opened={dialog.opened && dialog.type === "ban"}
        players={dialog.players}
        onBan={ban}
        onClose={closeDialog}
      />
      <KickPlayerModal
        opened={dialog.opened && dialog.type === "kick"}
        players={dialog.players}
        onClose={closeDialog}
        onKick={kick}
      />
      <RemoveFromWhitelistModal
        opened={dialog.opened && dialog.type === "removeFromWhitelist"}
        players={dialog.players}
        onClose={closeDialog}
        onRemove={removeFromWhitelist}
      />
      <TeleportPlayerModal
        allPlayers={players}
        opened={dialog.opened && dialog.type === "teleport"}
        players={dialog.players}
        onClose={closeDialog}
        onTeleportToCoordinates={teleportToCoordinates}
        onTeleportToPlayer={teleportToPlayer}
      />

      {dialog.type === "spawnVehicle" && dialog.players.length > 0 ? (
        <SpawnVehicleModal
          build={build}
          onSpawn={spawnVehicle}
          onClose={closeDialog}
          opened={dialog.opened}
          players={dialog.players}
        />
      ) : null}
      {dialog.type === "giveItems" && dialog.players.length > 0 ? (
        <GiveItemsModal
          build={build}
          onClose={closeDialog}
          onGive={giveItems}
          opened={dialog.opened}
          players={dialog.players}
        />
      ) : null}
      {dialog.type === "addXp" && dialog.players.length > 0 ? (
        <AddXpModal
          build={build}
          onAdd={addXp}
          onClose={closeDialog}
          opened={dialog.opened}
          players={dialog.players}
        />
      ) : null}

      <CreateHordeModal
        opened={dialog.opened && dialog.type === "createHorde"}
        players={dialog.players}
        onClose={closeDialog}
        onCreate={createHorde}
      />
      <LightningPlayerModal
        opened={dialog.opened && dialog.type === "lightning"}
        players={dialog.players}
        onClose={closeDialog}
        onLightning={lightning}
      />
      <ThunderPlayerModal
        opened={dialog.opened && dialog.type === "thunder"}
        players={dialog.players}
        onClose={closeDialog}
        onThunder={thunder}
      />
    </PlayerActionsContext>
  );
}

export function usePlayerActions() {
  const actions = useContext(PlayerActionsContext);
  if (!actions) {
    throw new Error(
      "usePlayerActions must be used within PlayerActionsProvider",
    );
  }
  return actions;
}
