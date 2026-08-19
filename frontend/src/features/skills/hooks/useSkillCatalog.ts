import { useCallback, useEffect, useState } from "react";
import type { GameBuild } from "@/features/game/types";
import { canonicalLanguage } from "@/i18n/locales";
import { errorMessage } from "@/shared/lib/errors";
import { loadSkillCatalog } from "../catalog";
import type { SkillCatalog } from "../types";

interface SkillCatalogState {
  catalog: SkillCatalog | null;
  error: string | null;
  loading: boolean;
}

interface SkillCatalogResult extends SkillCatalogState {
  reload: () => void;
}

const initialState: SkillCatalogState = {
  catalog: null,
  error: null,
  loading: true,
};

export function useSkillCatalog(
  build: GameBuild,
  language: string,
): SkillCatalogResult {
  const [state, setState] = useState(initialState);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    let current = true;
    setState(initialState);

    loadSkillCatalog(build, language).then(
      (catalog) => {
        if (current) setState({ catalog, error: null, loading: false });
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

  const languageTag = canonicalLanguage(language);
  if (
    state.catalog &&
    (state.catalog.build !== build || state.catalog.language !== languageTag)
  ) {
    return { catalog: null, error: null, loading: true, reload };
  }
  return { ...state, reload };
}
