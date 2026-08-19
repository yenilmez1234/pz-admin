import { AddLocalUser, AddUser } from "@bindings/internal/player/service";
import i18n from "@/i18n";
import { runPlayerOperation } from "../runPlayerAction";

const t = i18n.getFixedT(null, "players");

export function addServerUser(username: string, password: string) {
  return runPlayerOperation({
    execute: () => AddUser(username, password),
    successTitle: t("notifications.addServerUser.successTitle"),
    successMessage: t("notifications.addServerUser.successMessage", {
      username,
    }),
    failureTitle: t("notifications.addServerUser.failureTitle"),
  });
}

export function addLocalPlayer(username: string) {
  return runPlayerOperation({
    execute: () => AddLocalUser(username),
    successTitle: t("notifications.addLocalPlayer.successTitle"),
    successMessage: t("notifications.addLocalPlayer.successMessage", {
      username,
    }),
    failureTitle: t("notifications.addLocalPlayer.failureTitle"),
  });
}
