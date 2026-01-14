import { useCallback, useState } from "react";
import { produce } from "immer";
import { useImmerReducer } from "use-immer";

import {
  AdvancedOptionsState,
  AnalysisModeState,
  AnalysisScopeState,
  CustomRulesStepState,
  SetTargetsState,
  WizardFlowModeState,
} from "./schema";

export interface WizardState {
  flowMode: WizardFlowModeState;
  mode: AnalysisModeState;
  targets: SetTargetsState;
  scope: AnalysisScopeState;
  customRules: CustomRulesStepState;
  options: AdvancedOptionsState;
  isReady: boolean;
}

const INITIAL_WIZARD_STATE: WizardState = {
  flowMode: {
    flowMode: "manual",
    selectedProfile: null,
    isValid: true, // Manual mode is valid by default
  },
  mode: {
    mode: "source-code-deps",
    artifact: null,
    isValid: false,
  },
  targets: {
    selectedTargets: [],
    targetStatus: {},
    isValid: true, // Targets are optional
  },
  scope: {
    withKnownLibs: "app",
    includedPackages: [],
    hasExcludedPackages: false,
    excludedPackages: [],
    isValid: true,
  },
  customRules: {
    rulesKind: "manual",
    customRulesFiles: [],
    customLabels: [],
    isValid: false, // Custom rules are initially required since no targets are initially selected
  },
  options: {
    additionalTargetLabels: [],
    additionalSourceLabels: [],
    excludedLabels: [],
    autoTaggingEnabled: true,
    advancedAnalysisEnabled: false,
    saveAsProfile: false,
    isValid: true,
  },
  isReady: false,
};

type WizardAction =
  | { type: "SET_FLOW_MODE"; payload: WizardFlowModeState }
  | { type: "SET_MODE"; payload: AnalysisModeState }
  | { type: "SET_TARGETS"; payload: SetTargetsState }
  | { type: "SET_SCOPE"; payload: AnalysisScopeState }
  | { type: "SET_CUSTOM_RULES"; payload: CustomRulesStepState }
  | { type: "SET_OPTIONS"; payload: AdvancedOptionsState }
  | { type: "RESET"; payload: WizardState };

const wizardReducer = (
  draft: WizardState,
  action?: WizardAction
): WizardState | void => {
  if (action) {
    switch (action.type) {
      case "SET_FLOW_MODE":
        draft.flowMode = action.payload;
        break;
      case "SET_MODE":
        draft.mode = action.payload;
        break;
      case "SET_TARGETS":
        draft.targets = action.payload;
        break;
      case "SET_SCOPE":
        draft.scope = action.payload;
        break;
      case "SET_CUSTOM_RULES":
        draft.customRules = action.payload;
        break;
      case "SET_OPTIONS":
        draft.options = action.payload;
        break;
      case "RESET":
        return action.payload;
    }
  }

  // Validate and update isReady state after any change
  // Profile mode: only flowMode and options need to be valid
  // Manual mode: all steps must be valid
  if (draft.flowMode.flowMode === "profile") {
    draft.isReady = draft.flowMode.isValid && draft.options.isValid;
  } else {
    draft.isReady =
      draft.flowMode.isValid &&
      draft.mode.isValid &&
      draft.targets.isValid &&
      draft.scope.isValid &&
      draft.customRules.isValid &&
      draft.options.isValid;
  }
};

export type InitialStateRecipe = (draftInitialState: WizardState) => void;

const useImmerInitialState = (
  initialRecipe?: InitialStateRecipe
): WizardState => {
  const [initialState] = useState(() =>
    produce(INITIAL_WIZARD_STATE, (draft) => {
      initialRecipe?.(draft);
      wizardReducer(draft);
    })
  );
  return initialState;
};

export const useWizardReducer = (init?: InitialStateRecipe) => {
  // Ref: https://18.react.dev/reference/react/useReducer#avoiding-recreating-the-initial-state
  // Allow RESET to have the same semantics as useReducer()'s initialState argument by just
  // calculating the initial state once and storing it in a ref.
  const firstInitialState = useImmerInitialState(init);

  const [state, dispatch] = useImmerReducer(wizardReducer, firstInitialState);

  // Create stable callbacks using useCallback
  const setFlowMode = useCallback(
    (flowMode: WizardFlowModeState) => {
      dispatch({ type: "SET_FLOW_MODE", payload: flowMode });
    },
    [dispatch]
  );

  const setMode = useCallback(
    (mode: AnalysisModeState) => {
      dispatch({ type: "SET_MODE", payload: mode });
    },
    [dispatch]
  );

  const setTargets = useCallback(
    (targets: SetTargetsState) => {
      dispatch({ type: "SET_TARGETS", payload: targets });
    },
    [dispatch]
  );

  const setScope = useCallback(
    (scope: AnalysisScopeState) => {
      dispatch({ type: "SET_SCOPE", payload: scope });
    },
    [dispatch]
  );

  const setCustomRules = useCallback(
    (customRules: CustomRulesStepState) => {
      dispatch({ type: "SET_CUSTOM_RULES", payload: customRules });
    },
    [dispatch]
  );

  const setOptions = useCallback(
    (options: AdvancedOptionsState) => {
      dispatch({ type: "SET_OPTIONS", payload: options });
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET", payload: firstInitialState });
  }, [firstInitialState, dispatch]);

  return {
    state,
    setFlowMode,
    setMode,
    setTargets,
    setScope,
    setCustomRules,
    setOptions,
    reset,
  };
};
