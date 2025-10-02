import { useCallback, useReducer } from "react";
import { assign } from "radash";

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

type WizardReducer = (state: WizardState, action: WizardAction) => WizardState;
type WizardAction =
  | { type: "SET_PLATFORM"; payload: SourcePlatform | null }
  | { type: "SET_FILTERS"; payload: FilterState }
  | { type: "SET_RESULTS"; payload: ResultsData | null }
  | { type: "RESET" };

const validateWizardState = (state: WizardState): WizardState => {
  const isReady = !!state.platform && state.filters.isValid;
  return { ...state, isReady };
};

const wizardReducer: WizardReducer = (state, action) => {
  switch (action.type) {
    case "SET_PLATFORM":
      return { ...state, platform: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "SET_RESULTS":
      return { ...state, results: action.payload };
    case "RESET":
      return INITIAL_WIZARD_STATE;
    default:
      return state;
  }
};

const validatedReducer: WizardReducer = (state, action) =>
  validateWizardState(wizardReducer(state, action));

const createInitialState = (
  initialValues: Partial<WizardState> = {}
): WizardState =>
  validateWizardState(
    assign(INITIAL_WIZARD_STATE, initialValues) as WizardState
  );

export const useWizardReducer = (initialValues?: Partial<WizardState>) => {
  const [state, dispatch] = useReducer(
    validatedReducer,
    initialValues,
    createInitialState
  );

  const setPlatform = useCallback((platform: SourcePlatform | null) => {
    dispatch({ type: "SET_PLATFORM", payload: platform });
  }, []);

  const setFilters = useCallback((filters: FilterState) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const setResults = useCallback((results: ResultsData | null) => {
    dispatch({ type: "SET_RESULTS", payload: results });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    setPlatform,
    setFilters,
    setResults,
    reset,
  };
};
