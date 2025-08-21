import * as React from "react";
import { ParameterState } from "./step-capture-parameters";
import { ResultsData } from "./step-results";
import { TargetProfile } from "@app/api/models";

export interface WizardState {
  profile?: TargetProfile;
  parameters: ParameterState;
  isReady: boolean;
  results: ResultsData | null;
}

const INITIAL_WIZARD_STATE: WizardState = {
  profile: undefined,
  parameters: {
    isValid: false,
    parametersRequired: false,
  },
  isReady: false,
  results: null,
};

type WizardReducer = (state: WizardState, action: WizardAction) => WizardState;
type WizardAction =
  | { type: "SET_PROFILE"; payload: TargetProfile }
  | { type: "SET_PARAMETERS"; payload: ParameterState }
  | { type: "SET_RESULTS"; payload: ResultsData | null }
  | { type: "RESET" };

const validateWizardState = (state: WizardState): WizardState => {
  const isReady = !!state.profile && state.parameters.isValid;
  return { ...state, isReady };
};

const wizardReducer: WizardReducer = (state, action) => {
  console.log("wizardReducer", state, action);
  switch (action.type) {
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_PARAMETERS":
      return { ...state, parameters: action.payload };
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
    setResults,
    reset,
  };
};
