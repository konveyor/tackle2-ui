import { useMemo } from "react";
import {
  Application,
  Archetype,
  AssessmentWithSectionOrder,
  Identity,
  TaskDashboard,
} from "@app/api/models";
import { group, listify, mapEntries, unique } from "radash";
import { TaskStates } from "@app/queries/tasks";
import { universalComparator } from "@app/utils/utils";
import {
  ApplicationAssessmentStatus,
  buildApplicationAssessmentStatus,
} from "@app/utils/application-assessment-status";
import { useFetchIdentities } from "@app/queries/identities";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchAssessments } from "@app/queries/assessments";

export interface TasksGroupedByKind {
  [key: string]: TaskDashboard[];
}

/**
 * Characterize the status of set of the most current task for each kinds of task
 * associated with an application.
 */
export type ApplicationTasksStatus =
  | "None"
  | "Running"
  | "Queued"
  | "Failed"
  | "Canceled"
  | "Success"
  | "SuccessWithErrors";

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
    latestHasSuccessWithErrors: boolean;

    /** The most recently created `kind === "analyzer"` task for the application */
    currentAnalyzer: TaskDashboard | undefined;
  };
  tasksStatus: ApplicationTasksStatus;

  assessmentStatus: ApplicationAssessmentStatus;

  /** Contain directly referenced versions of `Ref[]` Application props */
  direct: {
    identities?: Identity[];
    archetypes?: Archetype[];
  };
}

/**
 * Take an array of `Tasks`, group by application id and then by task kind.
 */
const groupTasks = (tasks: TaskDashboard[]) => {
  const byApplicationId = group(tasks, (task) => task.application.id) as Record<
    number,
    TaskDashboard[]
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
 * Step through the task data of an application and return its summarized task status.
 */
const chooseApplicationTaskStatus = ({
  tasks,
}: DecoratedApplication): ApplicationTasksStatus => {
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
 * Decorate a set of REST Applications with information useful to the components on the
 * application table.
 */
const decorateApplications = (
  applications: Application[],
  tasks: TaskDashboard[],
  identities: Identity[],
  archetypes: Archetype[],
  assessments: AssessmentWithSectionOrder[]
) => {
  const { tasksById, tasksByIdByKind } = groupTasks(tasks);

  const decorated = applications.map((app: Application) => {
    const tasksByKind = tasksByIdByKind[app.id] ?? [];
    const latest = listify(tasksByKind, (_kind, tasks) => tasks[0]);

    const da: DecoratedApplication = {
      ...app,
      _: app,

      tasksByKind,
      tasksStatus: "None",
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
        latestHasSuccessWithErrors: latest.some((task) =>
          TaskStates.SuccessWithErrors.includes(task.state ?? "")
        ),

        currentAnalyzer: tasksByKind["analyzer"]?.[0],
      },

      assessmentStatus: buildApplicationAssessmentStatus(
        app,
        archetypes,
        assessments
      ),

      direct: {
        identities: app.identities
          ?.map(({ id: id1 }) => identities.find(({ id: id2 }) => id1 === id2))
          ?.filter(Boolean),

        archetypes: app.archetypes
          ?.map(({ id: id1 }) => archetypes.find(({ id: id2 }) => id1 === id2))
          ?.filter(Boolean),
      },
    };

    da.tasksStatus = chooseApplicationTaskStatus(da);
    return da;
  });

  return decorated;
};

export const useDecoratedApplications = (
  applications: Application[],
  tasks: TaskDashboard[]
) => {
  const { identities } = useFetchIdentities();
  const { assessments } = useFetchAssessments();
  const { archetypes } = useFetchArchetypes();

  const decoratedApplications = useMemo(
    () =>
      decorateApplications(
        applications,
        tasks,
        identities,
        archetypes,
        assessments
      ),
    [applications, tasks, identities, archetypes, assessments]
  );

  const applicationNames = useMemo(
    () => applications.map((app) => app.name).sort(universalComparator),
    [applications]
  );

  const referencedArchetypeRefs = useMemo(
    () =>
      unique(
        applications.flatMap((app) => app.archetypes).filter(Boolean),
        ({ id, name }) => `${id}:${name}`
      ).sort((a, b) => universalComparator(a.name, b.name)),
    [applications]
  );

  const referencedBusinessServiceRefs = useMemo(
    () =>
      unique(
        applications.flatMap((app) => app.businessService).filter(Boolean),
        ({ id, name }) => `${id}:${name}`
      ).sort((a, b) => universalComparator(a.name, b.name)),
    [applications]
  );

  return {
    applications: decoratedApplications,
    applicationNames,
    referencedArchetypeRefs,
    referencedBusinessServiceRefs,
  };
};
