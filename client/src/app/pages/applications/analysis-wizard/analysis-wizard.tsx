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
import { AnalysisMode } from "./steps/analysis-mode";
import { AnalysisScope } from "./steps/analysis-scope";
import { CustomRules } from "./steps/custom-rules";
import { Review } from "./steps/review";
import { SetTargets } from "./steps/set-targets";
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
  AnalysisMode = 1,
  SetTargets,
  Scope,
  CustomRules,
  Options,
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
    await submitAnalysis(state, analyzableApplications, identities);
    reset();
    onClose();
  };

  const onMove = (current: WizardStepType) => {
    const id = current.id;
    if (id && stepIdReached < (id as number)) setStepIdReached(id as number);
  };

  const isStepEnabled = (stepId: StepId) => {
    return stepIdReached + 1 >= stepId;
  };

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
        <WizardStep
          key="wizard-configureAnalysis"
          id="wizard-configureAnalysis"
          name={t("wizard.terms.configureAnalysis")}
          steps={[
            <WizardStep
              key={StepId.AnalysisMode}
              id={StepId.AnalysisMode}
              name={t("wizard.terms.analysisMode")}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.AnalysisMode + 1) ||
                  !state.mode.isValid,
              }}
            >
              <AnalysisMode
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

        <WizardStep
          key="wizard-advanced"
          id="wizard-advanced"
          name={t("wizard.terms.advanced")}
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

        <WizardStep
          key={StepId.Review}
          id={StepId.Review}
          name={t("wizard.terms.review")}
          isDisabled={!isStepEnabled(StepId.Review)}
          footer={{ nextButtonText: "Run", isNextDisabled: !state.isReady }}
        >
          <Review
            applications={applications}
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
