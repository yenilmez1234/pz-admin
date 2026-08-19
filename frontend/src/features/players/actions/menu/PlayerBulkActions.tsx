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
import { isOnline } from "../../status";
import { usePlayerActions } from "../PlayerActionsProvider";
import { PlayerEventMenuItems } from "../events/PlayerEventMenuItems";
import { PlayerGiveMenuItems } from "../give/PlayerGiveMenuItems";
import { PlayerModerationMenuItems } from "../moderation/PlayerModerationMenuItems";
import { BulkPlayerPowerMenuItems } from "../powers/PlayerPowerMenuItems";

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
  const allOnline = players.every(isOnline);
  const onlineOnlyMessage = t("actions.bulk.onlineOnlyExplanation");

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
              <PlayerModerationMenuItems mode="bulk" players={players} />
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          {allOnline ? (
            <>
              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{t("actions.groups.powers")}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  <BulkPlayerPowerMenuItems players={players} />
                </Menu.Sub.Dropdown>
              </Menu.Sub>

              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{t("actions.groups.give")}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  <PlayerGiveMenuItems players={players} />
                </Menu.Sub.Dropdown>
              </Menu.Sub>

              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{t("actions.groups.events")}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  <PlayerEventMenuItems players={players} />
                </Menu.Sub.Dropdown>
              </Menu.Sub>
            </>
          ) : null}
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
