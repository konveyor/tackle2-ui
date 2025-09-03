import * as React from "react";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardStep,
  WizardHeader,
  Button,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { group } from "radash";

import { universalComparator } from "@app/utils/utils";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { DecoratedApplication } from "../useDecoratedApplications";
import { useStartApplicationAssetGeneration } from "./useStartApplicationAssetGeneration";
import { useWizardReducer } from "./useWizardReducer";
import { SelectTargetProfile } from "./step-select-target-profile";
import { Review } from "./step-review";
import { Results } from "./step-results";

export const GenerateAssetsWizard: React.FC<IGenerateAssetsWizard> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <GenerateAssetsWizardInner
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      {...props}
    />
  );
};

interface IGenerateAssetsWizard {
  application?: DecoratedApplication;
  onClose: () => void;
  isOpen: boolean;
}

const GenerateAssetsWizardInner: React.FC<IGenerateAssetsWizard> = ({
  application,
  onClose,
  isOpen,
}: IGenerateAssetsWizard) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { submitTasks } = useStartApplicationAssetGeneration();
  const { state, setProfile, setParameters, setResults, reset } =
    useWizardReducer();
  const { results } = state;

  // TODO: Capture notReady when bulk generate assets is implemented
  const { ready = [] } = group([application].filter(Boolean), (app) =>
    (app?.isReadyForGenerateAssets ?? false) ? "ready" : "notReady"
  );

  const handleCancel = () => {
    reset();
    onClose();
  };

  const submitTasksAndSaveResults = async () => {
    if (ready.length === 0 || !state.profile || !state.parameters.isValid) {
      return;
    }

    const { success, failure } = await submitTasks(
      ready,
      state.profile,
      state.parameters.parameters
    );
    setResults({ success, failure });

    if (success.length > 0) {
      pushNotification({
        title: t("generateAssetsWizard.toast.submittedOk"),
        message: `Task IDs: ${success
          .map((result) => result.task.id)
          .sort(universalComparator)
          .join(", ")}`,
        variant: "info",
      });
    }

    if (failure.length > 0) {
      pushNotification({
        title: t("generateAssetsWizard.toast.submittedFailed"),
        message: `Applications: ${failure
          .map((result) => result.application.name)
          .sort(universalComparator)
          .join(", ")}`,
        variant: "danger",
      });
    }
  };

  if (ready.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        variant={ModalVariant.medium}
        title={t("generateAssetsWizard.title")}
        onClose={handleCancel}
        actions={[
          <Button key="cancel" variant="link" onClick={handleCancel}>
            {t("actions.cancel")}
          </Button>,
        ]}
      >
        {t("generateAssetsWizard.noApplicationsReady")}
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      variant={ModalVariant.large}
      showClose={false}
      hasNoBodyWrapper
      aria-label={t("generateAssetsWizard.title")}
      onClose={handleCancel}
    >
      <Wizard
        onClose={handleCancel}
        header={
          <WizardHeader
            onClose={handleCancel}
            title={t("generateAssetsWizard.title")}
            description={t("generateAssetsWizard.description", {
              count: ready.length,
              first: ready?.[0].name ?? "",
            })}
          />
        }
        isVisitRequired
      >
        <WizardStep
          id="select-target-profile"
          name={t("generateAssetsWizard.selectTargetProfile.stepTitle")}
          footer={{
            nextButtonText: t("actions.next"),
            backButtonText: t("actions.back"),
            isNextDisabled: !state.profile,
          }}
        >
          <SelectTargetProfile
            applications={ready}
            onTargetProfileChanged={setProfile}
            initialTargetProfile={state.profile}
          />
        </WizardStep>

        {/* TODO: Restore with #2498
        <WizardStep
          id="capture-parameters"
          name={t("generateAssetsWizard.captureParameters.stepTitle")}
          footer={{
            nextButtonText: t("actions.next"),
            backButtonText: t("actions.back"),
            isNextDisabled: !state.parameters.isValid,
          }}
        >
          <CaptureParameters
            targetProfile={state.profile}
            onParametersChanged={setParameters}
            initialParameters={state.parameters}
          />
        </WizardStep>
        */}

        <WizardStep
          id="review"
          name={t("generateAssetsWizard.review.stepTitle")}
          footer={{
            nextButtonText: results
              ? t("actions.close")
              : t("actions.generateAssets"),
            backButtonText: t("actions.back"),
            isNextDisabled: !state.isReady && !results,
            isBackDisabled: !!results,
            isCancelHidden: !!results,
            onNext: results ? handleCancel : submitTasksAndSaveResults,
          }}
        >
          {!results ? (
            <Review
              applications={ready}
              targetProfile={state.profile!}
              parameters={state.parameters}
            />
          ) : (
            <Results results={results} />
          )}
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
