import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Modal,
  ModalVariant,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";

import { AnalysisProfile } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { AnalysisLabels } from "@app/components/analysis/steps/analysis-labels";
import { AnalysisScope } from "@app/components/analysis/steps/analysis-scope";
import { AnalysisSource } from "@app/components/analysis/steps/analysis-source";
import { CustomRules } from "@app/components/analysis/steps/custom-rules";
import { SetTargets } from "@app/components/analysis/steps/set-targets";
import { isNotEmptyString } from "@app/utils/utils";

import { ProfileDetails } from "./steps/profile-details";
import { Review } from "./steps/review";
import { useAnalysisProfileMutations } from "./useAnalysisProfileMutations";
import { InitialStateRecipe, useWizardReducer } from "./useWizardReducer";
import { useWizardStateBuilder } from "./useWizardStateBuilder";

interface AnalysisProfileWizardProps {
  analysisProfile: AnalysisProfile | null;
  onClose: () => void;
  isOpen: boolean;
}

const WithValidity = ({
  children,
  isValid,
}: {
  children: React.ReactNode;
  isValid: boolean;
}) => {
  return (
    <div>
      {isValid ? undefined : (
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      )}{" "}
      {children}
    </div>
  );
};

export const AnalysisProfileWizard: React.FC<AnalysisProfileWizardProps> = ({
  analysisProfile = null,
  onClose,
  isOpen,
}) => {
  const { recipe: initialState, isLoading: isLoadingInitialState } =
    useWizardStateBuilder(analysisProfile);

  // When editing a profile, show loading spinner until initial state data loads
  if (analysisProfile && isLoadingInitialState) {
    return (
      <Modal
        isOpen={isOpen}
        showClose={false}
        aria-label="Analysis profile wizard modal"
        onEscapePress={onClose}
        variant={ModalVariant.large}
      >
        <AppPlaceholder />
      </Modal>
    );
  }

  return (
    <AnalysisProfileWizardReady
      analysisProfile={analysisProfile}
      initialState={initialState}
      onClose={onClose}
      isOpen={isOpen}
    />
  );
};

interface AnalysisProfileWizardReadyProps extends AnalysisProfileWizardProps {
  initialState: InitialStateRecipe;
}

const AnalysisProfileWizardReady: React.FC<AnalysisProfileWizardReadyProps> = ({
  analysisProfile = null,
  initialState,
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
  } = useWizardReducer(initialState);

  const { createAnalysisProfile, updateAnalysisProfile } =
    useAnalysisProfileMutations();

  const handleCancel = () => {
    // TODO: remove newly uploaded files from hub if necessary
    reset();
    onClose();
  };

  const onSubmit = async () => {
    try {
      // Let the mutation handle the success/error notifications
      if (analysisProfile) {
        await updateAnalysisProfile(analysisProfile, state);
      } else {
        await createAnalysisProfile(state);
      }
    } finally {
      reset();
      onClose();
    }
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
          name={
            <WithValidity isValid={state.profileDetails.isValid}>
              {t("analysisProfileWizard.steps.profileDetails.stepTitle")}
            </WithValidity>
          }
          footer={{
            isNextDisabled: !state.profileDetails.isValid,
          }}
        >
          <ProfileDetails
            analysisProfile={analysisProfile}
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
              name={
                <WithValidity isValid={state.mode.isValid}>
                  {t("analysisProfileWizard.steps.analysisSource.stepTitle")}
                </WithValidity>
              }
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
              name={
                <WithValidity isValid={state.targets.isValid}>
                  {t("analysisProfileWizard.steps.setTargets.stepTitle")}
                </WithValidity>
              }
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
              name={
                <WithValidity isValid={state.scope.isValid}>
                  {t("analysisProfileWizard.steps.scope.stepTitle")}
                </WithValidity>
              }
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
              name={
                <WithValidity isValid={state.customRules.isValid}>
                  {t("analysisProfileWizard.steps.customRules.stepTitle")}
                </WithValidity>
              }
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
              name={
                <WithValidity isValid={state.labels.isValid}>
                  {t("analysisProfileWizard.steps.labels.stepTitle")}
                </WithValidity>
              }
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
          <Review state={state} />
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
