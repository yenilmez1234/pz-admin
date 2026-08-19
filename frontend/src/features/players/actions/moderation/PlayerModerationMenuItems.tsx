import { Box, Menu, Tooltip } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/SessionProvider";
import { isOnline } from "../../status";
import { usePlayerActions } from "../PlayerActionsProvider";
import { hasProtectedModerationRole } from "./availability";
import { SetPasswordMenuItem } from "./SetPasswordMenuItem";

interface PlayerModerationMenuItemsProps {
  mode: "bulk" | "single";
  players: Player[];
}

interface GuardedMenuItemProps {
  children: ReactNode;
  disabled: boolean;
  disabledReason: string;
  onClick: () => void;
}

function GuardedMenuItem({
  children,
  disabled,
  disabledReason,
  onClick,
}: GuardedMenuItemProps) {
  return (
    <Tooltip
      disabled={!disabled}
      label={disabledReason}
      position="right"
      withinPortal
    >
      <Box component="span" display="block">
        <Menu.Item disabled={disabled} onClick={onClick}>
          {children}
        </Menu.Item>
      </Box>
    </Tooltip>
  );
}

export function PlayerModerationMenuItems({
  mode,
  players,
}: PlayerModerationMenuItemsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();
  const { profile } = useSession();
  const build = profile?.version === "41" ? "41" : "42";
  const allOnline = players.every(isOnline);
  const hasProtectedPlayer = players.some((player) =>
    hasProtectedModerationRole(player, build),
  );
  const onlineOnlyMessage = t(
    mode === "bulk"
      ? "actions.bulk.onlineOnlyExplanation"
      : "actions.menu.onlineOnlyExplanation",
  );
  const protectedRoleMessage = t("actions.menu.protectedRoleExplanation");

  if (players.length === 0) return null;

  const player = players[0];
  const moderationProtected = hasProtectedModerationRole(player, build);
  const online = isOnline(player);

  return (
    <>
      <Menu.Item onClick={() => actions.openAccessLevel(players)}>
        {t("actions.labels.setAccessLevel")}
      </Menu.Item>
      <SetPasswordMenuItem players={players} />
      {mode === "single" ? (
        <>
          <GuardedMenuItem
            disabled={moderationProtected && player.banned !== true}
            disabledReason={protectedRoleMessage}
            onClick={() =>
              player.banned ? actions.unban(players) : actions.openBan(players)
            }
          >
            {player.banned
              ? t("actions.labels.unban")
              : t("actions.labels.ban")}
          </GuardedMenuItem>
          <GuardedMenuItem
            disabled={!online || moderationProtected}
            disabledReason={
              moderationProtected ? protectedRoleMessage : onlineOnlyMessage
            }
            onClick={() => actions.openKick(players)}
          >
            {t("actions.labels.kick")}
          </GuardedMenuItem>
          <GuardedMenuItem
            disabled={!online}
            disabledReason={onlineOnlyMessage}
            onClick={() =>
              actions.setVoiceBanned(players, player.voiceBanned !== true)
            }
          >
            {player.voiceBanned
              ? t("actions.labels.removeVoiceBan")
              : t("actions.labels.voiceBan")}
          </GuardedMenuItem>
        </>
      ) : (
        <>
          <GuardedMenuItem
            disabled={hasProtectedPlayer}
            disabledReason={protectedRoleMessage}
            onClick={() => actions.openBan(players)}
          >
            {t("actions.labels.ban")}
          </GuardedMenuItem>
          <Menu.Item onClick={() => actions.unban(players)}>
            {t("actions.labels.unban")}
          </Menu.Item>
          <GuardedMenuItem
            disabled={!allOnline || hasProtectedPlayer}
            disabledReason={
              hasProtectedPlayer ? protectedRoleMessage : onlineOnlyMessage
            }
            onClick={() => actions.openKick(players)}
          >
            {t("actions.labels.kick")}
          </GuardedMenuItem>
          <GuardedMenuItem
            disabled={!allOnline}
            disabledReason={onlineOnlyMessage}
            onClick={() => actions.setVoiceBanned(players, true)}
          >
            {t("actions.labels.voiceBan")}
          </GuardedMenuItem>
          <GuardedMenuItem
            disabled={!allOnline}
            disabledReason={onlineOnlyMessage}
            onClick={() => actions.setVoiceBanned(players, false)}
          >
            {t("actions.labels.removeVoiceBan")}
          </GuardedMenuItem>
        </>
      )}
      <Menu.Item onClick={() => actions.openRemoveFromWhitelist(players)}>
        {t("actions.labels.removeFromWhitelist")}
      </Menu.Item>
    </>
  );
}
