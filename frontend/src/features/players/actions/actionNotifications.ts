import type { ActionResult, Player } from "@bindings/internal/player/models";
import { notifications } from "@mantine/notifications";
import type { ParseKeys } from "i18next";
import i18n from "@/i18n";
import { rootErrorMessage } from "@/shared/lib/errors";

const t = i18n.getFixedT(null, "players");

type PlayerSuccessMessageKey = Extract<
  ParseKeys<"players">,
  `notifications.${string}.successMessage`
>;

interface ExecutePlayerActionOptions {
  execute: (playerIds: string[]) => PromiseLike<ActionResult>;
  successKey: PlayerSuccessMessageKey;
  successValues?: Record<string, unknown>;
  targets: Player[];
}

interface ExecutePlayerOperationOptions {
  execute: () => PromiseLike<void>;
  successKey: PlayerSuccessMessageKey;
  successValues?: Record<string, unknown>;
}

function showFailure(error: unknown) {
  notifications.show({
    color: "red",
    title: t("notifications.result.failureTitle"),
    message: t("notifications.result.failureMessage", {
      error: rootErrorMessage(error),
    }),
  });
}

export async function executePlayerOperation({
  execute,
  successKey,
  successValues,
}: ExecutePlayerOperationOptions) {
  try {
    await execute();
    notifications.show({
      title: t("notifications.result.successTitle"),
      message: t(successKey, successValues),
    });
    return true;
  } catch (operationError) {
    showFailure(operationError);
    return false;
  }
}

export async function executePlayerAction({
  execute,
  successKey,
  successValues,
  targets,
}: ExecutePlayerActionOptions) {
  try {
    const result = await execute(targets.map((player) => player.id));
    if (result.failed.length > 0) {
      const firstError = rootErrorMessage(result.failed[0].message);
      if (result.succeeded.length === 0) {
        showFailure(firstError);
      } else {
        notifications.show({
          color: "yellow",
          title: t("notifications.result.partialFailureTitle"),
          message: t("notifications.result.partialFailureMessage", {
            error: firstError,
            failedCount: result.failed.length,
            succeededCount: result.succeeded.length,
            totalCount: targets.length,
          }),
        });
      }
      return false;
    }

    notifications.show({
      title: t("notifications.result.successTitle"),
      message: t(successKey, {
        count: targets.length,
        username: targets[0]?.username,
        ...successValues,
      }),
    });
    return true;
  } catch (actionError) {
    showFailure(actionError);
    return false;
  }
}
