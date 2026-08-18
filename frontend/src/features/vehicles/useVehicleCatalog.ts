import { useCallback, useEffect, useState } from "react";
import type { GameBuild } from "@/features/game/types";
import { errorMessage } from "@/shared/lib/errors";
import { loadVehicleCatalog } from "./catalog";
import type { VehicleCatalog } from "./types";

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
  const [state, setState] = useState(initialState);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    let current = true;
    setState(initialState);

    loadVehicleCatalog(build).then(
      (loadedCatalog) => {
        if (current) {
          setState({ catalog: loadedCatalog, error: null, loading: false });
        }
      },
      (loadError: unknown) => {
        if (current) {
          setState({
            catalog: null,
            error: errorMessage(loadError),
            loading: false,
          });
        }
      },
    );

    return () => {
      current = false;
    };
  }, [build, revision]);

  if (state.catalog && state.catalog.build !== build) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}
