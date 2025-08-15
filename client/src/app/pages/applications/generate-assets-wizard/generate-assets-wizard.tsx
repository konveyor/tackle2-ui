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

import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { group } from "radash";

import { NotificationsContext } from "@app/components/NotificationsContext";
import { DecoratedApplication } from "../useDecoratedApplications";
import { Review } from "./review";
import { Results, ResultsData } from "./results";
import { useStartApplicationAssetGeneration } from "./useStartApplicationAssetGeneration";
import { universalComparator } from "@app/utils/utils";

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
  applications?: DecoratedApplication[];
  isOpen: boolean;
  onClose: () => void;
}

export interface FormValues {
  ready: DecoratedApplication[];
  notReady: DecoratedApplication[];
}

const GenerateAssetsWizardInner: React.FC<IGenerateAssetsWizard> = ({
  applications = [],
  onClose,
  isOpen,
}: IGenerateAssetsWizard) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { submitTasks } = useStartApplicationAssetGeneration();

  // State to track submission results and current step
  const [submissionResults, setSubmissionResults] =
    React.useState<ResultsData | null>(null);

  const { ready = [], notReady = [] } = group(applications, (app) =>
    app.isReadyForGenerateAssets ? "ready" : "notReady"
  );

  const methods = useForm<FormValues>({
    defaultValues: {
      ready,
      notReady,
    },
    resolver: yupResolver(
      yup.object({
        ready: yup.array().of(yup.object()),
        notReady: yup.array().of(yup.object()),
      })
    ),
    mode: "all",
  });
  const { handleSubmit, watch } = methods;

  const handleCancel = () => {
    setSubmissionResults(null);
    onClose();
  };

  const submitTasksAndSaveResults = async ({ ready }: FormValues) => {
    const { success, failure } = await submitTasks(ready, null, null);

    // Store results and move to Results step
    setSubmissionResults({ success, failure });

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

  const readyApplications = watch("ready");
  if (readyApplications.length === 0) {
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
      onClose={handleCancel}
    >
      <FormProvider {...methods}>
        <Wizard
          header={
            <WizardHeader
              title={t("generateAssetsWizard.title")}
              description={t("generateAssetsWizard.description")}
              onClose={handleCancel}
            />
          }
          onClose={handleCancel}
          isVisitRequired
        >
          {/* TODO: Add a step to select the target profile from one of the application's archetypes */}
          {/* TODO: Add a step to capture the target profile's generator parameters */}
          <WizardStep
            id="review"
            name={t("generateAssetsWizard.review.stepTitle")}
            footer={{
              nextButtonText: submissionResults
                ? t("actions.close")
                : t("actions.generateAssets"),
              onNext: submissionResults
                ? handleCancel
                : handleSubmit(submitTasksAndSaveResults),
              isNextDisabled: false, // TODO: Check if all required inputs are valid
              isBackDisabled: !!submissionResults,
              isCancelHidden: !!submissionResults,
            }}
          >
            {!submissionResults ? (
              <Review
                applications={readyApplications}
                targetProfile={null} // TODO: Replace with a target profile after #2534
                inputParameters={null} // TODO: Replace with input parameters after #2534
              />
            ) : (
              <Results results={submissionResults} />
            )}
          </WizardStep>
        </Wizard>
      </FormProvider>
    </Modal>
  );
};
