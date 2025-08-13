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

import { ApplicationManifestTask, EmptyObject, New } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateTaskMutation } from "@app/queries/tasks";
import { DecoratedApplication } from "../useDecoratedApplications";
import { Review } from "./review";
import { Results, ResultsData } from "./results";

export const RetrieveConfigWizard: React.FC<IRetrieveConfigWizard> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <RetrieveConfigWizardInner
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      {...props}
    />
  );
};

interface IRetrieveConfigWizard {
  applications?: DecoratedApplication[];
  onClose: () => void;
  isOpen: boolean;
}

enum StepId {
  Review = 1,
  Results = 2,
}

export interface FormValues {
  ready: DecoratedApplication[];
  notReady: DecoratedApplication[];
}

const RetrieveConfigWizardInner: React.FC<IRetrieveConfigWizard> = ({
  applications = [],
  onClose,
  isOpen,
}: IRetrieveConfigWizard) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { submitTasks } = useStartFetchApplicationManifest();

  // State to track submission results and current step
  const [submissionResults, setSubmissionResults] =
    React.useState<ResultsData | null>(null);

  const { ready = [], notReady = [] } = group(applications, (app) =>
    app.isReadyForRetrieveConfigurations ? "ready" : "notReady"
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
        title: t("retrieveConfigWizard.toast.submittedOk"),
        message: `Task IDs: ${success
          .map((result) => result.task.id)
          .sort()
          .join(", ")}`,
        variant: "info",
      });
    }

    if (failure.length > 0) {
      pushNotification({
        title: t("retrieveConfigWizard.toast.submittedFailed"),
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
        variant={ModalVariant.medium}
        title={t("dialog.title.retrieveConfigurations")}
        isOpen={isOpen}
        onClose={handleCancel}
        footer={
          <Button variant="primary" onClick={handleCancel}>
            {t("actions.close")}
          </Button>
        }
      >
        <div style={{ padding: "20px" }}>
          <p>{t("retrieveConfigWizard.noApplicationsWithSourcePlatforms")}</p>
        </div>
      </Modal>
    );
  }

  const showResults = submissionResults !== null;
  return (
    <FormProvider {...methods}>
      <Modal
        variant={ModalVariant.large}
        aria-label={t("dialog.title.retrieveConfigurations")}
        isOpen={isOpen}
        showClose={false}
        hasNoBodyWrapper
        onEscapePress={handleCancel}
      >
        <Wizard
          onClose={handleCancel}
          header={
            <WizardHeader
              onClose={handleCancel}
              title={t("dialog.title.retrieveConfigurations")}
              description={t("dialog.message.retrieveConfigurations")}
            />
          }
        >
          <WizardStep
            id={StepId.Review}
            name="Review"
            footer={{
              nextButtonText: showResults
                ? t("actions.close")
                : t("actions.retrieve"),
              onNext: showResults ? handleCancel : handleSubmit(onSubmit),
              isBackDisabled: showResults,
              isCancelHidden: showResults,
            }}
          >
            {!showResults ? (
              <Review />
            ) : (
              <Results results={submissionResults} />
            )}
          </WizardStep>
        </Wizard>
      </Modal>
    </FormProvider>
  );
};

const useStartFetchApplicationManifest = () => {
  const { mutateAsync: createTask } = useCreateTaskMutation<
    EmptyObject,
    ApplicationManifestTask
  >();

  const createAndSubmitTask = async (
    application: DecoratedApplication
  ): Promise<{
    success?: {
      task: ApplicationManifestTask;
      application: DecoratedApplication;
    };
    failure?: {
      message: string;
      cause: Error;
      application: DecoratedApplication;
      newTask: New<ApplicationManifestTask>;
    };
  }> => {
    const newTask: New<ApplicationManifestTask> = {
      name: `${application.name}.${application.id}.application-manifest`,
      kind: "application-manifest",
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
          message: "Failed to submit the application manifest fetch task",
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
