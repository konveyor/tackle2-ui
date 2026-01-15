import * as React from "react";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";

import { AnalysisProfile } from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";
import { isNotEmptyString } from "@app/utils/utils";

import { WizardState, useWizardReducer } from "./useWizardReducer";

// import { AnalysisScope } from "./steps/analysis-scope";
// import { AnalysisSource } from "./steps/analysis-source";
// import { CustomRules } from "./steps/custom-rules";
// import { OptionsManual } from "./steps/options-manual";
// import { OptionsProfile } from "./steps/options-profile";
// import { Review } from "./steps/review";
// import { SetTargets } from "./steps/set-targets";
// import { WizardMode } from "./steps/wizard-mode";
// import { useSaveAnalysisProfile } from "./useSaveAnalysisProfile";
// import { useTaskGroupManager } from "./useTaskGroupManager";
// import { useAnalyzableApplications } from "./utils";

const AnalysisSource = (_props: any) => {
  return <div>AnalysisSource</div>;
};

const SetTargets = (_props: any) => {
  return <div>SetTargets</div>;
};

const AnalysisScope = (_props: any) => {
  return <div>AnalysisScope</div>;
};

const CustomRules = (_props: any) => {
  return <div>CustomRules</div>;
};

const AdvancedLabels = (_props: any) => {
  return <div>AdvancedLabels</div>;
};

const OptionsManual = (_props: any) => {
  return <div>OptionsManual</div>;
};

const Review = (_props: any) => {
  return <div>Review</div>;
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

  const handleCancel = () => {
    // TODO: remove newly uploaded files from hub if necessary
    reset();
    onClose();
  };

  // const { createAnalysisProfile } = useSaveAnalysisProfile();

  const onSubmit = async () => {
    //   try {
    //     await createAnalysisProfile(state);
    //   } finally {
    //     reset();
    //     onClose();
    //   }
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
                ? "Edit analysis profile"
                : "Create analysis profile"
            }
            description={analysisProfile ? analysisProfile.name : undefined}
          />
        }
        isVisitRequired
      >
        <WizardStep
          key="step-configure-analysis"
          id="step-configure-analysis"
          name="Configure analysis"
          steps={[
            <WizardStep
              key="step-configure-analysis-source"
              id="step-configure-analysis-source"
              name="Analysis source"
              footer={{
                isNextDisabled: false, // !state.targets.isValid,
              }}
            >
              <AnalysisSource
                onStateChanged={setMode}
                initialState={state.mode}
              />
            </WizardStep>,
            <WizardStep
              key="step-configure-set-targets"
              id="step-configure-set-targets"
              name="Set targets"
              footer={{
                isNextDisabled: false, // !state.targets.isValid,
              }}
            >
              <SetTargets
                isRequired={
                  false
                  // state.customRules.customRulesFiles.length > 0 ||
                  // isNotEmptyString(state.customRules.sourceRepository)
                }
                onStateChanged={setTargets}
                state={state.targets}
              />
            </WizardStep>,
            <WizardStep
              key="step-configure-scope"
              id="step-configure-scope"
              name="Scope"
              footer={{
                isNextDisabled: false, // !state.scope.isValid,
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
          key="step-advanced"
          id="step-advanced"
          name="Advanced"
          steps={[
            <WizardStep
              key="step-advanced-custom-rules"
              id="step-advanced-custom-rules"
              name="Custom rules"
              footer={{
                isNextDisabled: false, // !state.customRules.isValid,
              }}
            >
              <CustomRules
                isRequired={
                  false
                  // state.targets.selectedTargets.length === 0
                }
                onStateChanged={setCustomRules}
                initialState={state.customRules}
              />
            </WizardStep>,
            <WizardStep
              key="step-advanced-labels"
              id="step-advanced-labels"
              name="Labels"
              footer={{
                isNextDisabled: false, // !state.customRules.isValid,
              }}
            >
              <AdvancedLabels
                onStateChanged={setCustomRules}
                state={state.customRules}
              />
            </WizardStep>,

            <WizardStep
              key="step-advanced-options"
              id="step-advanced-options"
              name="Options"
              footer={{
                isNextDisabled: false, // !state.options.isValid,
              }}
            >
              <OptionsManual
                selectedTargets={[] /* state.targets.selectedTargets */}
                customRules={[] /* state.customRules */}
                onStateChanged={setOptions}
                initialState={state.options}
              />
            </WizardStep>,
          ]}
        />

        <WizardStep
          key="step-review"
          id="step-review"
          name="Review"
          footer={{
            nextButtonText: analysisProfile ? "Save" : "Create",
            isNextDisabled: !state.isValid,
            onNext: onSubmit,
          }}
        >
          <Review
            analysisProfile={analysisProfile}
            mode={state.mode}
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
