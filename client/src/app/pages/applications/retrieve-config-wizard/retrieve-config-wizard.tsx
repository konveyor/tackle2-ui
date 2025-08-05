import * as React from "react";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardStep,
  WizardStepType,
  WizardHeader,
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
  const { submitTasks } = useFetchApplicationManifest();

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
    onClose();
  };

  const onSubmit = async ({ ready }: FormValues) => {
    const { success, failure } = await submitTasks(ready);

    console.log("success results", success);
    if (success.length > 0) {
      pushNotification({
        title: `Application manifest fetches submitted`,
        message: `Task IDs: ${success.map((result) => result.task.id).join(", ")}`,
        variant: "info",
      });
    }

    console.log("failure results", failure);
    if (failure.length > 0) {
      pushNotification({
        title: `Application manifest fetches failed`,
        message: `Applications: ${failure.map((result) => result.application.id).join(", ")}`,
        variant: "danger",
      });
    }
  };

  const onMove = (_current: WizardStepType) => {};

  const readyApplications = watch("ready");
  if (readyApplications.length === 0) {
    return (
      <Modal
        variant={ModalVariant.medium}
        title={t("dialog.title.retrieveConfigurations")}
        isOpen={isOpen}
        onClose={handleCancel}
      >
        <div style={{ padding: "20px" }}>
          <p>{t("message.noApplicationsWithSourcePlatforms")}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      variant={ModalVariant.large}
      aria-label={t("dialog.title.retrieveConfigurations")}
      isOpen={isOpen}
      showClose={false}
      hasNoBodyWrapper
      onEscapePress={handleCancel}
    >
      <FormProvider {...methods}>
        <Wizard
          onSave={handleSubmit(onSubmit)}
          onClose={handleCancel}
          onStepChange={(_event, currentStep: WizardStepType) =>
            onMove(currentStep)
          }
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
              nextButtonText: t("actions.retrieve"),
            }}
          >
            <Review />
          </WizardStep>
          {/* TODO: Add a step review the submitted tasks. */}
        </Wizard>
      </FormProvider>
    </Modal>
  );
};

const useFetchApplicationManifest = () => {
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
