import { useCallback, useRef } from "react";
import { produce } from "immer";
import { useImmerReducer } from "use-immer";

import { SourcePlatform } from "@app/api/models";

import { FilterState } from "./filter-input";
import { ResultsData } from "./results";

export interface WizardState {
  platform: SourcePlatform | null;
  filters: FilterState;
  isReady: boolean;
  results: ResultsData | null;
}

const INITIAL_WIZARD_STATE: WizardState = {
  platform: null,
  filters: {
    filterRequired: true,
    isValid: false,
  },
  isReady: false,
  results: null,
};

type WizardReducer = (draft: WizardState, action?: WizardAction) => void;
type WizardAction =
  | { type: "SET_PLATFORM"; payload: SourcePlatform | null }
  | { type: "SET_FILTERS"; payload: FilterState }
  | { type: "SET_RESULTS"; payload: ResultsData | null }
  | { type: "RESET"; payload: WizardState };

const updateIsReady = (draft: WizardState) => {
  draft.isReady = !!draft.platform && draft.filters.isValid;
};

const wizardReducer: WizardReducer = (draft, action) => {
  if (action) {
    switch (action.type) {
      case "SET_PLATFORM":
        draft.platform = action.payload;
        break;
      case "SET_FILTERS":
        draft.filters = action.payload;
        break;
      case "SET_RESULTS":
        draft.results = action.payload;
        break;
      case "RESET":
        return updateIsReady(action.payload);
    }
  }

  // Validate and update isReady state after any change
  updateIsReady(draft);
};

export type InitialStateRecipe = (draftInitialState: WizardState) => void;

const useImmerInitialState = (
  initialRecipe?: InitialStateRecipe
): WizardState => {
  const initialRef = useRef<WizardState | null>(null);
  if (initialRef.current === null) {
    initialRef.current = produce(INITIAL_WIZARD_STATE, (draft) => {
      initialRecipe?.(draft);
      wizardReducer(draft);
    });
  }

  return initialRef.current;
};

export const useWizardReducer = (init?: InitialStateRecipe) => {
  // Ref: https://18.react.dev/reference/react/useReducer#avoiding-recreating-the-initial-state
  // Allow RESET to have the same semantics as useReducer()'s initialState argument by just
  // calculating the initial state once and storing it in a ref.
  const firstInitialState = useImmerInitialState(init);

  const [state, dispatch] = useImmerReducer(wizardReducer, firstInitialState);

  const setPlatform = useCallback(
    (platform: SourcePlatform | null) => {
      dispatch({ type: "SET_PLATFORM", payload: platform });
    },
    [dispatch]
  );

  const setFilters = useCallback(
    (filters: FilterState) => {
      dispatch({ type: "SET_FILTERS", payload: filters });
    },
    [dispatch]
  );

  const setResults = useCallback(
    (results: ResultsData | null) => {
      dispatch({ type: "SET_RESULTS", payload: results });
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET", payload: firstInitialState });
  }, [firstInitialState, dispatch]);

  return {
    state,
    setPlatform,
    setFilters,
    setResults,
    reset,
  };
};
