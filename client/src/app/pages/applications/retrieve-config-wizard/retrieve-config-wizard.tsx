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

import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { group } from "radash";

import { ApplicationTask, New, Task } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { hub } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { DecoratedApplication } from "../useDecoratedApplications";
import { Review } from "./review";

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

export const RetrieveConfigWizard: React.FC<IRetrieveConfigWizard> = ({
  applications = [],
  onClose,
  isOpen,
}: IRetrieveConfigWizard) => {
  const { t } = useTranslation();
  // const { pushNotification } = React.useContext(NotificationsContext);

  const { requestManifestFetch } = useFetchApplicationManifest({
    onSuccess: (task) => {
      console.log("task", task);
    },
    onError: (error) => {
      console.error("error", error);
    },
  });

  const methods = useForm<FormValues>({
    defaultValues: {
      ready: [],
      notReady: [],
    },
    resolver: yupResolver(
      yup.object({
        ready: yup.array().of(yup.object()),
        notReady: yup.array().of(yup.object()),
      })
    ),
    mode: "all",
  });
  const { reset, handleSubmit, watch } = methods;

  React.useEffect(() => {
    const { ready = [], notReady = [] } = group(applications, (app) =>
      app.isReadyForRetrieveConfigurations ? "ready" : "notReady"
    );
    reset({ ready, notReady });
  }, [applications, reset]);

  const handleCancel = () => {
    onClose();
  };

  const onSubmit = ({ ready }: FormValues) => {
    // TODO: Track the status of the task and report back to the user in a success/fail wizard step
    Promise.all(
      ready.map(async (app) => {
        await requestManifestFetch(app);
      })
    ).catch((error) => {
      console.error("Failed to submit tasks:", error);
    });
  };

  const onMove = (_current: WizardStepType) => {};

  const ready = watch("ready");
  if (ready.length === 0) {
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

const useFetchApplicationManifest = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (task: ApplicationTask) => void;
  onError?: (error: AxiosError) => void;
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);

  // TODO: Move this to a query hook and rest function pair.
  const { mutateAsync: createTask } = useMutation({
    mutationFn: (task: New<ApplicationTask>) =>
      axios
        .post<ApplicationTask>(hub`/tasks`, task)
        .then((response) => response.data),
  });

  // TODO: Move this to a query hook and rest function pair.
  const { mutateAsync: submitTaskgroup } = useMutation({
    mutationFn: (task: Task) =>
      axios.put<void>(hub`/tasks/${task.id}/submit`, { id: task.id }),
  });

  const requestManifestFetch = async (application: DecoratedApplication) => {
    const newTask: New<ApplicationTask> = {
      name: `${application.name}.${application.id}.application-manifest`,
      kind: "application-manifest",
      application: { id: application.id, name: application.name },
    };

    try {
      const task = await createTask(newTask);
      await submitTaskgroup(task);
      pushNotification({
        title: "Application manifest fetch task submitted",
        variant: "info",
      });
      onSuccess?.(task);
    } catch (error) {
      pushNotification({
        title: "Application manifest fetch task failed",
        message: getAxiosErrorMessage(error as AxiosError),
        variant: "danger",
      });
      onError?.(error as AxiosError);
    }
  };

  return {
    requestManifestFetch,
  };
};
