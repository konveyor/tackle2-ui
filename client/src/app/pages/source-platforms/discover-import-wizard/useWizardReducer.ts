import * as React from "react";
import { FilterState } from "./filter-input";
import { ResultsData } from "./results";

export interface WizardState {
  filters: FilterState;
  isReady: boolean;
  results: ResultsData | null;
}

const INITIAL_WIZARD_STATE: WizardState = {
  filters: {
    filterRequired: true,
    isValid: false,
  },
  isReady: false,
  results: null,
};

type WizardReducer = (state: WizardState, action: WizardAction) => WizardState;
type WizardAction =
  | { type: "SET_FILTERS"; payload: FilterState }
  | { type: "SET_RESULTS"; payload: ResultsData | null }
  | { type: "RESET" };

const validateWizardState = (state: WizardState): WizardState => {
  const isReady = state.filters.isValid;
  return { ...state, isReady };
};

const wizardReducer: WizardReducer = (state, action) => {
  switch (action.type) {
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

export const useWizardReducer = () => {
  const [state, dispatch] = React.useReducer(
    validatedReducer,
    INITIAL_WIZARD_STATE,
    validateWizardState
  );

  // Create stable callbacks using useCallback
  const setFilters = React.useCallback((filters: FilterState) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const setResults = React.useCallback((results: ResultsData | null) => {
    dispatch({ type: "SET_RESULTS", payload: results });
  }, []);

  const reset = React.useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    setFilters,
    setResults,
    reset,
  };
};
