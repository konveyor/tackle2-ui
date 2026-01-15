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
import { AnalysisLabels } from "@app/components/analysis/steps/analysis-labels";
import { AnalysisScope } from "@app/components/analysis/steps/analysis-scope";
import { AnalysisSource } from "@app/components/analysis/steps/analysis-source";
import { CustomRules } from "@app/components/analysis/steps/custom-rules";
import { SetTargets } from "@app/components/analysis/steps/set-targets";
import { isNotEmptyString } from "@app/utils/utils";

import { ProfileDetails } from "./steps/profile-details";
import { Review } from "./steps/review";
import { useWizardReducer } from "./useWizardReducer";

interface AnalysisProfileWizardProps {
  analysisProfile: AnalysisProfile | null;
  onClose: () => void;
  isOpen: boolean;
}

export const AnalysisProfileWizard: React.FC<AnalysisProfileWizardProps> = ({
  analysisProfile = null,
  onClose,
  isOpen,
}) => {
  const { t } = useTranslation();

  const {
    state,
    setProfileDetails,
    setMode,
    setTargets,
    setScope,
    setCustomRules,
    setLabels,
    reset,
  } = useWizardReducer(analysisProfile ?? undefined);

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
    console.log("onSubmit", state);
    // reset();
    // onClose();
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
                ? t("analysisProfileWizard.title.edit")
                : t("analysisProfileWizard.title.create")
            }
            description={analysisProfile ? analysisProfile.name : undefined}
          />
        }
        isVisitRequired={!analysisProfile}
      >
        <WizardStep
          key="step-profile-details"
          id="step-profile-details"
          name={t("analysisProfileWizard.steps.profileDetails.stepTitle")}
        >
          <ProfileDetails
            onStateChanged={setProfileDetails}
            initialState={state.profileDetails}
          />
        </WizardStep>

        {/* Configure Analysis Steps */}
        <WizardStep
          key="step-configure-analysis"
          id="step-configure-analysis"
          name={t("analysisProfileWizard.steps.configureAnalysis.stepTitle")}
          steps={[
            <WizardStep
              key="step-configure-analysis-source"
              id="step-configure-analysis-source"
              name={t("analysisProfileWizard.steps.analysisSource.stepTitle")}
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
              name={t("analysisProfileWizard.steps.setTargets.stepTitle")}
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
              name={t("analysisProfileWizard.steps.scope.stepTitle")}
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
          name={t("analysisProfileWizard.steps.advanced.stepTitle")}
          steps={[
            <WizardStep
              key="step-advanced-custom-rules"
              id="step-advanced-custom-rules"
              name={t("analysisProfileWizard.steps.customRules.stepTitle")}
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
              key="step-advanced-labels"
              id="step-advanced-labels"
              name={t("analysisProfileWizard.steps.labels.stepTitle")}
              footer={{
                isNextDisabled: !state.labels.isValid,
              }}
            >
              <AnalysisLabels
                selectedTargets={state.targets.selectedTargets}
                customRules={state.customRules}
                onStateChanged={setLabels}
                initialState={state.labels}
              />
            </WizardStep>,
          ]}
        />

        {/* Review Step */}
        <WizardStep
          key="step-review"
          id="step-review"
          name={t("analysisProfileWizard.steps.review.stepTitle")}
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
