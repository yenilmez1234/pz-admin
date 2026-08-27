import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { usePlayerActions } from "../PlayerActionsProvider";

interface PlayerGiveMenuItemsProps {
  players: Player[];
}

export function PlayerGiveMenuItems({ players }: PlayerGiveMenuItemsProps) {
  const { t } = useTranslation("players");
  const actions = usePlayerActions();

  return (
    <>
      <Menu.Item onClick={() => actions.openAddXp(players)}>
        {t("actions.labels.addXp")}
      </Menu.Item>
      <Menu.Item onClick={() => actions.openGiveItems(players)}>
        {t("actions.labels.addItem")}
      </Menu.Item>
      <Menu.Item onClick={() => actions.openSpawnVehicle(players)}>
        {t("actions.labels.spawnVehicle")}
      </Menu.Item>
    </>
  );
}
