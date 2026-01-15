import { useCallback, useState } from "react";
import { produce } from "immer";
import { useImmerReducer } from "use-immer";

import { AnalysisScopeState } from "@app/components/analysis/steps/analysis-scope";
import { AnalysisModeState } from "@app/components/analysis/steps/analysis-source";
import { CustomRulesStepState } from "@app/components/analysis/steps/custom-rules";
import { AdvancedOptionsState } from "@app/components/analysis/steps/options-advanced";
import { SetTargetsState } from "@app/components/analysis/steps/set-targets";

export interface WizardState {
  mode: AnalysisModeState;
  targets: SetTargetsState;
  scope: AnalysisScopeState;
  customRules: CustomRulesStepState;
  options: AdvancedOptionsState;
  isValid: boolean;
}

const INITIAL_WIZARD_STATE: WizardState = {
  mode: {
    mode: "source-code-deps",
    artifact: null,
    isValid: true, // For profile wizard, mode is always valid (no application validation)
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
    isValid: true, // Custom rules are optional for profiles
  },
  options: {
    additionalTargetLabels: [],
    additionalSourceLabels: [],
    excludedLabels: [],
    autoTaggingEnabled: true,
    advancedAnalysisEnabled: false,
    saveAsProfile: false, // Not used in profile wizard
    isValid: true,
  },
  isValid: true, // Start as valid since profile can be empty
};

type WizardAction =
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

  // Validate and update isValid state after any change
  draft.isValid =
    draft.mode.isValid &&
    draft.targets.isValid &&
    draft.scope.isValid &&
    draft.customRules.isValid &&
    draft.options.isValid;
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
  const firstInitialState = useImmerInitialState(init);

  const [state, dispatch] = useImmerReducer(wizardReducer, firstInitialState);

  // Create stable callbacks using useCallback
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
    setMode,
    setTargets,
    setScope,
    setCustomRules,
    setOptions,
    reset,
  };
};
