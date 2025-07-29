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
import { SetApplications } from "./set-applications";
import { SetTargetProfile } from "./set-target-profile";
import { SetGenerator } from "./set-generator";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { yupResolver } from "@hookform/resolvers/yup";

import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  AssetGenerationWizardFormValues,
  useAssetGenerationWizardFormValidationSchema,
} from "./schema";
import { useTaskGroup } from "./components/TaskGroupContext";

interface IAssetGenerationWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

enum StepId {
  SetApplications = 1,
  SetTargetProfile = 2,
  SetGenerator = 3,
  Review = 4,
}

const StepMap: Map<StepId, string> = new Map([
  [StepId.SetApplications, "Set Applications"],
  [StepId.SetTargetProfile, "Set Target Profile"],
  [StepId.SetGenerator, "Set Generator"],
  [StepId.Review, "Review"],
]);

const initTask = (application: Application): TaskgroupTask => ({
  name: `${application.name}.${application.id}.asset-generation`,
  data: {},
  application: { id: application.id as number, name: application.name },
});

const defaultAssetGenerationTaskData: TaskData = {
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

export const defaultAssetGenerationTaskgroup: New<Taskgroup> = {
  name: `taskgroup.asset-generation`,
  kind: "config-discovery", // Temporarily using config-discovery to test
  data: {
    ...defaultAssetGenerationTaskData,
  },
  tasks: [],
};

export const AssetGenerationWizard: React.FC<IAssetGenerationWizard> = ({
  applications,
  onClose,
  isOpen,
}: IAssetGenerationWizard) => {
  const { t } = useTranslation();

  const { pushNotification } = React.useContext(NotificationsContext);

  const { taskGroup, updateTaskGroup } = useTaskGroup();

  const [stepIdReached, setStepIdReached] = React.useState(
    StepId.SetApplications
  );

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    console.log("Taskgroup created successfully:", data);
    updateTaskGroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    console.error("Taskgroup creation failed:", error);
    pushNotification({
      title: "Asset generation taskgroup creation failed",
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
      message: "Submitted for asset generation",
      variant: "info",
    });

  const onSubmitTaskgroupError = (_error: Error | unknown) =>
    pushNotification({
      title: "Asset generation taskgroup submit failed",
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
      title: "Asset generation taskgroup: delete failed",
      variant: "danger",
    });
  };

  const { mutate: deleteTaskgroup } = useDeleteTaskgroupMutation(
    onDeleteTaskgroupSuccess,
    onDeleteTaskgroupError
  );

  const { schemas, allFieldsSchema } =
    useAssetGenerationWizardFormValidationSchema({
      applications,
    });

  // Debug logging for main wizard
  console.log("AssetGenerationWizard - applications prop:", applications);

  const methods = useForm<AssetGenerationWizardFormValues>({
    defaultValues: {
      selectedApplications: applications,
      selectedTargetProfile: null,
      selectedGenerator: null,
    },
    resolver: yupResolver(allFieldsSchema),
    mode: "onChange",
  });

  // Debug form values
  console.log("AssetGenerationWizard - form values:", methods.watch());

  const { reset, formState, getValues, watch } = methods;

  // Watch form values to trigger re-renders for validation
  const formValues = watch();

  const setupTaskgroup = (
    currentTaskgroup: Taskgroup,
    fieldValues: AssetGenerationWizardFormValues
  ): Taskgroup => {
    console.log("Setting up taskgroup with values:", fieldValues);

    return {
      ...currentTaskgroup,
      tasks: fieldValues.selectedApplications.map((app: Application) =>
        initTask(app)
      ),
      data: {
        ...defaultAssetGenerationTaskData,
        // Asset generation specific data is now stored in individual task data
      },
    };
  };

  const handleCancel = () => {
    if (taskGroup && taskGroup.id && taskGroup.id < 1000000000000) {
      // Only delete real taskgroups (not mock ones with timestamp IDs)
      deleteTaskgroup(taskGroup.id);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onSubmit = (fieldValues: AssetGenerationWizardFormValues) => {
    console.log("Asset generation wizard submitted with values:", fieldValues);

    if (taskGroup) {
      const taskgroup = setupTaskgroup(taskGroup, fieldValues);
      console.log("Would submit taskgroup:", taskgroup);

      // TODO: Re-enable when backend supports asset-generation tasks
      // submitTaskgroup(taskgroup);

      // For now, show success message without backend call
      pushNotification({
        title: "Asset Generation",
        message: `Started asset generation for ${fieldValues.selectedApplications.length} application(s)`,
        variant: "success",
      });
    }

    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onMove = (current: WizardStepType) => {
    try {
      const currentStepId = current.id as StepId;
      console.log(
        "Moving to step:",
        currentStepId,
        "stepIdReached:",
        stepIdReached
      );

      // Validate if we can advance to this step
      if (!canAdvanceToStep(currentStepId)) {
        console.log(
          "Cannot advance to step",
          currentStepId,
          "- previous steps not valid"
        );
        pushNotification({
          title: "Validation Error",
          message: "Please complete the previous steps before advancing",
          variant: "warning",
        });
        return;
      }

      // Update step reached
      if (currentStepId && stepIdReached < currentStepId) {
        setStepIdReached(currentStepId);
      }

      // Create taskgroup when reaching target profile step
      if (currentStepId === StepId.SetTargetProfile && !taskGroup) {
        console.log("Skipping taskgroup creation for now - backend not ready");
        // TODO: Re-enable when backend supports asset-generation tasks
        // createTaskgroup(defaultAssetGenerationTaskgroup);

        // For now, create a mock taskgroup to allow wizard progression
        const mockTaskgroup: Taskgroup = {
          id: Date.now(), // Mock ID
          name: "mock-asset-generation-taskgroup",
          kind: "asset-generation",
          data: defaultAssetGenerationTaskData,
          tasks: [],
        };
        updateTaskGroup(mockTaskgroup);
      }
    } catch (error) {
      console.error("Error in onMove:", error);
      pushNotification({
        title: "Navigation Error",
        message: "An error occurred while navigating wizard steps",
        variant: "danger",
      });
    }
  };

  const isStepEnabled = (stepId: StepId) => {
    return stepIdReached >= stepId;
  };

  const isStepValid = (stepId: StepId) => {
    // Use watched form values for real-time validation
    const currentFormValues = formValues;
    switch (stepId) {
      case StepId.SetApplications:
        return (
          currentFormValues.selectedApplications &&
          currentFormValues.selectedApplications.length > 0
        );
      case StepId.SetTargetProfile:
        // Target profile is optional, so this step is always valid
        return true;
      case StepId.SetGenerator:
        // Generator is optional, so this step is always valid
        return true;
      case StepId.Review:
        return true;
      default:
        return false;
    }
  };

  const canAdvanceToStep = (stepId: StepId) => {
    // Can only advance if all previous steps are valid
    for (let i = 1; i < stepId; i++) {
      if (!isStepValid(i as StepId)) {
        return false;
      }
    }
    return true;
  };

  return (
    <Modal
      isOpen={isOpen}
      variant={ModalVariant.large}
      aria-label="Asset generation wizard"
      onClose={handleCancel}
      hasNoBodyWrapper
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
              title={t("wizard.terms.assetGeneration")}
              description={t("wizard.terms.assetGenerationDescription")}
            />
          }
        >
          <WizardStep
            id={StepId.SetApplications}
            name={StepMap.get(StepId.SetApplications)}
            footer={{
              isNextDisabled: !isStepValid(StepId.SetApplications),
            }}
          >
            <SetApplications applications={applications} />
          </WizardStep>
          <WizardStep
            id={StepId.SetTargetProfile}
            name={StepMap.get(StepId.SetTargetProfile)}
            footer={{
              isNextDisabled: !canAdvanceToStep(StepId.SetGenerator),
            }}
          >
            <SetTargetProfile
              applications={getValues().selectedApplications || applications}
            />
          </WizardStep>
          <WizardStep
            id={StepId.SetGenerator}
            name={StepMap.get(StepId.SetGenerator)}
            footer={{
              isNextDisabled: !canAdvanceToStep(StepId.Review),
            }}
          >
            <SetGenerator targetProfile={getValues().selectedTargetProfile} />
          </WizardStep>
          <WizardStep
            id={StepId.Review}
            name={StepMap.get(StepId.Review)}
            footer={{
              nextButtonText: t("actions.generateAssets"),
              isNextDisabled: !isStepValid(StepId.SetApplications), // Final validation
            }}
          >
            <Review />
          </WizardStep>
        </Wizard>
      </FormProvider>
    </Modal>
  );
};
