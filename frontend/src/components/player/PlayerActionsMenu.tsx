import { ActionIcon, Box, Menu, Tooltip, VisuallyHidden } from "@mantine/core";
import {
  IconCheck,
  IconDots,
  IconQuestionMark,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import type { GameBuild } from "@/features/game/types";
import { isOnline } from "@/features/players/status";
import { hasProtectedModerationRole } from "./playerTable";

interface PlayerActionsMenuProps {
  build: GameBuild;
  onAddXp: (players: Player[]) => void;
  onGiveItems: (players: Player[]) => void;
  onSpawnVehicle: (players: Player[]) => void;
  onBan: (players: Player[]) => void;
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
  player: Player;
  showInvisible: boolean;
  showNoClip: boolean;
}

export function PlayerActionsMenu({
  build,
  onAddXp,
  onGiveItems,
  onSpawnVehicle,
  onBan,
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
  player,
  showInvisible,
  showNoClip,
}: PlayerActionsMenuProps) {
  const { t } = useTranslation("players");
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
          <Menu.Item onClick={() => onTeleport([player])}>
            {t("actionsMenu.teleport")}
          </Menu.Item>
        ) : null}

        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item>{t("actionsMenu.moderation")}</Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item onClick={() => onSetAccessLevel([player])}>
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
                    player.banned ? onUnban([player]) : onBan([player])
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
                      onClick={() => onKick([player])}
                    >
                      {t("actionsMenu.kick")}
                    </Menu.Item>
                  </Box>
                </Tooltip>
                <Menu.Item
                  onClick={() =>
                    onVoiceBanChange([player], player.voiceBanned !== true)
                  }
                >
                  {player.voiceBanned
                    ? t("actionsMenu.removeVoiceBan")
                    : t("actionsMenu.voiceBan")}
                </Menu.Item>
              </>
            ) : null}
            <Menu.Item onClick={() => onRemoveFromWhitelist([player])}>
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
                {showInvisible ? (
                  <Menu.Item
                    onClick={() =>
                      onInvisibleChange([player], player.invisible !== true)
                    }
                    rightSection={
                      player.invisible === true ? (
                        <IconCheck size={14} aria-hidden="true" />
                      ) : player.invisible === false ? (
                        <IconX size={14} aria-hidden="true" />
                      ) : (
                        <IconQuestionMark size={14} aria-hidden="true" />
                      )
                    }
                  >
                    {t("actionsMenu.invisible")}
                    <VisuallyHidden>
                      {" "}
                      {player.invisible === true
                        ? t("actionsMenu.invisibleEnabledState")
                        : player.invisible === false
                          ? t("actionsMenu.invisibleDisabledState")
                          : t("actionsMenu.invisibleUnknownState")}
                    </VisuallyHidden>
                  </Menu.Item>
                ) : null}
                <Menu.Item
                  onClick={() =>
                    onGodModeChange([player], player.godMode !== true)
                  }
                  rightSection={
                    player.godMode === true ? (
                      <IconCheck size={14} aria-hidden="true" />
                    ) : player.godMode === false ? (
                      <IconX size={14} aria-hidden="true" />
                    ) : (
                      <IconQuestionMark size={14} aria-hidden="true" />
                    )
                  }
                >
                  {t("actionsMenu.godMode")}
                  <VisuallyHidden>
                    {" "}
                    {player.godMode === true
                      ? t("actionsMenu.godModeEnabledState")
                      : player.godMode === false
                        ? t("actionsMenu.godModeDisabledState")
                        : t("actionsMenu.godModeUnknownState")}
                  </VisuallyHidden>
                </Menu.Item>
                {showNoClip ? (
                  <Menu.Item
                    onClick={() =>
                      onNoClipChange([player], player.noClip !== true)
                    }
                    rightSection={
                      player.noClip === true ? (
                        <IconCheck size={14} aria-hidden="true" />
                      ) : player.noClip === false ? (
                        <IconX size={14} aria-hidden="true" />
                      ) : (
                        <IconQuestionMark size={14} aria-hidden="true" />
                      )
                    }
                  >
                    {t("actionsMenu.noClip")}
                    <VisuallyHidden>
                      {" "}
                      {player.noClip === true
                        ? t("actionsMenu.noClipEnabledState")
                        : player.noClip === false
                          ? t("actionsMenu.noClipDisabledState")
                          : t("actionsMenu.noClipUnknownState")}
                    </VisuallyHidden>
                  </Menu.Item>
                ) : null}
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actionsMenu.give")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <Menu.Item onClick={() => onAddXp([player])}>
                  {t("actionsMenu.addXp")}
                </Menu.Item>
                <Menu.Item onClick={() => onGiveItems([player])}>
                  {t("actionsMenu.addItem")}
                </Menu.Item>
                <Menu.Item onClick={() => onSpawnVehicle([player])}>
                  {t("actionsMenu.spawnVehicle")}
                </Menu.Item>
              </Menu.Sub.Dropdown>
            </Menu.Sub>

            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{t("actionsMenu.events")}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <Menu.Item onClick={() => onCreateHorde([player])}>
                  {t("actionsMenu.createHorde")}
                </Menu.Item>
                <Menu.Item onClick={() => onLightning([player])}>
                  {t("actionsMenu.lightningStrike")}
                </Menu.Item>
                <Menu.Item onClick={() => onThunder([player])}>
                  {t("actionsMenu.thunderStrike")}
                </Menu.Item>
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}
