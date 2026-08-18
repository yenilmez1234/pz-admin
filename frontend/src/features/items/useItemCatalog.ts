import { useCallback, useEffect, useState } from "react";
import type { GameBuild } from "@/features/game/types";
import { errorMessage } from "@/utils/errors";
import { loadItemCatalog } from "./catalog";
import type { ItemCatalog } from "./types";

interface ItemCatalogState {
  catalog: ItemCatalog | null;
  error: string | null;
  loading: boolean;
}

interface ItemCatalogResult extends ItemCatalogState {
  reload: () => void;
}

const initialState: ItemCatalogState = {
  catalog: null,
  error: null,
  loading: true,
};

export function useItemCatalog(
  build: GameBuild,
  language: string,
): ItemCatalogResult {
  const [state, setState] = useState(initialState);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    let current = true;
    setState(initialState);

    loadItemCatalog(build, language).then(
      (catalog) => {
        if (current) {
          setState({ catalog, error: null, loading: false });
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
  }, [build, language, revision]);

  if (
    state.catalog &&
    (state.catalog.build !== build ||
      state.catalog.language !== Intl.getCanonicalLocales(language)[0])
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}
