import { describe, expect, it } from "vitest";
import { Type as ConnectionType } from "@bindings/internal/connection/models";
import { ID as FeatureID } from "@bindings/internal/feature/models";
import { Profile } from "@bindings/internal/profile/models";
import { Snapshot } from "@bindings/internal/session/models";
import { initialSessionData, sessionReducer } from "./sessionState";

const firstProfile = new Profile({
  id: "first",
  name: "First server",
  connectionType: ConnectionType.TypeRCON,
  host: "127.0.0.1",
  port: 27015,
  version: "42",
});

const secondProfile = new Profile({
  connectionType: firstProfile.connectionType,
  host: firstProfile.host,
  id: "second",
  name: "Second server",
  port: firstProfile.port,
  version: firstProfile.version,
});

const features = [FeatureID.ConsoleExecuteCommand, FeatureID.PlayerList];

function connectedSnapshot(): Snapshot {
  return new Snapshot({
    connected: true,
    features,
    profile: secondProfile,
  });
}

describe("sessionReducer", () => {
  it("starts a connection with the selected profile and clears stale data", () => {
    const staleState = sessionReducer(initialSessionData, {
      type: "failed",
      error: "Previous failure",
    });

    const next = sessionReducer(staleState, {
      type: "connecting",
      profile: firstProfile,
    });

    expect(next).toMatchObject({
      initializationError: null,
      profile: firstProfile,
      state: "connecting",
    });
    expect(next.features).toEqual(new Set());
  });

  it("adopts the authoritative profile and features when connected", () => {
    const connecting = sessionReducer(initialSessionData, {
      type: "connecting",
      profile: firstProfile,
    });

    const next = sessionReducer(connecting, {
      type: "connected",
      snapshot: connectedSnapshot(),
    });

    expect(next).toMatchObject({
      initializationError: null,
      profile: secondProfile,
      state: "connected",
    });
    expect(next.features).toEqual(new Set(features));
  });

  it.each([
    ["initializing", "initializing"],
    ["disconnecting", "disconnecting"],
  ] as const)(
    "moves to %s without discarding the active session data",
    (actionType, expectedState) => {
      const connected = sessionReducer(initialSessionData, {
        type: "connected",
        snapshot: connectedSnapshot(),
      });

      const next = sessionReducer(connected, { type: actionType });

      expect(next.state).toBe(expectedState);
      expect(next.profile).toEqual(secondProfile);
      expect(next.features).toEqual(connected.features);
      expect(next.initializationError).toBeNull();
    },
  );

  it("resets all session data after disconnecting", () => {
    const connected = sessionReducer(initialSessionData, {
      type: "connected",
      snapshot: connectedSnapshot(),
    });

    expect(sessionReducer(connected, { type: "disconnected" })).toEqual({
      features: new Set(),
      initializationError: null,
      profile: null,
      state: "disconnected",
    });
  });

  it.each([
    { clearProfile: undefined, expectedProfile: firstProfile },
    { clearProfile: false, expectedProfile: firstProfile },
    { clearProfile: true, expectedProfile: null },
  ])(
    "records a failure and handles clearProfile=$clearProfile",
    ({ clearProfile, expectedProfile }) => {
      const connecting = sessionReducer(initialSessionData, {
        type: "connecting",
        profile: firstProfile,
      });

      const next = sessionReducer(connecting, {
        type: "failed",
        error: "Connection refused",
        clearProfile,
      });

      expect(next).toEqual({
        features: new Set(),
        initializationError: "Connection refused",
        profile: expectedProfile,
        state: "disconnected",
      });
    },
  );
});
