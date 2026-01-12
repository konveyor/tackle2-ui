import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  Truncate,
  Wizard,
  WizardHeader,
  WizardStep,
  WizardStepType,
} from "@patternfly/react-core";

import { Application } from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";
import { isNotEmptyString } from "@app/utils/utils";

import { AdvancedOptions } from "./steps/advanced-options";
import { AnalysisScope } from "./steps/analysis-scope";
import { AnalysisSource } from "./steps/analysis-source";
import { CustomRules } from "./steps/custom-rules";
import { OptionsProfile } from "./steps/options-profile";
import { Review } from "./steps/review";
import { SetTargets } from "./steps/set-targets";
import { WizardMode } from "./steps/wizard-mode";
import { useTaskGroupManager } from "./useTaskGroupManager";
import { useWizardReducer } from "./useWizardReducer";
import { useAnalyzableApplications } from "./utils";

import "./wizard.css";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

enum StepId {
  WizardMode = 1,
  AnalysisSource,
  SetTargets,
  Scope,
  CustomRules,
  Options,
  OptionsProfile,
  Review,
}

export const AnalysisWizard: React.FC<IAnalysisWizard> = ({
  applications,
  onClose,
  isOpen,
}: IAnalysisWizard) => {
  const { t } = useTranslation();

  const { identities } = useFetchIdentities();

  const {
    state,
    setFlowMode,
    setMode,
    setTargets,
    setScope,
    setCustomRules,
    setOptions,
    reset,
  } = useWizardReducer();

  const { ensureTaskGroup, submitAnalysis, cancelAnalysis } =
    useTaskGroupManager();

  const [stepIdReached, setStepIdReached] = React.useState(1);

  const handleCancel = () => {
    cancelAnalysis();
    reset();
    onClose();
  };

  const analyzableApplications = useAnalyzableApplications(
    applications,
    state.mode.mode
  );

  const onSubmit = async () => {
    try {
      await submitAnalysis(state, analyzableApplications, identities);
    } finally {
      reset();
      onClose();
    }
  };

  const onMove = (current: WizardStepType) => {
    const id = current.id;
    if (id && stepIdReached < (id as number)) setStepIdReached(id as number);
  };

  const isStepEnabled = (stepId: StepId) => {
    return stepIdReached + 1 >= stepId;
  };

  const isManualMode = state.flowMode.flowMode === "manual";
  const isProfileMode = state.flowMode.flowMode === "profile";

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      showClose={false}
      aria-label="Application analysis wizard modal"
      hasNoBodyWrapper
      onEscapePress={handleCancel}
      variant={ModalVariant.large}
    >
      <Wizard
        data-testid="analysis-wizard"
        onClose={handleCancel}
        onSave={onSubmit}
        onStepChange={(_event, currentStep: WizardStepType) =>
          onMove(currentStep)
        }
        header={
          <WizardHeader
            onClose={handleCancel}
            title="Application analysis"
            description={
              <Truncate
                content={applications.map((app) => app.name).join(", ")}
              />
            }
          />
        }
      >
        {/* Mode Selection Step - Always visible */}
        <WizardStep
          key={StepId.WizardMode}
          id={StepId.WizardMode}
          name={t("wizard.terms.wizardMode")}
          footer={{
            isNextDisabled:
              !isStepEnabled(StepId.WizardMode + 1) || !state.flowMode.isValid,
          }}
        >
          <WizardMode
            applications={applications}
            onStateChanged={setFlowMode}
            initialState={state.flowMode}
          />
        </WizardStep>

        {/* Manual Mode Steps - Configure Analysis */}
        <WizardStep
          key="wizard-configureAnalysis"
          id="wizard-configureAnalysis"
          name={t("wizard.terms.configureAnalysis")}
          isHidden={isProfileMode}
          steps={[
            <WizardStep
              key={StepId.AnalysisSource}
              id={StepId.AnalysisSource}
              name={t("wizard.terms.analysisSource")}
              isDisabled={!isStepEnabled(StepId.AnalysisSource)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.AnalysisSource + 1) ||
                  !state.mode.isValid,
              }}
            >
              <AnalysisSource
                applications={applications}
                ensureTaskGroup={ensureTaskGroup}
                onStateChanged={setMode}
                initialState={state.mode}
              />
            </WizardStep>,
            <WizardStep
              key={StepId.SetTargets}
              id={StepId.SetTargets}
              name={t("wizard.terms.setTargets")}
              isDisabled={!isStepEnabled(StepId.SetTargets)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.SetTargets + 1) ||
                  !state.targets.isValid,
              }}
            >
              <SetTargets
                applications={applications}
                areCustomRulesEnabled={
                  state.customRules.customRulesFiles.length > 0 ||
                  isNotEmptyString(state.customRules.sourceRepository)
                }
                onStateChanged={setTargets}
                state={state.targets}
              />
            </WizardStep>,
            <WizardStep
              key={StepId.Scope}
              id={StepId.Scope}
              name={t("wizard.terms.scope")}
              isDisabled={!isStepEnabled(StepId.Scope)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.Scope + 1) || !state.scope.isValid,
              }}
            >
              <AnalysisScope
                onStateChanged={setScope}
                initialState={state.scope}
              />
            </WizardStep>,
          ]}
        />

        {/* Manual Mode Steps - Advanced */}
        <WizardStep
          key="wizard-advanced"
          id="wizard-advanced"
          name={t("wizard.terms.advanced")}
          isHidden={isProfileMode}
          steps={[
            <WizardStep
              key={StepId.CustomRules}
              id={StepId.CustomRules}
              name={t("wizard.terms.customRules")}
              isDisabled={!isStepEnabled(StepId.CustomRules)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.CustomRules + 1) ||
                  !state.customRules.isValid,
              }}
            >
              <CustomRules
                ensureTaskGroup={ensureTaskGroup}
                isCustomRuleRequired={
                  state.targets.selectedTargets.length === 0
                }
                onStateChanged={setCustomRules}
                initialState={state.customRules}
              />
            </WizardStep>,
            <WizardStep
              key={StepId.Options}
              id={StepId.Options}
              name={t("wizard.terms.options")}
              isDisabled={!isStepEnabled(StepId.Options)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.Options + 1) || !state.options.isValid,
              }}
            >
              <AdvancedOptions
                selectedTargets={state.targets.selectedTargets}
                customRules={state.customRules}
                onStateChanged={setOptions}
                initialState={state.options}
              />
            </WizardStep>,
          ]}
        />

        {/* Profile Mode - Simplified Options Step */}
        <WizardStep
          key={StepId.OptionsProfile}
          id={StepId.OptionsProfile}
          name={t("wizard.terms.options")}
          isHidden={isManualMode}
          isDisabled={!isStepEnabled(StepId.OptionsProfile)}
          footer={{
            isNextDisabled:
              !isStepEnabled(StepId.OptionsProfile + 1) ||
              !state.options.isValid,
          }}
        >
          <OptionsProfile
            onStateChanged={setOptions}
            initialState={state.options}
          />
        </WizardStep>

        {/* Review Step - Always visible */}
        <WizardStep
          key={StepId.Review}
          id={StepId.Review}
          name={t("wizard.terms.review")}
          isDisabled={!isStepEnabled(StepId.Review)}
          footer={{ nextButtonText: "Run", isNextDisabled: !state.isReady }}
        >
          <Review
            applications={applications}
            flowMode={state.flowMode.flowMode}
            selectedProfile={state.flowMode.selectedProfile}
            mode={state.mode.mode}
            targets={state.targets}
            scope={state.scope}
            customRules={state.customRules}
            options={state.options}
          />
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
