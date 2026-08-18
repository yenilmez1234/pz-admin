import type { Profile } from "@bindings/internal/profile/models";

export type SessionState =
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected";

export interface SessionData {
  features: ReadonlySet<string>;
  initializationError: string | null;
  profile: Profile | null;
  state: SessionState;
}

export const emptyFeatures: ReadonlySet<string> = new Set();

export const initialSessionData: SessionData = {
  features: emptyFeatures,
  initializationError: null,
  profile: null,
  state: "initializing",
};

export type SessionAction =
  | { type: "initializing"; profile?: Profile }
  | { type: "connecting"; profile: Profile }
  | { type: "connected"; features: string[]; profile: Profile }
  | { type: "disconnecting" }
  | { type: "disconnected" }
  | { type: "failed"; error: string; clearProfile?: boolean };

function assertNever(action: never): never {
  throw new Error(`Unknown session action: ${String(action)}`);
}

export function sessionReducer(
  current: SessionData,
  action: SessionAction,
): SessionData {
  switch (action.type) {
    case "initializing":
      return {
        ...current,
        initializationError: null,
        profile: action.profile ?? current.profile,
        state: "initializing",
      };
    case "connecting":
      return {
        features: emptyFeatures,
        initializationError: null,
        profile: action.profile,
        state: "connecting",
      };
    case "connected":
      return {
        features: new Set(action.features),
        initializationError: null,
        profile: action.profile,
        state: "connected",
      };
    case "disconnecting":
      return { ...current, state: "disconnecting" };
    case "disconnected":
      return { ...initialSessionData, state: "disconnected" };
    case "failed":
      return {
        features: emptyFeatures,
        initializationError: action.error,
        profile: action.clearProfile ? null : current.profile,
        state: "disconnected",
      };
    default:
      return assertNever(action);
  }
}
