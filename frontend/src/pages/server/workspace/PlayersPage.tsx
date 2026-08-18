import { useState } from "react";
import { Alert, Box, Button, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type {
  ItemGrant,
  Player,
  XPGrant,
} from "@bindings/internal/player/models";
import {
  AddItems,
  AddLocalUser,
  AddUser,
  AddVehicle as SpawnVehicle,
  AddXP,
  Ban,
  CreateHorde,
  Kick,
  Lightning,
  RemoveFromWhitelist,
  SetAccessLevel,
  SetGodMode,
  SetInvisible,
  SetNoClip,
  SetVoiceBanned,
  Teleport,
  TeleportToCoordinates,
  Thunder,
  Unban,
} from "@bindings/internal/player/service";
import { AddLocalPlayerModal } from "@/components/player/AddLocalPlayerModal";
import { AddXpModal } from "@/components/player/AddXpModal";
import { SpawnVehicleModal } from "@/components/player/SpawnVehicleModal";
import { GiveItemsModal } from "@/components/player/GiveItemsModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { AddServerUserModal } from "@/components/player/AddServerUserModal";
import { BanPlayerModal } from "@/components/player/BanPlayerModal";
import { CreateHordeModal } from "@/components/player/CreateHordeModal";
import { KickPlayerModal } from "@/components/player/KickPlayerModal";
import { LightningPlayerModal } from "@/components/player/LightningPlayerModal";
import {
  runPlayerAction,
  runPlayerOperation,
} from "@/components/player/playerAction";
import { PlayerBulkActions } from "@/components/player/PlayerBulkActions";
import { PlayerTable } from "@/components/player/PlayerTable";
import { RemoveFromWhitelistModal } from "@/components/player/RemoveFromWhitelistModal";
import { SetAccessLevelModal } from "@/components/player/SetAccessLevelModal";
import { TeleportPlayerModal } from "@/components/player/TeleportPlayerModal";
import { ThunderPlayerModal } from "@/components/player/ThunderPlayerModal";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { usePlayers } from "@/providers/PlayersProvider";
import { useSession } from "@/providers/SessionProvider";
import type { GameBuild } from "@/features/game/types";
import type { VehicleCatalogEntry } from "@/features/vehicles/types";
import i18n from "@/i18n";

const t = i18n.getFixedT(null, "players");

function handleAddServerUser(username: string, password: string) {
  return runPlayerOperation({
    execute: () => AddUser(username, password),
    successTitle: t("notifications.addServerUser.successTitle"),
    successMessage: t("notifications.addServerUser.successMessage", {
      username,
    }),
    failureTitle: t("notifications.addServerUser.failureTitle"),
  });
}

function handleAddLocalPlayer(username: string) {
  return runPlayerOperation({
    execute: () => AddLocalUser(username),
    successTitle: t("notifications.addLocalPlayer.successTitle"),
    successMessage: t("notifications.addLocalPlayer.successMessage", {
      username,
    }),
    failureTitle: t("notifications.addLocalPlayer.failureTitle"),
  });
}

function handleGodModeChange(targets: Player[], enabled: boolean) {
  const operation = enabled ? "enable" : "disable";
  return runPlayerAction({
    targets,
    execute: (playerIds) => SetGodMode(playerIds, enabled),
    successTitle: t(`notifications.godMode.${operation}.successTitle`),
    successMessage: (successfulTargets) =>
      t(`notifications.godMode.${operation}.successMessage`, {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t(`notifications.godMode.${operation}.failureTitle`),
    partialFailureTitle: t("notifications.godMode.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.godMode.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleNoClipChange(targets: Player[], enabled: boolean) {
  const operation = enabled ? "enable" : "disable";
  return runPlayerAction({
    targets,
    execute: (playerIds) => SetNoClip(playerIds, enabled),
    successTitle: t(`notifications.noClip.${operation}.successTitle`),
    successMessage: (successfulTargets) =>
      t(`notifications.noClip.${operation}.successMessage`, {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t(`notifications.noClip.${operation}.failureTitle`),
    partialFailureTitle: t("notifications.noClip.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.noClip.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleInvisibleChange(targets: Player[], enabled: boolean) {
  const operation = enabled ? "enable" : "disable";
  return runPlayerAction({
    targets,
    execute: (playerIds) => SetInvisible(playerIds, enabled),
    successTitle: t(`notifications.invisible.${operation}.successTitle`),
    successMessage: (successfulTargets) =>
      t(`notifications.invisible.${operation}.successMessage`, {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t(`notifications.invisible.${operation}.failureTitle`),
    partialFailureTitle: t("notifications.invisible.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.invisible.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleSpawnVehicle(targets: Player[], vehicle: VehicleCatalogEntry) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => SpawnVehicle(playerIds, vehicle.id),
    successTitle: t("notifications.spawnVehicle.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.spawnVehicle.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
        vehicle: vehicle.name,
      }),
    failureTitle: t("notifications.spawnVehicle.failureTitle"),
    partialFailureTitle: t("notifications.spawnVehicle.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.spawnVehicle.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleGiveItems(targets: Player[], items: ItemGrant[]) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => AddItems(playerIds, items),
    successTitle: t("notifications.giveItems.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.giveItems.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.giveItems.failureTitle"),
    partialFailureTitle: t("notifications.giveItems.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.giveItems.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleAddXp(targets: Player[], grants: XPGrant[]) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => AddXP(playerIds, grants),
    successTitle: t("notifications.addXp.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.addXp.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.addXp.failureTitle"),
    partialFailureTitle: t("notifications.addXp.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.addXp.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleVoiceBanChange(targets: Player[], banned: boolean) {
  const operation = banned ? "apply" : "remove";
  return runPlayerAction({
    targets,
    execute: (playerIds) => SetVoiceBanned(playerIds, banned),
    successTitle: t(`notifications.voiceBan.${operation}.successTitle`),
    successMessage: (successfulTargets) =>
      t(`notifications.voiceBan.${operation}.successMessage`, {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t(`notifications.voiceBan.${operation}.failureTitle`),
    partialFailureTitle: t("notifications.voiceBan.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.voiceBan.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleAccessLevelChange(targets: Player[], accessLevel: string) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => SetAccessLevel(playerIds, accessLevel),
    successTitle: t("notifications.accessLevel.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.accessLevel.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.accessLevel.failureTitle"),
    partialFailureTitle: t("notifications.accessLevel.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.accessLevel.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleBan(targets: Player[], reason: string, banIP: boolean) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => Ban(playerIds, reason, banIP),
    successTitle: t("notifications.ban.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.ban.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.ban.failureTitle"),
    partialFailureTitle: t("notifications.ban.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.ban.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleKick(targets: Player[], reason: string) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => Kick(playerIds, reason),
    successTitle: t("notifications.kick.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.kick.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.kick.failureTitle"),
    partialFailureTitle: t("notifications.kick.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.kick.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleUnban(targets: Player[]) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => Unban(playerIds),
    successTitle: t("notifications.unban.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.unban.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.unban.failureTitle"),
    partialFailureTitle: t("notifications.unban.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.unban.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleRemoveFromWhitelist(targets: Player[], deleteLocal: boolean) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => RemoveFromWhitelist(playerIds, deleteLocal),
    successTitle: t("notifications.removeFromWhitelist.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.removeFromWhitelist.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.removeFromWhitelist.failureTitle"),
    partialFailureTitle: t(
      "notifications.removeFromWhitelist.partialFailureTitle",
    ),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.removeFromWhitelist.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleTeleportToPlayer(targets: Player[], targetPlayerId: string) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => Teleport(playerIds, targetPlayerId),
    successTitle: t("notifications.teleport.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.teleport.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.teleport.failureTitle"),
    partialFailureTitle: t("notifications.teleport.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.teleport.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleTeleportToCoordinates(targets: Player[], coordinates: string) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => TeleportToCoordinates(playerIds, coordinates),
    successTitle: t("notifications.teleport.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.teleport.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.teleport.failureTitle"),
    partialFailureTitle: t("notifications.teleport.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.teleport.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleCreateHorde(targets: Player[], count: number) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => CreateHorde(playerIds, count),
    successTitle: t("notifications.createHorde.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.createHorde.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.createHorde.failureTitle"),
    partialFailureTitle: t("notifications.createHorde.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.createHorde.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleLightning(targets: Player[]) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => Lightning(playerIds),
    successTitle: t("notifications.lightning.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.lightning.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.lightning.failureTitle"),
    partialFailureTitle: t("notifications.lightning.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.lightning.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

function handleThunder(targets: Player[]) {
  return runPlayerAction({
    targets,
    execute: (playerIds) => Thunder(playerIds),
    successTitle: t("notifications.thunder.successTitle"),
    successMessage: (successfulTargets) =>
      t("notifications.thunder.successMessage", {
        count: successfulTargets.length,
        username: successfulTargets[0]?.username,
      }),
    failureTitle: t("notifications.thunder.failureTitle"),
    partialFailureTitle: t("notifications.thunder.partialFailureTitle"),
    partialFailureMessage: (failedCount, targetCount, error) =>
      t("notifications.thunder.partialFailureMessage", {
        error,
        failedCount,
        totalCount: targetCount,
      }),
  });
}

interface PlayerDialogState {
  opened: boolean;
  players: Player[];
}

type PlayerEvent = "horde" | "lightning" | "thunder";

interface PlayerEventDialogState extends PlayerDialogState {
  event: PlayerEvent | null;
}

export function PlayersPage() {
  const { t: translate } = useTranslation(["players", "common"]);
  const { config } = useAppConfig();
  const { error, loading, players, refresh } = usePlayers();
  const { profile, supports } = useSession();
  const [accessLevelDialog, setAccessLevelDialog] = useState<PlayerDialogState>(
    { opened: false, players: [] },
  );
  const [addServerUserDialogOpened, setAddServerUserDialogOpened] =
    useState(false);
  const [addLocalPlayerDialogOpened, setAddLocalPlayerDialogOpened] =
    useState(false);
  const [banDialog, setBanDialog] = useState<PlayerDialogState>({
    opened: false,
    players: [],
  });
  const [kickDialog, setKickDialog] = useState<PlayerDialogState>({
    opened: false,
    players: [],
  });
  const [whitelistDialog, setWhitelistDialog] = useState<PlayerDialogState>({
    opened: false,
    players: [],
  });
  const [teleportDialog, setTeleportDialog] = useState<PlayerDialogState>({
    opened: false,
    players: [],
  });
  const [spawnVehicleDialog, setSpawnVehicleDialog] =
    useState<PlayerDialogState>({
      opened: false,
      players: [],
    });
  const [giveItemsDialog, setGiveItemsDialog] = useState<PlayerDialogState>({
    opened: false,
    players: [],
  });
  const [addXpDialog, setAddXpDialog] = useState<PlayerDialogState>({
    opened: false,
    players: [],
  });
  const [eventDialog, setEventDialog] = useState<PlayerEventDialogState>({
    event: null,
    opened: false,
    players: [],
  });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const selectedPlayers = players.filter((player) =>
    selectedPlayerIds.has(player.id),
  );
  const gameBuild: GameBuild = profile?.version === "41" ? "41" : "42";

  function clearSelection() {
    setSelectedPlayerIds(new Set());
  }

  function openAccessLevelDialog(targets: Player[]) {
    setAccessLevelDialog({ opened: true, players: targets });
  }

  function closeAccessLevelDialog() {
    setAccessLevelDialog((current) => ({ ...current, opened: false }));
  }

  return (
    <PageContainer
      contentWidth="wide"
      h="100%"
      pos="relative"
      px={0}
      style={{ overflow: "hidden" }}
    >
      <Stack
        gap="md"
        h="100%"
        px="xl"
        py="md"
        pb={selectedPlayers.length > 0 ? 88 : "md"}
        aria-busy={loading}
        style={{ overflowY: "auto" }}
      >
        {error ? (
          <Alert
            color="red"
            icon={<IconAlertCircle size={20} aria-hidden="true" />}
            title={translate("loadError.title")}
            aria-live="polite"
          >
            <Stack gap="xs" align="flex-start">
              <Text size="sm">{error}</Text>
              <Button variant="light" size="xs" onClick={() => void refresh()}>
                {translate("actions.retry", { ns: "common" })}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <PlayerTable
          build={gameBuild}
          language={config?.language ?? "en-US"}
          loading={loading}
          onAddXp={(targets) =>
            setAddXpDialog({ opened: true, players: targets })
          }
          onGiveItems={(targets) =>
            setGiveItemsDialog({ opened: true, players: targets })
          }
          onSpawnVehicle={(targets) =>
            setSpawnVehicleDialog({ opened: true, players: targets })
          }
          onAddLocalPlayer={() => setAddLocalPlayerDialogOpened(true)}
          onAddServerUser={() => setAddServerUserDialogOpened(true)}
          onBan={(targets) => setBanDialog({ opened: true, players: targets })}
          onCreateHorde={(targets) =>
            setEventDialog({
              event: "horde",
              opened: true,
              players: targets,
            })
          }
          onGodModeChange={(targets, enabled) =>
            void handleGodModeChange(targets, enabled)
          }
          onInvisibleChange={(targets, enabled) =>
            void handleInvisibleChange(targets, enabled)
          }
          onNoClipChange={(targets, enabled) =>
            void handleNoClipChange(targets, enabled)
          }
          onKick={(targets) =>
            setKickDialog({ opened: true, players: targets })
          }
          onLightning={(targets) =>
            setEventDialog({
              event: "lightning",
              opened: true,
              players: targets,
            })
          }
          onRemoveFromWhitelist={(targets) =>
            setWhitelistDialog({ opened: true, players: targets })
          }
          onSelectionChange={setSelectedPlayerIds}
          onSetAccessLevel={openAccessLevelDialog}
          onTeleport={(targets) =>
            setTeleportDialog({ opened: true, players: targets })
          }
          onThunder={(targets) =>
            setEventDialog({
              event: "thunder",
              opened: true,
              players: targets,
            })
          }
          onUnban={(targets) => void handleUnban(targets)}
          onVoiceBanChange={(targets, banned) =>
            void handleVoiceBanChange(targets, banned)
          }
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          showEmptyState={!error}
          showInvisible={supports("player.setInvisible")}
          showNoClip={supports("player.setNoClip")}
        />
      </Stack>

      {selectedPlayers.length > 0 ? (
        <Box
          bottom="var(--mantine-spacing-md)"
          left="var(--mantine-spacing-md)"
          pos="absolute"
          right="var(--mantine-spacing-md)"
          style={{
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <PlayerBulkActions
            build={gameBuild}
            onAddXp={(targets) =>
              setAddXpDialog({ opened: true, players: targets })
            }
            onGiveItems={(targets) =>
              setGiveItemsDialog({ opened: true, players: targets })
            }
            onSpawnVehicle={(targets) =>
              setSpawnVehicleDialog({ opened: true, players: targets })
            }
            onBan={(targets) =>
              setBanDialog({ opened: true, players: targets })
            }
            onClear={clearSelection}
            onCreateHorde={(targets) =>
              setEventDialog({
                event: "horde",
                opened: true,
                players: targets,
              })
            }
            onGodModeChange={(targets, enabled) =>
              void handleGodModeChange(targets, enabled)
            }
            onInvisibleChange={(targets, enabled) =>
              void handleInvisibleChange(targets, enabled)
            }
            onNoClipChange={(targets, enabled) =>
              void handleNoClipChange(targets, enabled)
            }
            onKick={(targets) =>
              setKickDialog({ opened: true, players: targets })
            }
            onLightning={(targets) =>
              setEventDialog({
                event: "lightning",
                opened: true,
                players: targets,
              })
            }
            onRemoveFromWhitelist={(targets) =>
              setWhitelistDialog({ opened: true, players: targets })
            }
            onSetAccessLevel={openAccessLevelDialog}
            onTeleport={(targets) =>
              setTeleportDialog({ opened: true, players: targets })
            }
            onThunder={(targets) =>
              setEventDialog({
                event: "thunder",
                opened: true,
                players: targets,
              })
            }
            onUnban={(targets) => void handleUnban(targets)}
            onVoiceBanChange={(targets, banned) =>
              void handleVoiceBanChange(targets, banned)
            }
            players={selectedPlayers}
            showInvisible={supports("player.setInvisible")}
            showNoClip={supports("player.setNoClip")}
          />
        </Box>
      ) : null}

      <SetAccessLevelModal
        build={gameBuild}
        opened={accessLevelDialog.opened}
        players={accessLevelDialog.players}
        onClose={closeAccessLevelDialog}
        onSetAccessLevel={handleAccessLevelChange}
      />

      <AddServerUserModal
        opened={addServerUserDialogOpened}
        onAdd={handleAddServerUser}
        onClose={() => setAddServerUserDialogOpened(false)}
      />

      <AddLocalPlayerModal
        opened={addLocalPlayerDialogOpened}
        onAdd={handleAddLocalPlayer}
        onClose={() => setAddLocalPlayerDialogOpened(false)}
      />

      <BanPlayerModal
        opened={banDialog.opened}
        players={banDialog.players}
        onBan={handleBan}
        onClose={() =>
          setBanDialog((current) => ({ ...current, opened: false }))
        }
      />

      <KickPlayerModal
        opened={kickDialog.opened}
        players={kickDialog.players}
        onClose={() =>
          setKickDialog((current) => ({ ...current, opened: false }))
        }
        onKick={handleKick}
      />

      <RemoveFromWhitelistModal
        opened={whitelistDialog.opened}
        players={whitelistDialog.players}
        onClose={() =>
          setWhitelistDialog((current) => ({ ...current, opened: false }))
        }
        onRemove={handleRemoveFromWhitelist}
      />

      <TeleportPlayerModal
        allPlayers={players}
        opened={teleportDialog.opened}
        players={teleportDialog.players}
        onClose={() =>
          setTeleportDialog((current) => ({ ...current, opened: false }))
        }
        onTeleportToCoordinates={handleTeleportToCoordinates}
        onTeleportToPlayer={handleTeleportToPlayer}
      />

      {spawnVehicleDialog.players.length > 0 ? (
        <SpawnVehicleModal
          build={gameBuild}
          onSpawn={handleSpawnVehicle}
          onClose={() =>
            setSpawnVehicleDialog((current) => ({ ...current, opened: false }))
          }
          opened={spawnVehicleDialog.opened}
          players={spawnVehicleDialog.players}
        />
      ) : null}

      {giveItemsDialog.players.length > 0 ? (
        <GiveItemsModal
          build={gameBuild}
          onClose={() =>
            setGiveItemsDialog((current) => ({ ...current, opened: false }))
          }
          onGive={handleGiveItems}
          opened={giveItemsDialog.opened}
          players={giveItemsDialog.players}
        />
      ) : null}

      {addXpDialog.players.length > 0 ? (
        <AddXpModal
          build={gameBuild}
          onAdd={handleAddXp}
          onClose={() =>
            setAddXpDialog((current) => ({ ...current, opened: false }))
          }
          opened={addXpDialog.opened}
          players={addXpDialog.players}
        />
      ) : null}

      <CreateHordeModal
        opened={eventDialog.opened && eventDialog.event === "horde"}
        players={eventDialog.players}
        onClose={() =>
          setEventDialog((current) => ({ ...current, opened: false }))
        }
        onCreate={handleCreateHorde}
      />

      <LightningPlayerModal
        opened={eventDialog.opened && eventDialog.event === "lightning"}
        players={eventDialog.players}
        onClose={() =>
          setEventDialog((current) => ({ ...current, opened: false }))
        }
        onLightning={handleLightning}
      />

      <ThunderPlayerModal
        opened={eventDialog.opened && eventDialog.event === "thunder"}
        players={eventDialog.players}
        onClose={() =>
          setEventDialog((current) => ({ ...current, opened: false }))
        }
        onThunder={handleThunder}
      />
    </PageContainer>
  );
}
