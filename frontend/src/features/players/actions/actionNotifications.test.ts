import { afterEach, describe, expect, it, vi } from "vitest";
import { notifications } from "@mantine/notifications";
import {
  ActionFailure,
  ActionResult,
  Player,
} from "@bindings/internal/player/models";
import {
  executePlayerAction,
  executePlayerOperation,
} from "./actionNotifications";

const { getFixedT, translate } = vi.hoisted(() => {
  const translationFunction = vi.fn((key: string) => `translated:${key}`);
  return {
    getFixedT: vi.fn((language: unknown, namespace: unknown) => {
      if (language !== null || namespace !== "players") {
        throw new Error("Expected the players translation namespace");
      }
      return translationFunction;
    }),
    translate: translationFunction,
  };
});

vi.mock("@/i18n", () => ({
  default: { getFixedT },
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

const players = [
  new Player({ id: "alpha", username: "Alice" }),
  new Player({ id: "bravo", username: "Bob" }),
];

afterEach(() => {
  vi.clearAllMocks();
});

describe("executePlayerAction", () => {
  it("forwards target IDs and reports a full success", async () => {
    const execute = vi.fn(async (_playerIds: string[]) =>
      Promise.resolve(
        new ActionResult({ succeeded: [players[0].id, players[1].id] }),
      ),
    );

    const succeeded = await executePlayerAction({
      execute,
      successKey: "notifications.spawnVehicle.successMessage",
      successValues: { vehicle: "Ambulance" },
      targets: players,
    });

    expect(succeeded).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith([players[0].id, players[1].id]);
    expect(translate).toHaveBeenCalledWith(
      "notifications.spawnVehicle.successMessage",
      {
        count: players.length,
        username: players[0].username,
        vehicle: "Ambulance",
      },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      title: "translated:notifications.result.successTitle",
      message: "translated:notifications.spawnVehicle.successMessage",
    });
  });

  it("reports a partial structured failure with result counts", async () => {
    const execute = vi.fn(async (_playerIds: string[]) =>
      Promise.resolve(
        new ActionResult({
          failed: [
            new ActionFailure({
              message: "rcon: permission denied",
              playerId: players[1].id,
            }),
          ],
          succeeded: [players[0].id],
        }),
      ),
    );

    const succeeded = await executePlayerAction({
      execute,
      successKey: "notifications.kick.successMessage",
      targets: players,
    });

    expect(succeeded).toBe(false);
    expect(translate).toHaveBeenCalledWith(
      "notifications.result.partialFailureMessage",
      {
        error: "permission denied",
        failedCount: 1,
        succeededCount: 1,
        totalCount: 2,
      },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      color: "yellow",
      title: "translated:notifications.result.partialFailureTitle",
      message: "translated:notifications.result.partialFailureMessage",
    });
  });

  it("returns false and reports a thrown action error", async () => {
    const execute = vi.fn(async (_playerIds: string[]) =>
      Promise.reject(new Error("transport: connection lost")),
    );

    const succeeded = await executePlayerAction({
      execute,
      successKey: "notifications.kick.successMessage",
      targets: players,
    });

    expect(succeeded).toBe(false);
    expect(execute).toHaveBeenCalledWith([players[0].id, players[1].id]);
    expect(translate).toHaveBeenCalledWith(
      "notifications.result.failureMessage",
      { error: "connection lost" },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      color: "red",
      title: "translated:notifications.result.failureTitle",
      message: "translated:notifications.result.failureMessage",
    });
  });
});

describe("executePlayerOperation", () => {
  it("reports success with operation-specific values", async () => {
    const execute = vi.fn(async () => Promise.resolve());

    const succeeded = await executePlayerOperation({
      execute,
      successKey: "notifications.addServerUser.successMessage",
      successValues: { username: "Carol" },
    });

    expect(succeeded).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith();
    expect(translate).toHaveBeenCalledWith(
      "notifications.addServerUser.successMessage",
      { username: "Carol" },
    );
    expect(notifications.show).toHaveBeenCalledOnce();
    expect(notifications.show).toHaveBeenCalledWith({
      title: "translated:notifications.result.successTitle",
      message: "translated:notifications.addServerUser.successMessage",
    });
  });
});
