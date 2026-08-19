import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { Events } from "@wailsio/runtime";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { State as ConnectionState } from "@bindings/internal/connection/models";
import type { Profile } from "@bindings/internal/profile/models";
import {
  Connect,
  Disconnect,
  Features as CurrentFeatures,
} from "@bindings/internal/session/service";
import { errorMessage } from "@/shared/lib/errors";
import { sessionSnapshot } from "./lib/sessionSnapshot";
import {
  initialSessionData,
  sessionReducer,
  type SessionState,
} from "./lib/sessionState";

interface SessionContextValue {
  connect: (profile: Profile) => Promise<void>;
  disconnect: () => Promise<void>;
  features: ReadonlySet<string>;
  initializationError: string | null;
  profile: Profile | null;
  retryInitialization: () => Promise<void>;
  state: SessionState;
  supports: (feature: string) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { t } = useTranslation("session");
  const [{ features, initializationError, profile, state }, dispatch] =
    useReducer(sessionReducer, initialSessionData);
  // Async snapshots must not overwrite a newer connection lifecycle event.
  const eventRevision = useRef(0);
  const disconnectRequested = useRef(false);

  const synchronize = useCallback(async () => {
    const revision = eventRevision.current;
    dispatch({ type: "initializing" });

    try {
      const [backendState, [currentProfile, hasProfile], currentFeatures] =
        await sessionSnapshot();
      if (eventRevision.current !== revision) return;

      if (backendState === ConnectionState.StateConnected && hasProfile) {
        dispatch({
          type: "connected",
          features: currentFeatures,
          profile: currentProfile,
        });
      } else if (backendState === ConnectionState.StateDisconnected) {
        dispatch({ type: "disconnected" });
      } else {
        dispatch({
          type: "failed",
          clearProfile: true,
          error: t("unknownStateError"),
        });
      }
    } catch (loadError) {
      if (eventRevision.current !== revision) return;
      dispatch({ type: "failed", error: errorMessage(loadError) });
    }
  }, [t]);

  useEffect(() => {
    const markEvent = () => {
      eventRevision.current += 1;
    };

    const unsubscribeConnected = Events.On(
      "session:connected",
      ({ data: connectedProfile }) => {
        markEvent();
        const revision = eventRevision.current;
        dispatch({ type: "initializing", profile: connectedProfile });

        async function loadFeatures() {
          try {
            const currentFeatures = await CurrentFeatures();
            if (eventRevision.current !== revision) return;
            dispatch({
              type: "connected",
              features: currentFeatures,
              profile: connectedProfile,
            });
          } catch (loadError) {
            if (eventRevision.current !== revision) return;
            dispatch({ type: "failed", error: errorMessage(loadError) });
          }
        }

        void loadFeatures();
      },
    );
    const unsubscribeDisconnected = Events.On("session:disconnected", () => {
      markEvent();
      dispatch({ type: "disconnected" });
      if (!disconnectRequested.current) {
        notifications.show({
          color: "red",
          title: t("connectionLostTitle"),
          message: t("connectionLostMessage"),
        });
      }
    });

    void synchronize();

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, [synchronize, t]);

  const connect = useCallback(
    async (nextProfile: Profile) => {
      eventRevision.current += 1;
      dispatch({ type: "connecting", profile: nextProfile });

      try {
        await Connect(nextProfile.id);
      } catch (connectionError) {
        // Re-sync from the backend instead of painting "disconnected"
        // locally: a failed Connect may leave a live session behind
        // (e.g. "session: already connected"), and painting the UI
        // without it desyncs the frontend from the backend.
        await synchronize();
        throw connectionError;
      }
    },
    [synchronize],
  );

  const disconnect = useCallback(async () => {
    eventRevision.current += 1;
    disconnectRequested.current = true;
    dispatch({ type: "disconnecting" });

    try {
      await Disconnect();
      dispatch({ type: "disconnected" });
    } catch (disconnectError) {
      await synchronize();
      throw disconnectError;
    } finally {
      disconnectRequested.current = false;
    }
  }, [synchronize]);

  const supports = useCallback(
    (feature: string) => features.has(feature),
    [features],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      connect,
      disconnect,
      features,
      initializationError,
      profile,
      retryInitialization: synchronize,
      state,
      supports,
    }),
    [
      connect,
      disconnect,
      features,
      initializationError,
      profile,
      state,
      supports,
      synchronize,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
