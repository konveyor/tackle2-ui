import {
  ApplicationAssetGenerationTask,
  AssetGenerationTaskData,
  JsonDocument,
  New,
  TargetProfile,
} from "@app/api/models";
import { useCreateTaskMutation } from "@app/queries/tasks";
import { toRef, toRefs } from "@app/utils/model-utils";

import { DecoratedApplication } from "../useDecoratedApplications";

export const useStartApplicationAssetGeneration = () => {
  const { mutateAsync: createTask } = useCreateTaskMutation<
    AssetGenerationTaskData,
    ApplicationAssetGenerationTask
  >();

  const createAndSubmitTask = async (
    application: DecoratedApplication,
    targetProfile: TargetProfile,
    parameters?: JsonDocument,
    renderTemplates?: boolean
  ): Promise<{
    success?: {
      task: ApplicationAssetGenerationTask;
      application: DecoratedApplication;
    };
    failure?: {
      message: string;
      cause: Error;
      application: DecoratedApplication;
      newTask: New<ApplicationAssetGenerationTask>;
    };
  }> => {
    const newTask: New<ApplicationAssetGenerationTask> = {
      name: `${application.name}.${application.id}.asset-generation`,
      kind: "asset-generation",
      application: toRef(application),
      state: "Ready",
      data: {
        profiles: toRefs([targetProfile]),
        params: parameters ?? {},
        render: renderTemplates ?? false,
      },
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

  const submitTasks = async (
    applications: DecoratedApplication[],
    targetProfile: TargetProfile,
    parameters?: JsonDocument,
    renderTemplates?: boolean
  ) => {
    const results = await Promise.allSettled(
      applications.map(async (a) =>
        createAndSubmitTask(a, targetProfile, parameters, renderTemplates)
      )
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
