import { createContext, useContext } from "react";
import type { Profile } from "@bindings/internal/profile/models";
import type { SessionState } from "./sessionState";

export interface SessionContextValue {
  connect: (profile: Profile) => Promise<void>;
  disconnect: () => Promise<void>;
  features: ReadonlySet<string>;
  initializationError: string | null;
  profile: Profile | null;
  retryInitialization: () => Promise<void>;
  state: SessionState;
  supports: (feature: string) => boolean;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
