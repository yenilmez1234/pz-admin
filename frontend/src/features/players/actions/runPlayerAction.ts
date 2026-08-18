import { notifications } from "@mantine/notifications";
import type { ActionResult, Player } from "@bindings/internal/player/models";
import { rootErrorMessage } from "@/shared/lib/errors";

interface RunPlayerActionOptions {
  execute: (playerIds: string[]) => PromiseLike<ActionResult>;
  failureTitle: string;
  partialFailureMessage: (
    failedCount: number,
    targetCount: number,
    error: string,
  ) => string;
  partialFailureTitle: string;
  successMessage: (targets: Player[]) => string;
  successTitle: string;
  targets: Player[];
}

interface RunPlayerOperationOptions {
  execute: () => PromiseLike<void>;
  failureTitle: string;
  successMessage: string;
  successTitle: string;
}

export async function runPlayerOperation({
  execute,
  failureTitle,
  successMessage,
  successTitle,
}: RunPlayerOperationOptions) {
  try {
    await execute();
    notifications.show({ title: successTitle, message: successMessage });
    return true;
  } catch (operationError) {
    notifications.show({
      color: "red",
      title: failureTitle,
      message: rootErrorMessage(operationError),
    });
    return false;
  }
}

export async function runPlayerAction({
  execute,
  failureTitle,
  partialFailureMessage,
  partialFailureTitle,
  successMessage,
  successTitle,
  targets,
}: RunPlayerActionOptions) {
  try {
    const result = await execute(targets.map((player) => player.id));
    if (result.failed.length > 0) {
      const partial = result.succeeded.length > 0;
      notifications.show({
        color: partial ? "yellow" : "red",
        title: partial ? partialFailureTitle : failureTitle,
        message:
          !partial || targets.length === 1
            ? rootErrorMessage(result.failed[0].message)
            : partialFailureMessage(
                result.failed.length,
                targets.length,
                rootErrorMessage(result.failed[0].message),
              ),
      });
      return false;
    }

    notifications.show({
      title: successTitle,
      message: successMessage(targets),
    });
    return true;
  } catch (actionError) {
    notifications.show({
      color: "red",
      title: failureTitle,
      message: rootErrorMessage(actionError),
    });
    return false;
  }
}
