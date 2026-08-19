import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Player } from "@bindings/internal/player/models";
import { useSession } from "@/features/session/useSession";
import { usePlayerActions } from "../PlayerActionsProvider";

export function SetPasswordMenuItem({ players }: { players: Player[] }) {
  const { t } = useTranslation("players");
  const { supports } = useSession();
  const actions = usePlayerActions();

  if (!supports("player.setPassword")) return null;

  return (
    <Menu.Item onClick={() => actions.openSetPassword(players)}>
      {t("actions.labels.setPassword")}
    </Menu.Item>
  );
}
