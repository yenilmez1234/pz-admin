import { ActionIcon, Box, Menu, Tooltip } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/useSession";
import { isOnline } from "../lib/status";
import { hasProtectedModerationRole } from "../lib/table";
import { usePlayerActions } from "../actions/PlayerActionsProvider";
import {
  PlayerEventMenuItems,
  PlayerGiveMenuItems,
} from "./PlayerActionGroupItems";
import { PlayerModeMenuItems } from "./PlayerModeMenuItems";

interface PlayerActionsMenuProps {
  player: Player;
}

export function PlayerActionsMenu({ player }: PlayerActionsMenuProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();
  const { profile } = useSession();
  const build = profile?.version === "41" ? "41" : "42";
  const online = isOnline(player);
  const moderationProtected = hasProtectedModerationRole(player, build);
  const protectedRoleMessage = t("actionsMenu.protectedRoleExplanation");

  return (
    <Menu
      position="bottom-end"
      styles={{
        item: {
          padding:
            "calc(var(--mantine-spacing-xs) / 2) var(--mantine-spacing-xs)",
        },
      }}
      withinPortal
    >
      <Menu.Target>
        <ActionIcon
          aria-label={t("actionsMenu.accessibleLabel", {
            username: player.username,
          })}
          color="gray"
          radius="sm"
          size="sm"
          variant="subtle"
        >
          <IconDots size={18} aria-hidden="true" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {online ? (
          <Menu.Item onClick={() => actions.openTeleport([player])}>
            {t("actionsMenu.teleport")}
          </Menu.Item>
        ) : null}

        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item>{t("actionsMenu.moderation")}</Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item onClick={() => actions.openAccessLevel([player])}>
              {t("actionsMenu.setAccessLevel")}
            </Menu.Item>
            <Tooltip
              disabled={!moderationProtected || player.banned === true}
              label={protectedRoleMessage}
              position="right"
              withinPortal
            >
              <Box component="span" display="block">
                <Menu.Item
                  disabled={moderationProtected && player.banned !== true}
                  onClick={() =>
                    player.banned
                      ? actions.unban([player])
                      : actions.openBan([player])
                  }
                >
                  {player.banned
                    ? t("actionsMenu.unban")
                    : t("actionsMenu.ban")}
                </Menu.Item>
              </Box>
            </Tooltip>
            {online ? (
              <>
                <Tooltip
                  disabled={!moderationProtected}
                  label={protectedRoleMessage}
                  position="right"
                  withinPortal
                >
                  <Box component="span" display="block">
                    <Menu.Item
                      disabled={moderationProtected}
                      onClick={() => actions.openKick([player])}
                    >
                      {t("actionsMenu.kick")}
                    </Menu.Item>
                  </Box>
                </Tooltip>
                <Menu.Item
                  onClick={() =>
                    actions.setVoiceBanned(
                      [player],
                      player.voiceBanned !== true,
                    )
                  }
                >
                  {player.voiceBanned
                    ? t("actionsMenu.removeVoiceBan")
                    : t("actionsMenu.voiceBan")}
                </Menu.Item>
              </>
            ) : null}
            <Menu.Item
              onClick={() => actions.openRemoveFromWhitelist([player])}
            >
              {t("actionsMenu.removeFromWhitelist")}
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        {online ? (
          <>
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actionsMenu.powers")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerModeMenuItems player={player} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actionsMenu.give")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerGiveMenuItems players={[player]} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actionsMenu.events")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerEventMenuItems players={[player]} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}
