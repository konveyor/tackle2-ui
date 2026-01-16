import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  Truncate,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";

import { Application } from "@app/api/models";
import { AnalysisScope } from "@app/components/analysis/steps/analysis-scope";
import { AnalysisSource } from "@app/components/analysis/steps/analysis-source";
import { CustomRules } from "@app/components/analysis/steps/custom-rules";
import { OptionsManual } from "@app/components/analysis/steps/options-advanced";
import { SetTargets } from "@app/components/analysis/steps/set-targets";
import { useFetchIdentities } from "@app/queries/identities";
import { isNotEmptyString } from "@app/utils/utils";

import { UploadApplicationBinary } from "./components/upload-application-binary";
import { OptionsProfile } from "./steps/options-profile";
import { Review } from "./steps/review";
import { WizardMode } from "./steps/wizard-mode";
import { useSaveAnalysisProfile } from "./useSaveAnalysisProfile";
import { useTaskGroupManager } from "./useTaskGroupManager";
import { useWizardReducer } from "./useWizardReducer";
import { useAnalyzableApplications } from "./utils";

import "./wizard.css";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
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

  const handleCancel = () => {
    cancelAnalysis();
    reset();
    onClose();
  };

  const analyzableApplications = useAnalyzableApplications(
    applications,
    state.mode.mode
  );
  const { createAnalysisProfile } = useSaveAnalysisProfile();

  const onSubmit = async () => {
    // fire and forget the profile creation
    createAnalysisProfile(state);

    // submit the analysis
    try {
      await submitAnalysis(state, analyzableApplications, identities);
    } finally {
      reset();
      onClose();
    }
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
        isVisitRequired
      >
        {/* Mode Selection Step - Always visible */}
        <WizardStep
          key="step-mode"
          id="step-mode"
          name={t("wizard.terms.wizardMode")}
          footer={{
            isBackHidden: true,
            isNextDisabled: !state.flowMode.isValid,
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
          key="step-analysis"
          id="step-analysis"
          name={t("wizard.terms.configureAnalysis")}
          isHidden={isProfileMode}
          steps={[
            <WizardStep
              key="step-analysis-source"
              id="step-analysis-source"
              name={t("wizard.terms.analysisSource")}
              footer={{
                isNextDisabled: !state.mode.isValid,
              }}
            >
              <AnalysisSource
                applications={applications}
                ensureTaskGroup={ensureTaskGroup}
                onStateChanged={setMode}
                initialState={state.mode}
                renderBinaryUpload={({ artifact, onArtifactChange }) => (
                  <UploadApplicationBinary
                    requestTaskgroupId={async () =>
                      (await ensureTaskGroup()).id
                    }
                    artifact={artifact}
                    onArtifactChange={onArtifactChange}
                  />
                )}
              />
            </WizardStep>,
            <WizardStep
              key="step-analysis-targets"
              id="step-analysis-targets"
              name={t("wizard.terms.setTargets")}
              footer={{
                isNextDisabled: !state.targets.isValid,
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
              key="step-analysis-scope"
              id="step-analysis-scope"
              name={t("wizard.terms.scope")}
              footer={{
                isNextDisabled: !state.scope.isValid,
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
          key="step-advanced"
          id="step-advanced"
          name={t("wizard.terms.advanced")}
          isHidden={isProfileMode}
          steps={[
            <WizardStep
              key="step-advanced-custom-rules"
              id="step-advanced-custom-rules"
              name={t("wizard.terms.customRules")}
              footer={{
                isNextDisabled: !state.customRules.isValid,
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
              key="step-advanced-options"
              id="step-advanced-options"
              name={t("wizard.terms.options")}
              footer={{
                isNextDisabled: !state.options.isValid,
              }}
            >
              <OptionsManual
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
          key="step-profile-options"
          id="step-profile-options"
          name={t("wizard.terms.options")}
          isHidden={isManualMode}
          footer={{
            isNextDisabled: !state.options.isValid,
          }}
        >
          <OptionsProfile onStateChanged={setOptions} state={state.options} />
        </WizardStep>

        {/* Review Step - Always visible */}
        <WizardStep
          key="step-review"
          id="step-review"
          name={t("wizard.terms.review")}
          footer={{
            nextButtonText: t("actions.run"),
            isNextDisabled: !state.isReady,
            onNext: onSubmit,
          }}
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
