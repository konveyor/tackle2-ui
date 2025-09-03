import * as React from "react";

import { TargetProfile } from "@app/api/models";
import { AdvancedOptionsState } from "./step-advanced-options";
import { ParameterState } from "./step-capture-parameters";
import { ResultsData } from "./step-results";

export interface WizardState {
  profile?: TargetProfile;
  parameters: ParameterState;
  advancedOptions: AdvancedOptionsState;
  isReady: boolean;
  results: ResultsData | null;
}

const INITIAL_WIZARD_STATE: WizardState = {
  profile: undefined,
  parameters: {
    isValid: true, // TODO: Restore to false with #2498
    parametersRequired: false,
  },
  advancedOptions: {
    isValid: true,
    renderTemplates: true,
  },
  isReady: false,
  results: null,
};

type WizardReducer = (state: WizardState, action: WizardAction) => WizardState;
type WizardAction =
  | { type: "SET_PROFILE"; payload: TargetProfile }
  | { type: "SET_PARAMETERS"; payload: ParameterState }
  | { type: "SET_ADVANCED_OPTIONS"; payload: AdvancedOptionsState }
  | { type: "SET_RESULTS"; payload: ResultsData | null }
  | { type: "RESET" };

const validateWizardState = (state: WizardState): WizardState => {
  const isReady =
    !!state.profile &&
    state.parameters.isValid &&
    state.advancedOptions.isValid;
  return { ...state, isReady };
};

const wizardReducer: WizardReducer = (state, action) => {
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_PARAMETERS":
      return { ...state, parameters: action.payload };
    case "SET_ADVANCED_OPTIONS":
      return { ...state, advancedOptions: action.payload };
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
  const setProfile = React.useCallback((profile: TargetProfile) => {
    dispatch({ type: "SET_PROFILE", payload: profile });
  }, []);

  const setParameters = React.useCallback((parameters: ParameterState) => {
    dispatch({ type: "SET_PARAMETERS", payload: parameters });
  }, []);

  const setAdvancedOptions = React.useCallback(
    (advancedOptions: AdvancedOptionsState) => {
      dispatch({ type: "SET_ADVANCED_OPTIONS", payload: advancedOptions });
    },
    []
  );

  const setResults = React.useCallback((results: ResultsData | null) => {
    dispatch({ type: "SET_RESULTS", payload: results });
  }, []);

  const reset = React.useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    setProfile,
    setParameters,
    setAdvancedOptions,
    setResults,
    reset,
  };
};
