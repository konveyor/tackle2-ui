import { useMemo } from "react";
import { group, listify, mapEntries } from "radash";
import { SourcePlatform, TaskDashboard } from "@app/api/models";
import { TaskStates, useFetchTaskDashboard } from "@app/queries/tasks";
import { useFetchPlatforms } from "@app/queries/platforms";

export interface TasksGroupedByKind {
  [key: string]: TaskDashboard[];
}

/**
 * Characterize the status of set of the most current task for each kinds of task
 * associated with a platform.
 */
export type SourcePlatformTasksStatus =
  | "None"
  | "Running"
  | "Queued"
  | "Failed"
  | "Canceled"
  | "Success"
  | "SuccessWithErrors";

export interface SourcePlatformWithTasks extends SourcePlatform {
  tasks: {
    tasksByKind: TasksGroupedByKind;
    tasksStatus: SourcePlatformTasksStatus;
    exist: boolean;

    latestHasCanceled: boolean;
    latestHasFailed: boolean;
    latestHasQueued: boolean;
    latestHasRunning: boolean;
    latestHasSuccess: boolean;
    latestHasSuccessWithErrors: boolean;
  };
}

/**
 * Take an array of `Tasks`, group by platform id and then by task kind.
 */
const groupPlatformTasks = (tasks: TaskDashboard[]) => {
  const byPlatformId = group(
    tasks.filter((task) => !!task.platform),
    (task) => task.platform!.id
  ) as Record<number, TaskDashboard[]>;

  const groupedByIdByKind = mapEntries(byPlatformId, (id, tasks) => [
    id,
    {
      ...group(tasks, (task) => task.kind ?? task.addon ?? ""),
    } as TasksGroupedByKind,
  ]);

  return {
    tasksById: byPlatformId,
    tasksByIdByKind: groupedByIdByKind,
  };
};

/**
 * Step through the task data of a platform and return its summarized task status.
 */
const choosePlatformTaskStatus = ({
  tasks,
}: SourcePlatformWithTasks): SourcePlatformTasksStatus => {
  return !tasks.exist
    ? "None"
    : tasks.latestHasRunning
      ? "Running"
      : tasks.latestHasQueued
        ? "Queued"
        : tasks.latestHasFailed
          ? "Failed"
          : tasks.latestHasCanceled
            ? "Canceled"
            : tasks.latestHasSuccessWithErrors
              ? "SuccessWithErrors"
              : "Success";
};

/**
 * Decorate a set of REST Platforms with information useful to the components on the
 * platform table.
 */
const decoratePlatforms = (
  platforms: SourcePlatform[],
  tasks: TaskDashboard[]
) => {
  const { tasksById, tasksByIdByKind } = groupPlatformTasks(tasks);

  const decorated = platforms.map((platform: SourcePlatform) => {
    const tasksByKind = tasksByIdByKind[platform.id] ?? [];
    const latest = listify(tasksByKind, (_kind, tasks) => tasks[0]);

    const da: SourcePlatformWithTasks = {
      ...platform,

      tasks: {
        tasksByKind,
        tasksStatus: "None",
        exist: (tasksById[platform.id]?.length ?? 0) > 0,

        latestHasCanceled: latest.some((task) =>
          TaskStates.Canceled.includes(task.state ?? "")
        ),
        latestHasFailed: latest.some((task) =>
          TaskStates.Failed.includes(task.state ?? "")
        ),
        latestHasQueued: latest.some((task) =>
          TaskStates.Queued.includes(task.state ?? "")
        ),
        latestHasRunning: latest.some((task) =>
          TaskStates.Running.includes(task.state ?? "")
        ),
        latestHasSuccess: latest.some((task) =>
          TaskStates.Success.includes(task.state ?? "")
        ),
        latestHasSuccessWithErrors: latest.some((task) =>
          TaskStates.SuccessWithErrors.includes(task.state ?? "")
        ),
      },
    };

    da.tasks.tasksStatus = choosePlatformTaskStatus(da);
    return da;
  });

  return decorated;
};

export const useFetchPlatformsWithTasks = (refetchDisabled: boolean) => {
  const { platforms, isFetching, isSuccess, error } = useFetchPlatforms();
  const { tasks } = useFetchTaskDashboard(refetchDisabled);

  const decoratedPlatforms = useMemo(
    () => decoratePlatforms(platforms, tasks),
    [platforms, tasks]
  );

  // const platformNames = useMemo(
  //   () => platforms.map((platform) => platform.name).sort(universalComparator),
  //   [platforms]
  // );

  return {
    platforms: decoratedPlatforms,
    // platformNames,
    isFetching,
    isSuccess,
    error,
  };
};
