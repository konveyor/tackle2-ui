import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardStep,
  WizardStepType,
  WizardHeader,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import {
  Application,
  New,
  TaskData,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { Review } from "./review";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { yupResolver } from "@hookform/resolvers/yup";

import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  RetrieveConfigWizardFormValues,
  useRetrieveConfigWizardFormValidationSchema,
} from "./schema";
import { useTaskGroup } from "./components/TaskGroupContext";
import { DecoratedApplication } from "../useDecoratedApplications";

interface IRetrieveConfigWizard {
  applications?: DecoratedApplication[];
  onClose: () => void;
  isOpen: boolean;
}

enum StepId {
  Review = 1,
}

const initTask = (application: Application): TaskgroupTask => ({
  name: `${application.name}.${application.id}.config-discovery`,
  data: {
    kind: "config-discovery",
    platform: application.platform || null,
    repository: application.repository || null,
  },
  application: { id: application.id as number, name: application.name },
});

const defaultConfigTaskData: TaskData = {
  tagger: {
    enabled: false,
  },
  verbosity: 0,
  mode: {
    binary: false,
    withDeps: false,
    artifact: "",
  },
  targets: [],
  sources: [],
  scope: {
    withKnownLibs: false,
    packages: {
      included: [],
      excluded: [],
    },
  },
  rules: {
    path: "",
    labels: {
      included: [],
      excluded: [],
    },
  },
};

export const defaultConfigTaskgroup: New<Taskgroup> = {
  name: `taskgroup.config-discovery`,
  kind: "config-discovery",
  data: {
    ...defaultConfigTaskData,
  },
  tasks: [],
};

export const RetrieveConfigWizard: React.FC<IRetrieveConfigWizard> = ({
  applications = [],
  onClose,
  isOpen,
}: IRetrieveConfigWizard) => {
  const { t } = useTranslation();

  const { pushNotification } = React.useContext(NotificationsContext);

  const { taskGroup, updateTaskGroup } = useTaskGroup();

  // Filter applications that have source platforms
  const validApplications = React.useMemo(
    () => applications.filter((app) => app.id && app?.name),
    [applications]
  );

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    updateTaskGroup(data);
  };

  const onCreateTaskgroupError = (_error: Error | unknown) => {
    pushNotification({
      title: "Configuration discovery taskgroup creation failed",
      variant: "danger",
    });
    onClose();
  };

  const { mutate: createTaskgroup } = useCreateTaskgroupMutation(
    onCreateTaskgroupSuccess,
    onCreateTaskgroupError
  );

  const onSubmitTaskgroupSuccess = (_data: Taskgroup) =>
    pushNotification({
      title: "Applications",
      message: "Submitted for configuration retrieval",
      variant: "info",
    });

  const onSubmitTaskgroupError = (_error: Error | unknown) =>
    pushNotification({
      title: t("message.configDiscoveryTaskgroupCreationFailed"),
      variant: "danger",
    });

  const { mutate: submitTaskgroup } = useSubmitTaskgroupMutation(
    onSubmitTaskgroupSuccess,
    onSubmitTaskgroupError
  );

  const onDeleteTaskgroupSuccess = () => {
    updateTaskGroup(null);
  };

  const onDeleteTaskgroupError = (_error: Error | unknown) => {
    pushNotification({
      title: t("message.configDiscoveryTaskgroupSubmitFailed"),
      variant: "danger",
    });
  };

  const { mutate: deleteTaskgroup } = useDeleteTaskgroupMutation(
    onDeleteTaskgroupSuccess,
    onDeleteTaskgroupError
  );

  const { allFieldsSchema } = useRetrieveConfigWizardFormValidationSchema({
    applications: validApplications,
  });

  const methods = useForm<RetrieveConfigWizardFormValues>({
    defaultValues: {
      selectedApplications: [...applications],
    },
    resolver: yupResolver(allFieldsSchema),
    mode: "all",
    reValidateMode: "onSubmit",
  });

  const { reset } = methods;

  // Update form when applications change
  React.useEffect(() => {
    reset({
      selectedApplications: applications,
    });
  }, [applications, reset]);

  const setupTaskgroup = (
    currentTaskgroup: Taskgroup,
    fieldValues: RetrieveConfigWizardFormValues
  ): Taskgroup => {
    return {
      ...currentTaskgroup,
      tasks: fieldValues.selectedApplications.map((app: Application) =>
        initTask(app)
      ),
      data: {
        ...defaultConfigTaskData,
        // Add any specific configuration discovery data here
      },
    };
  };

  const handleCancel = () => {
    if (taskGroup && taskGroup.id) {
      deleteTaskgroup(taskGroup.id);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onSubmit = (fieldValues: RetrieveConfigWizardFormValues) => {
    if (taskGroup) {
      const taskgroup = setupTaskgroup(taskGroup, fieldValues);
      submitTaskgroup(taskgroup);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onMove = (current: WizardStepType) => {
    if (current.id === StepId.Review) {
      if (!taskGroup) {
        createTaskgroup(defaultConfigTaskgroup);
      }
    }
  };

  if (validApplications.length === 0) {
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
          onSave={methods.handleSubmit(onSubmit)}
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
        </Wizard>
      </FormProvider>
    </Modal>
  );
};
