import * as React from "react";

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
  const isReady = state.platform !== null && state.filters.isValid;
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

// Helper function to create initial state using the same reducer actions
const createInitialState = (
  initialValues?: Partial<WizardState>
): WizardState => {
  let state = INITIAL_WIZARD_STATE;

  if (initialValues?.platform !== undefined) {
    state = validatedReducer(state, {
      type: "SET_PLATFORM",
      payload: initialValues.platform,
    });
  }

  if (initialValues?.filters !== undefined) {
    state = validatedReducer(state, {
      type: "SET_FILTERS",
      payload: initialValues.filters,
    });
  }

  if (initialValues?.results !== undefined) {
    state = validatedReducer(state, {
      type: "SET_RESULTS",
      payload: initialValues.results,
    });
  }

  return state;
};

export const useWizardReducer = (initialValues?: Partial<WizardState>) => {
  const [state, dispatch] = React.useReducer(
    validatedReducer,
    initialValues,
    createInitialState
  );

  const setPlatform = React.useCallback((platform: SourcePlatform | null) => {
    dispatch({ type: "SET_PLATFORM", payload: platform });
  }, []);

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
    setPlatform,
    setFilters,
    setResults,
    reset,
  };
};
