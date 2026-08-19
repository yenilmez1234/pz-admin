import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/useSession";
import { usePlayerActions } from "../actions/PlayerActionsProvider";

interface PlayerActionGroupItemsProps {
  disabled?: boolean;
  players: Player[];
}

export function PlayerAccountMenuItems({
  disabled = false,
  players,
}: PlayerActionGroupItemsProps) {
  const { t } = useTranslation("players");
  const { supports } = useSession();
  const actions = usePlayerActions();

  if (!supports("player.setPassword")) return null;

  return (
    <Menu.Item
      disabled={disabled}
      onClick={() => actions.openSetPassword(players)}
    >
      {t("actions.labels.setPassword")}
    </Menu.Item>
  );
}

export function PlayerGiveMenuItems({
  disabled = false,
  players,
}: PlayerActionGroupItemsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();

  return (
    <>
      <Menu.Item disabled={disabled} onClick={() => actions.openAddXp(players)}>
        {t("actions.labels.addXp")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openGiveItems(players)}
      >
        {t("actions.labels.addItem")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openSpawnVehicle(players)}
      >
        {t("actions.labels.spawnVehicle")}
      </Menu.Item>
    </>
  );
}

export function PlayerEventMenuItems({
  disabled = false,
  players,
}: PlayerActionGroupItemsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();

  return (
    <>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openCreateHorde(players)}
      >
        {t("actions.labels.createHorde")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openLightning(players)}
      >
        {t("actions.labels.lightningStrike")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openThunder(players)}
      >
        {t("actions.labels.thunderStrike")}
      </Menu.Item>
    </>
  );
}
