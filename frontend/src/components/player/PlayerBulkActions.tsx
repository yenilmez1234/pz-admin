import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { isOnline } from "@/features/players/status";
import { hasProtectedModerationRole } from "./playerTable";

interface PlayerBulkActionsProps {
  build: GameBuild;
  onAddXp: (players: Player[]) => void;
  onGiveItems: (players: Player[]) => void;
  onSpawnVehicle: (players: Player[]) => void;
  onBan: (players: Player[]) => void;
  onClear: () => void;
  onCreateHorde: (players: Player[]) => void;
  onGodModeChange: (players: Player[], enabled: boolean) => void;
  onInvisibleChange: (players: Player[], enabled: boolean) => void;
  onNoClipChange: (players: Player[], enabled: boolean) => void;
  onKick: (players: Player[]) => void;
  onLightning: (players: Player[]) => void;
  onRemoveFromWhitelist: (players: Player[]) => void;
  onSetAccessLevel: (players: Player[]) => void;
  onTeleport: (players: Player[]) => void;
  onThunder: (players: Player[]) => void;
  onUnban: (players: Player[]) => void;
  onVoiceBanChange: (players: Player[], banned: boolean) => void;
  players: Player[];
  showInvisible: boolean;
  showNoClip: boolean;
}

export function PlayerBulkActions({
  build,
  onAddXp,
  onGiveItems,
  onSpawnVehicle,
  onBan,
  onClear,
  onCreateHorde,
  onGodModeChange,
  onInvisibleChange,
  onNoClipChange,
  onKick,
  onLightning,
  onRemoveFromWhitelist,
  onSetAccessLevel,
  onTeleport,
  onThunder,
  onUnban,
  onVoiceBanChange,
  players,
  showInvisible,
  showNoClip,
}: PlayerBulkActionsProps) {
  const { t } = useTranslation("players");
  const allOnline = players.every(isOnline);
  const hasProtectedPlayer = players.some((player) =>
    hasProtectedModerationRole(player, build),
  );
  const onlineOnlyMessage = t("bulkActions.onlineOnlyExplanation");
  const protectedRoleMessage = t("actionsMenu.protectedRoleExplanation");

  return (
    <Paper
      component={Group}
      aria-label={t("bulkActions.accessibleLabel")}
      gap="sm"
      maw="100%"
      px="md"
      py="xs"
      radius="md"
      role="toolbar"
      shadow="md"
      style={{ pointerEvents: "auto", width: "fit-content" }}
      withBorder
      wrap="nowrap"
    >
      <Text
        aria-live="polite"
        fw={600}
        size="sm"
        style={{ whiteSpace: "nowrap" }}
      >
        {t("bulkActions.selectedCount", { count: players.length })}
      </Text>

      <Menu position="top" withinPortal>
        <Menu.Target>
          <Button
            rightSection={<IconChevronDown size={14} aria-hidden="true" />}
            size="xs"
            variant="default"
          >
            {t("bulkActions.actionsButton")}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Tooltip
            disabled={allOnline}
            label={onlineOnlyMessage}
            position="right"
            withinPortal
          >
            <Box component="span" display="block">
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onTeleport(players)}
              >
                {t("actionsMenu.teleport")}
              </Menu.Item>
            </Box>
          </Tooltip>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item>{t("actionsMenu.moderation")}</Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <Menu.Item onClick={() => onSetAccessLevel(players)}>
                {t("actionsMenu.setAccessLevel")}
              </Menu.Item>
              <Tooltip
                disabled={!hasProtectedPlayer}
                label={protectedRoleMessage}
                position="right"
                withinPortal
              >
                <Box component="span" display="block">
                  <Menu.Item
                    disabled={hasProtectedPlayer}
                    onClick={() => onBan(players)}
                  >
                    {t("actionsMenu.ban")}
                  </Menu.Item>
                </Box>
              </Tooltip>
              <Menu.Item onClick={() => onUnban(players)}>
                {t("actionsMenu.unban")}
              </Menu.Item>
              <Tooltip
                disabled={allOnline && !hasProtectedPlayer}
                label={
                  hasProtectedPlayer ? protectedRoleMessage : onlineOnlyMessage
                }
                position="right"
                withinPortal
              >
                <Box component="span" display="block">
                  <Menu.Item
                    disabled={!allOnline || hasProtectedPlayer}
                    onClick={() => onKick(players)}
                  >
                    {t("actionsMenu.kick")}
                  </Menu.Item>
                </Box>
              </Tooltip>
              <Tooltip
                disabled={allOnline}
                label={onlineOnlyMessage}
                position="right"
                withinPortal
              >
                <Box component="span" display="block">
                  <Menu.Item
                    disabled={!allOnline}
                    onClick={() => onVoiceBanChange(players, true)}
                  >
                    {t("actionsMenu.voiceBan")}
                  </Menu.Item>
                </Box>
              </Tooltip>
              <Tooltip
                disabled={allOnline}
                label={onlineOnlyMessage}
                position="right"
                withinPortal
              >
                <Box component="span" display="block">
                  <Menu.Item
                    disabled={!allOnline}
                    onClick={() => onVoiceBanChange(players, false)}
                  >
                    {t("actionsMenu.removeVoiceBan")}
                  </Menu.Item>
                </Box>
              </Tooltip>
              <Menu.Item onClick={() => onRemoveFromWhitelist(players)}>
                {t("actionsMenu.removeFromWhitelist")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item disabled={!allOnline}>
                {t("actionsMenu.powers")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              {showInvisible ? (
                <>
                  <Menu.Item
                    disabled={!allOnline}
                    onClick={() => onInvisibleChange(players, true)}
                  >
                    {t("actionsMenu.enableInvisible")}
                  </Menu.Item>
                  <Menu.Item
                    disabled={!allOnline}
                    onClick={() => onInvisibleChange(players, false)}
                  >
                    {t("actionsMenu.disableInvisible")}
                  </Menu.Item>
                </>
              ) : null}
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onGodModeChange(players, true)}
              >
                {t("actionsMenu.enableGodMode")}
              </Menu.Item>
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onGodModeChange(players, false)}
              >
                {t("actionsMenu.disableGodMode")}
              </Menu.Item>
              {showNoClip ? (
                <>
                  <Menu.Item
                    disabled={!allOnline}
                    onClick={() => onNoClipChange(players, true)}
                  >
                    {t("actionsMenu.enableNoClip")}
                  </Menu.Item>
                  <Menu.Item
                    disabled={!allOnline}
                    onClick={() => onNoClipChange(players, false)}
                  >
                    {t("actionsMenu.disableNoClip")}
                  </Menu.Item>
                </>
              ) : null}
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item disabled={!allOnline}>
                {t("actionsMenu.give")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <Menu.Item disabled={!allOnline} onClick={() => onAddXp(players)}>
                {t("actionsMenu.addXp")}
              </Menu.Item>
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onGiveItems(players)}
              >
                {t("actionsMenu.addItem")}
              </Menu.Item>
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onSpawnVehicle(players)}
              >
                {t("actionsMenu.spawnVehicle")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item disabled={!allOnline}>
                {t("actionsMenu.events")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onCreateHorde(players)}
              >
                {t("actionsMenu.createHorde")}
              </Menu.Item>
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onLightning(players)}
              >
                {t("actionsMenu.lightningStrike")}
              </Menu.Item>
              <Menu.Item
                disabled={!allOnline}
                onClick={() => onThunder(players)}
              >
                {t("actionsMenu.thunderStrike")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>
        </Menu.Dropdown>
      </Menu>

      <ActionIcon
        aria-label={t("bulkActions.clearSelectionLabel")}
        color="gray"
        onClick={onClear}
        size="sm"
        variant="subtle"
      >
        <IconX size={16} aria-hidden="true" />
      </ActionIcon>
    </Paper>
  );
}
