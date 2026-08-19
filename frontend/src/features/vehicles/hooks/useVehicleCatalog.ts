import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import { errorMessage } from "@/shared/lib/errors";
import { loadVehicleCatalog } from "../catalog";
import type { VehicleCatalog } from "../types";

interface VehicleCatalogState {
  catalog: VehicleCatalog | null;
  error: string | null;
  loading: boolean;
}

interface VehicleCatalogResult extends VehicleCatalogState {
  reload: () => void;
}

const initialState: VehicleCatalogState = {
  catalog: null,
  error: null,
  loading: true,
};

export function useVehicleCatalog(build: GameBuild): VehicleCatalogResult {
  const { i18n } = useTranslation();
  const language = canonicalLanguage(i18n.language);
  const [state, setState] = useState(initialState);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    let current = true;
    setState(initialState);

    async function loadCatalog() {
      try {
        const loadedCatalog = await loadVehicleCatalog(build, language);
        if (current) {
          setState({ catalog: loadedCatalog, error: null, loading: false });
        }
      } catch (loadError) {
        if (current) {
          setState({
            catalog: null,
            error: errorMessage(loadError),
            loading: false,
          });
        }
      }
    }

    void loadCatalog();

    return () => {
      current = false;
    };
  }, [build, language, revision]);

  if (
    state.catalog &&
    (state.catalog.build !== build || state.catalog.language !== language)
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}
