import { useMemo } from "react";
import { Application, Identity, Task } from "@app/api/models";
import { group, listify, mapEntries, unique } from "radash";
import { TaskStates } from "@app/queries/tasks";
import { universalComparator } from "@app/utils/utils";
import { useFetchIdentities } from "@app/queries/identities";

export interface TasksGroupedByKind {
  [key: string]: Task[];
}

export interface DecoratedApplication extends Application {
  /** reference to the Application being decorated */
  _: Application;

  tasksByKind: TasksGroupedByKind;
  tasks: {
    exist: boolean;
    latestHasCanceled: boolean;
    latestHasFailed: boolean;
    latestHasQueued: boolean;
    latestHasRunning: boolean;
    latestHasSuccess: boolean;
    currentAnalyzer: Task | undefined;
  };

  identities?: Identity[];
}

/**
 * Take an array of `Tasks`, group by application id and then by task kind.
 */
const groupTasks = (tasks: Task[]) => {
  const byApplicationId = group(tasks, (task) => task.application.id) as Record<
    number,
    Task[]
  >;

  const groupedByIdByKind = mapEntries(byApplicationId, (id, tasks) => [
    id,
    {
      ...group(tasks, (task) => task.kind ?? task.addon ?? ""),
    } as TasksGroupedByKind,
  ]);

  return {
    tasksById: byApplicationId,
    tasksByIdByKind: groupedByIdByKind,
  };
};

/**
 * Decorate a set of REST Applications with information useful to the components on the
 * application table.
 */
const decorateApplications = (
  applications: Application[],
  tasks: Task[],
  identities: Identity[]
) => {
  const { tasksById, tasksByIdByKind } = groupTasks(tasks);

  const decorated = applications.map((app: Application) => {
    const tasksByKind = tasksByIdByKind[app.id] ?? [];
    const latest = listify(tasksByKind, (_kind, tasks) => tasks[0]);

    return {
      ...app,
      _: app,

      tasksByKind,
      tasks: {
        exist: (tasksById[app.id]?.length ?? 0) > 0,

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

        currentAnalyzer: tasksByKind["analyzer"]?.[0],
      },

      identities: app.identities
        ?.map((identity) => identities.find(({ id }) => id === identity.id))
        ?.filter(Boolean),
    } as DecoratedApplication;
  });

  return decorated;
};

export const useDecoratedApplications = (
  applications: Application[],
  tasks: Task[]
) => {
  const { identities } = useFetchIdentities();

  const decoratedApplications = useMemo(
    () => decorateApplications(applications, tasks, identities),
    [applications, tasks, identities]
  );

  const applicationNames = useMemo(
    () => applications.map((app) => app.name).sort(universalComparator),
    [applications]
  );

  const referencedArchetypeRefs = useMemo(
    () =>
      unique(
        applications
          .flatMap((app) => app.archetypes)
          .filter(Boolean)
          .sort(universalComparator)
      ),
    [applications]
  );

  const referencedBusinessServiceRefs = useMemo(
    () =>
      unique(
        applications
          .flatMap((app) => app.businessService)
          .filter(Boolean)
          .sort(universalComparator)
      ),
    [applications]
  );

  return {
    applications: decoratedApplications,
    applicationNames,
    referencedArchetypeRefs,
    referencedBusinessServiceRefs,
  };
};
