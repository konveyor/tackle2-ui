import { EmptyObject, ApplicationManifestTask, New } from "@app/api/models";
import { useCreateTaskMutation } from "@app/queries/tasks";
import { DecoratedApplication } from "../useDecoratedApplications";

export const useStartFetchApplicationManifest = () => {
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
