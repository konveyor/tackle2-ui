import { useCallback, useReducer, useRef } from "react";
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
  | { type: "RESET"; payload: WizardState };

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
      return { ...action.payload };
    default:
      return state;
  }
};

const validatedReducer: WizardReducer = (state, action) =>
  validateWizardState(wizardReducer(state, action));

const createInitialState = (
  initialValues: Partial<WizardState> = {}
): WizardState => {
  return validateWizardState(
    assign(INITIAL_WIZARD_STATE, initialValues) as WizardState
  );
};

export const useWizardReducer = (initialValues?: Partial<WizardState>) => {
  // Ref: https://18.react.dev/reference/react/useReducer#avoiding-recreating-the-initial-state
  // Allow RESET to have the same semantics as useReducer()'s initialState argument by just
  // calculating the initial state once and storing it in a ref.
  const { current: firstInitialState } = useRef(
    createInitialState(initialValues)
  );

  const [state, dispatch] = useReducer(validatedReducer, firstInitialState);

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
    dispatch({ type: "RESET", payload: firstInitialState });
  }, [firstInitialState]);

  return {
    state,
    setPlatform,
    setFilters,
    setResults,
    reset,
  };
};
