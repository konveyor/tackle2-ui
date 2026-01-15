import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";

import { AnalysisProfile } from "@app/api/models";
import { AnalysisScope } from "@app/components/analysis/steps/analysis-scope";
import { AnalysisSource } from "@app/components/analysis/steps/analysis-source";
import { CustomRules } from "@app/components/analysis/steps/custom-rules";
import { OptionsAdvanced } from "@app/components/analysis/steps/options-advanced";
import { SetTargets } from "@app/components/analysis/steps/set-targets";
import { isNotEmptyString } from "@app/utils/utils";

import { useWizardReducer } from "./useWizardReducer";

// Placeholder for profile-specific review component
const Review: React.FC<{
  analysisProfile: AnalysisProfile | null;
  state: ReturnType<typeof useWizardReducer>["state"];
}> = ({ analysisProfile, state }) => {
  return (
    <div>
      <h3>{analysisProfile ? "Edit Profile" : "Create Profile"}</h3>
      <p>
        Mode: {state.mode.mode}
        <br />
        Targets: {state.targets.selectedTargets.length} selected
        <br />
        Scope: {state.scope.withKnownLibs}
        <br />
        Custom Rules: {state.customRules.customRulesFiles.length} files
      </p>
    </div>
  );
};

interface ProfileWizardProps {
  analysisProfile: AnalysisProfile | null;
  onClose: () => void;
  isOpen: boolean;
}

export const ProfileWizard: React.FC<ProfileWizardProps> = ({
  analysisProfile = null,
  onClose,
  isOpen,
}) => {
  const { t } = useTranslation();

  const {
    state,
    setMode,
    setTargets,
    setScope,
    setCustomRules,
    setOptions,
    reset,
  } = useWizardReducer();

  const handleCancel = () => {
    // TODO: remove newly uploaded files from hub if necessary
    reset();
    onClose();
  };

  const onSubmit = async () => {
    // TODO: Implement profile save/update logic
    // try {
    //   if (analysisProfile) {
    //     await updateAnalysisProfile(analysisProfile.id, state);
    //   } else {
    //     await createAnalysisProfile(state);
    //   }
    // } finally {
    //   reset();
    //   onClose();
    // }
    reset();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      showClose={false}
      aria-label="Analysis profile wizard modal"
      hasNoBodyWrapper
      onEscapePress={handleCancel}
      variant={ModalVariant.large}
    >
      <Wizard
        data-testid="analysis-profile-wizard"
        onClose={handleCancel}
        header={
          <WizardHeader
            onClose={handleCancel}
            title={
              analysisProfile
                ? t("wizard.title.editAnalysisProfile")
                : t("wizard.title.createAnalysisProfile")
            }
            description={analysisProfile ? analysisProfile.name : undefined}
          />
        }
        isVisitRequired
      >
        {/* Configure Analysis Steps */}
        <WizardStep
          key="step-configure-analysis"
          id="step-configure-analysis"
          name={t("wizard.terms.configureAnalysis")}
          steps={[
            <WizardStep
              key="step-configure-analysis-source"
              id="step-configure-analysis-source"
              name={t("wizard.terms.analysisSource")}
              footer={{
                isNextDisabled: !state.mode.isValid,
              }}
            >
              <AnalysisSource
                onStateChanged={setMode}
                initialState={state.mode}
                // No applications - profile is a template
                // No binary upload - not applicable for profiles
              />
            </WizardStep>,
            <WizardStep
              key="step-configure-set-targets"
              id="step-configure-set-targets"
              name={t("wizard.terms.setTargets")}
              footer={{
                isNextDisabled: !state.targets.isValid,
              }}
            >
              <SetTargets
                // No applications - show all targets without filtering
                areCustomRulesEnabled={
                  state.customRules.customRulesFiles.length > 0 ||
                  isNotEmptyString(state.customRules.sourceRepository)
                }
                onStateChanged={setTargets}
                state={state.targets}
              />
            </WizardStep>,
            <WizardStep
              key="step-configure-scope"
              id="step-configure-scope"
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

        {/* Advanced Steps */}
        <WizardStep
          key="step-advanced"
          id="step-advanced"
          name={t("wizard.terms.advanced")}
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
                // No ensureTaskGroup - files uploaded as hub files for profiles
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
              <OptionsAdvanced
                selectedTargets={state.targets.selectedTargets}
                customRules={state.customRules}
                onStateChanged={setOptions}
                initialState={state.options}
                showSaveAsProfile={false} // Profile wizard doesn't need "save as profile"
              />
            </WizardStep>,
          ]}
        />

        {/* Review Step */}
        <WizardStep
          key="step-review"
          id="step-review"
          name={t("wizard.terms.review")}
          footer={{
            nextButtonText: analysisProfile
              ? t("actions.save")
              : t("actions.create"),
            isNextDisabled: !state.isValid,
            onNext: onSubmit,
          }}
        >
          <Review analysisProfile={analysisProfile} state={state} />
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
