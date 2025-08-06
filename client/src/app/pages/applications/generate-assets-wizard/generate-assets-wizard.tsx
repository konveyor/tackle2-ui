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

import { ApplicationTask, EmptyTaskData, New } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateTaskMutation } from "@app/queries/tasks";
import { DecoratedApplication } from "../useDecoratedApplications";
import { Review } from "./review";
import { Results, ResultsData } from "./results";

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
  const { submitTasks } = useFetchApplicationAssetGeneration();

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

  const onSubmit = async ({ ready }: FormValues) => {
    const { success, failure } = await submitTasks(ready);

    // Store results and move to Results step
    setSubmissionResults({ success, failure });

    if (success.length > 0) {
      pushNotification({
        title: t("generateAssetsWizard.toast.submittedOk"),
        message: `Task IDs: ${success
          .map((result) => result.task.id)
          .sort()
          .join(", ")}`,
        variant: "info",
      });
    }

    if (failure.length > 0) {
      pushNotification({
        title: t("generateAssetsWizard.toast.submittedFailed"),
        message: `Applications: ${failure
          .map((result) => result.application.name)
          .sort()
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
          onSave={handleSubmit(onSubmit)}
        >
          <WizardStep
            name={t("generateAssetsWizard.steps.review")}
            id="review-step"
            footer={{ nextButtonText: t("actions.generate") }}
          >
            <Review />
          </WizardStep>
          {submissionResults && (
            <WizardStep
              name={t("generateAssetsWizard.steps.results")}
              id="results-step"
              footer={{
                nextButtonText: t("actions.close"),
                onNext: handleCancel,
              }}
            >
              <Results data={submissionResults} />
            </WizardStep>
          )}
        </Wizard>
      </FormProvider>
    </Modal>
  );
};

const useFetchApplicationAssetGeneration = () => {
  const { mutateAsync: createTask } = useCreateTaskMutation<
    EmptyTaskData,
    ApplicationTask<EmptyTaskData>
  >();

  const createAndSubmitTask = async (
    application: DecoratedApplication
  ): Promise<{
    success?: {
      task: ApplicationTask<EmptyTaskData>;
      application: DecoratedApplication;
    };
    failure?: {
      message: string;
      cause: Error;
      application: DecoratedApplication;
      newTask: New<ApplicationTask<EmptyTaskData>>;
    };
  }> => {
    const newTask: New<ApplicationTask<EmptyTaskData>> = {
      name: `${application.name}.${application.id}.asset-generation`,
      kind: "asset-generation",
      application: { id: application.id, name: application.name },
      state: "Ready",
      data: {},
    };

    try {
      const task = await createTask(newTask);
      return { success: { task, application } };
    } catch (error) {
      return {
        failure: {
          message: "Failed to submit the asset generation task",
          cause: error as Error,
          application,
          newTask,
        },
      };
    }
  };

  const submitTasks = async (applications: DecoratedApplication[]) => {
    const results = await Promise.allSettled(
      applications.map(createAndSubmitTask)
    );

    const success = [];
    const failure = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          success.push(result.value.success);
        }
        if (result.value.failure) {
          failure.push(result.value.failure);
        }
      }
    }

    return { success, failure };
  };

  return {
    submitTasks,
  };
};
