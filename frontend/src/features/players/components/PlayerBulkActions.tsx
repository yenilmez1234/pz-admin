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
import { useSession } from "@/features/session/useSession";
import { usePlayerActions } from "../actions/PlayerActionsProvider";
import { isOnline } from "../lib/status";
import { hasProtectedModerationRole } from "../lib/table";
import { BulkPlayerModeMenuItems } from "./PlayerModeMenuItems";
import {
  PlayerEventMenuItems,
  PlayerGiveMenuItems,
} from "./PlayerActionGroupItems";

interface PlayerBulkActionsProps {
  onClear: () => void;
  players: Player[];
}

export function PlayerBulkActions({
  onClear,
  players,
}: PlayerBulkActionsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();
  const { profile } = useSession();
  const build = profile?.version === "41" ? "41" : "42";
  const allOnline = players.every(isOnline);
  const hasProtectedPlayer = players.some((player) =>
    hasProtectedModerationRole(player, build),
  );
  const onlineOnlyMessage = t("actions.bulk.onlineOnlyExplanation");
  const protectedRoleMessage = t("actions.menu.protectedRoleExplanation");

  return (
    <Paper
      component={Group}
      aria-label={t("actions.bulk.accessibleLabel")}
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
        {t("actions.bulk.selectedCount", { count: players.length })}
      </Text>

      <Menu position="top" withinPortal>
        <Menu.Target>
          <Button
            rightSection={<IconChevronDown size={14} aria-hidden="true" />}
            size="xs"
            variant="default"
          >
            {t("actions.bulk.actionsButton")}
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
                onClick={() => actions.openTeleport(players)}
              >
                {t("actions.labels.teleport")}
              </Menu.Item>
            </Box>
          </Tooltip>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item>{t("actions.groups.moderation")}</Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <Menu.Item onClick={() => actions.openAccessLevel(players)}>
                {t("actions.labels.setAccessLevel")}
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
                    onClick={() => actions.openBan(players)}
                  >
                    {t("actions.labels.ban")}
                  </Menu.Item>
                </Box>
              </Tooltip>
              <Menu.Item onClick={() => actions.unban(players)}>
                {t("actions.labels.unban")}
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
                    onClick={() => actions.openKick(players)}
                  >
                    {t("actions.labels.kick")}
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
                    onClick={() => actions.setVoiceBanned(players, true)}
                  >
                    {t("actions.labels.voiceBan")}
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
                    onClick={() => actions.setVoiceBanned(players, false)}
                  >
                    {t("actions.labels.removeVoiceBan")}
                  </Menu.Item>
                </Box>
              </Tooltip>
              <Menu.Item
                onClick={() => actions.openRemoveFromWhitelist(players)}
              >
                {t("actions.labels.removeFromWhitelist")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item disabled={!allOnline}>
                {t("actions.groups.powers")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <BulkPlayerModeMenuItems
                disabled={!allOnline}
                players={players}
              />
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item disabled={!allOnline}>
                {t("actions.groups.give")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <PlayerGiveMenuItems disabled={!allOnline} players={players} />
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item disabled={!allOnline}>
                {t("actions.groups.events")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              <PlayerEventMenuItems disabled={!allOnline} players={players} />
            </Menu.Sub.Dropdown>
          </Menu.Sub>
        </Menu.Dropdown>
      </Menu>

      <ActionIcon
        aria-label={t("actions.bulk.clearSelectionLabel")}
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
