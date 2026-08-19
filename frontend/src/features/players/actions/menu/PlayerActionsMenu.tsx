import { ActionIcon, Box, Menu, Tooltip } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/useSession";
import { isOnline } from "../../status";
import { hasProtectedModerationRole } from "../../table/table";
import { usePlayerActions } from "../PlayerActionsProvider";
import { PlayerEventMenuItems } from "../events/PlayerEventMenuItems";
import { PlayerGiveMenuItems } from "../give/PlayerGiveMenuItems";
import { SetPasswordMenuItem } from "../moderation/SetPasswordMenuItem";
import { PlayerPowerMenuItems } from "../powers/PlayerPowerMenuItems";

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
  const onlineOnlyMessage = t("actions.menu.onlineOnlyExplanation");
  const protectedRoleMessage = t("actions.menu.protectedRoleExplanation");

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
          aria-label={t("actions.menu.accessibleLabel", {
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
        <Tooltip
          disabled={online}
          label={onlineOnlyMessage}
          position="right"
          withinPortal
        >
          <Box component="span" display="block">
            <Menu.Item
              disabled={!online}
              onClick={() => actions.openTeleport([player])}
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
            <Menu.Item onClick={() => actions.openAccessLevel([player])}>
              {t("actions.labels.setAccessLevel")}
            </Menu.Item>
            <SetPasswordMenuItem players={[player]} />
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
                    ? t("actions.labels.unban")
                    : t("actions.labels.ban")}
                </Menu.Item>
              </Box>
            </Tooltip>
            <Tooltip
              disabled={online && !moderationProtected}
              label={
                moderationProtected ? protectedRoleMessage : onlineOnlyMessage
              }
              position="right"
              withinPortal
            >
              <Box component="span" display="block">
                <Menu.Item
                  disabled={!online || moderationProtected}
                  onClick={() => actions.openKick([player])}
                >
                  {t("actions.labels.kick")}
                </Menu.Item>
              </Box>
            </Tooltip>
            <Tooltip
              disabled={online}
              label={onlineOnlyMessage}
              position="right"
              withinPortal
            >
              <Box component="span" display="block">
                <Menu.Item
                  disabled={!online}
                  onClick={() =>
                    actions.setVoiceBanned(
                      [player],
                      player.voiceBanned !== true,
                    )
                  }
                >
                  {player.voiceBanned
                    ? t("actions.labels.removeVoiceBan")
                    : t("actions.labels.voiceBan")}
                </Menu.Item>
              </Box>
            </Tooltip>
            <Menu.Item
              onClick={() => actions.openRemoveFromWhitelist([player])}
            >
              {t("actions.labels.removeFromWhitelist")}
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        {online ? (
          <>
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.powers")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerPowerMenuItems player={player} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.give")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <PlayerGiveMenuItems players={[player]} />
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actions.groups.events")}</Menu.Sub.Item>
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
