import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  Profile as CurrentProfile,
  State as CurrentState,
} from "@bindings/internal/session/service";
import { errorMessage } from "@/utils/errors";

export type SessionState =
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected";

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

interface SessionProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const emptyFeatures: ReadonlySet<string> = new Set();
let sessionSnapshotRequest: ReturnType<typeof loadSessionSnapshot> | null =
  null;

function loadSessionSnapshot() {
  return Promise.all([CurrentState(), CurrentProfile(), CurrentFeatures()]);
}

function sessionSnapshot() {
  if (sessionSnapshotRequest) return sessionSnapshotRequest;

  const request = loadSessionSnapshot();
  sessionSnapshotRequest = request;
  const clearRequest = () => {
    if (sessionSnapshotRequest === request) sessionSnapshotRequest = null;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { t } = useTranslation("servers");
  const [state, setState] = useState<SessionState>("initializing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [features, setFeatures] = useState<ReadonlySet<string>>(emptyFeatures);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const eventRevision = useRef(0);
  const disconnectRequested = useRef(false);

  const synchronize = useCallback(async () => {
    const revision = eventRevision.current;
    setInitializationError(null);
    setState("initializing");

    try {
      const [backendState, [currentProfile, hasProfile], currentFeatures] =
        await sessionSnapshot();
      if (eventRevision.current !== revision) return;

      if (backendState === ConnectionState.StateConnected && hasProfile) {
        setProfile(currentProfile);
        setFeatures(new Set(currentFeatures));
        setState("connected");
      } else if (backendState === ConnectionState.StateDisconnected) {
        setProfile(null);
        setFeatures(emptyFeatures);
        setState("disconnected");
      } else {
        setProfile(null);
        setFeatures(emptyFeatures);
        setInitializationError(t("session.unknownStateError"));
        setState("disconnected");
      }
    } catch (loadError) {
      if (eventRevision.current !== revision) return;
      setFeatures(emptyFeatures);
      setInitializationError(errorMessage(loadError));
      setState("disconnected");
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
        setProfile(connectedProfile);
        setInitializationError(null);
        setState("initializing");

        void CurrentFeatures().then(
          (currentFeatures) => {
            if (eventRevision.current !== revision) return;
            setFeatures(new Set(currentFeatures));
            setState("connected");
          },
          (loadError: unknown) => {
            if (eventRevision.current !== revision) return;
            setFeatures(emptyFeatures);
            setInitializationError(errorMessage(loadError));
            setState("disconnected");
          },
        );
      },
    );
    const unsubscribeDisconnected = Events.On("session:disconnected", () => {
      markEvent();
      setProfile(null);
      setFeatures(emptyFeatures);
      setState("disconnected");
      if (!disconnectRequested.current) {
        notifications.show({
          color: "red",
          title: t("session.connectionLostTitle"),
          message: t("session.connectionLostMessage"),
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
      setInitializationError(null);
      setFeatures(emptyFeatures);
      setProfile(nextProfile);
      setState("connecting");

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
    setState("disconnecting");

    try {
      await Disconnect();
      setProfile(null);
      setFeatures(emptyFeatures);
      setState("disconnected");
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

  const value = useMemo(
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
