import {
  JsonDocument,
  New,
  PlatformApplicationImportTask,
  SourcePlatform,
} from "@app/api/models";
import { useCreateTaskMutation } from "@app/queries/tasks";

export const useStartPlatformApplicationImport = () => {
  const { mutateAsync: createTask } = useCreateTaskMutation<
    JsonDocument,
    PlatformApplicationImportTask
  >();

  const createAndSubmitTask = async (
    platform: SourcePlatform,
    filters?: JsonDocument
  ): Promise<{
    success?: {
      task: PlatformApplicationImportTask;
      platform: SourcePlatform;
    };
    failure?: {
      message: string;
      cause: Error;
      platform: SourcePlatform;
      newTask: New<PlatformApplicationImportTask>;
    };
  }> => {
    const newTask: New<PlatformApplicationImportTask> = {
      name: `${platform.name}.${platform.id}.application-import`,
      kind: "application-import",
      platform: { id: platform.id, name: platform.name },
      state: "Ready",
      data: filters ? { filter: filters } : undefined,
    };

    try {
      const task = await createTask(newTask);
      return { success: { task, platform } };
    } catch (error) {
      return {
        failure: {
          message: "Failed to submit the platform application import task",
          cause: error as Error,
          platform,
          newTask,
        },
      };
    }
  };

  const submitTask = async (
    platform: SourcePlatform,
    filters?: JsonDocument
  ) => {
    const results = await Promise.allSettled(
      [platform].map(async (p) => createAndSubmitTask(p, filters))
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
    submitTask,
  };
};
