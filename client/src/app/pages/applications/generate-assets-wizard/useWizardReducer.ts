import { useCallback, useRef } from "react";
import { produce } from "immer";
import { useImmerReducer } from "use-immer";

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

type WizardReducer = (draft: WizardState, action?: WizardAction) => void;
type WizardAction =
  | { type: "SET_PROFILE"; payload: TargetProfile }
  | { type: "SET_PARAMETERS"; payload: ParameterState }
  | { type: "SET_ADVANCED_OPTIONS"; payload: AdvancedOptionsState }
  | { type: "SET_RESULTS"; payload: ResultsData | null }
  | { type: "RESET"; payload: WizardState };

const updateIsReady = (draft: WizardState) => {
  draft.isReady =
    !!draft.profile &&
    draft.parameters.isValid &&
    draft.advancedOptions.isValid;
  return draft;
};

const wizardReducer: WizardReducer = (draft, action) => {
  if (action) {
    switch (action.type) {
      case "SET_PROFILE":
        draft.profile = action.payload;
        break;
      case "SET_PARAMETERS":
        draft.parameters = action.payload;
        break;
      case "SET_ADVANCED_OPTIONS":
        draft.advancedOptions = action.payload;
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

  // Create stable callbacks using useCallback
  const setProfile = useCallback(
    (profile: TargetProfile) => {
      dispatch({ type: "SET_PROFILE", payload: profile });
    },
    [dispatch]
  );

  const setParameters = useCallback(
    (parameters: ParameterState) => {
      dispatch({ type: "SET_PARAMETERS", payload: parameters });
    },
    [dispatch]
  );

  const setAdvancedOptions = useCallback(
    (advancedOptions: AdvancedOptionsState) => {
      dispatch({ type: "SET_ADVANCED_OPTIONS", payload: advancedOptions });
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
    setProfile,
    setParameters,
    setAdvancedOptions,
    setResults,
    reset,
  };
};
