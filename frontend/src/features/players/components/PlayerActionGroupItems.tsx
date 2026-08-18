import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { usePlayerActions } from "../actions/PlayerActionsProvider";

interface PlayerActionGroupItemsProps {
  disabled?: boolean;
  players: Player[];
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
        {t("actionsMenu.addXp")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openGiveItems(players)}
      >
        {t("actionsMenu.addItem")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openSpawnVehicle(players)}
      >
        {t("actionsMenu.spawnVehicle")}
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
        {t("actionsMenu.createHorde")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openLightning(players)}
      >
        {t("actionsMenu.lightningStrike")}
      </Menu.Item>
      <Menu.Item
        disabled={disabled}
        onClick={() => actions.openThunder(players)}
      >
        {t("actionsMenu.thunderStrike")}
      </Menu.Item>
    </>
  );
}
