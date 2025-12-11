import { useCallback, useContext, useState } from "react";

import {
  AnalysisTaskData,
  Application,
  Identity,
  New,
  Ref,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { getParsedLabel } from "@app/utils/rules-utils";

import { WizardState } from "./useWizardReducer";

const DEFAULT_TASK_DATA: AnalysisTaskData = {
  tagger: {
    enabled: true,
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
};

const DEFAULT_TASKGROUP: New<Taskgroup> = {
  name: `taskgroup.analyzer`,
  kind: "analyzer",
  data: {
    ...DEFAULT_TASK_DATA,
  },
  tasks: [],
};

const initTask = (application: Application): TaskgroupTask => {
  return {
    name: `${application.name}.${application.id}.analyzer`,
    data: {},
    application: { id: application.id as number, name: application.name },
  };
};

/**
 * Build the taskgroup data from wizard state
 */
const buildTaskgroupData = (
  currentTaskgroup: Taskgroup,
  wizardState: WizardState,
  analyzableApplications: Application[],
  identities: Identity[]
): Taskgroup => {
  const matchingSourceCredential = identities.find(
    (identity) =>
      identity.name === wizardState.customRules.associatedCredentials
  );

  const ruleSetRefsFromSelectedTargets: Ref[] =
    wizardState.targets.selectedTargets
      .map(({ ruleset }) => ruleset)
      .filter(Boolean)
      .map<Ref>(({ id, name }) => ({ id: id ?? 0, name: name ?? "" }));

  return {
    ...currentTaskgroup,
    tasks: analyzableApplications.map((app: Application) => initTask(app)),
    data: {
      ...DEFAULT_TASK_DATA,
      verbosity: wizardState.options.advancedAnalysisEnabled ? 1 : 0,
      tagger: {
        enabled: wizardState.options.autoTaggingEnabled,
      },
      mode: {
        binary: wizardState.mode.mode.includes("binary"),
        withDeps: wizardState.mode.mode === "source-code-deps",
        artifact: wizardState.mode.artifact?.name
          ? `/binary/${wizardState.mode.artifact.name}`
          : "",
      },
      scope: {
        withKnownLibs: wizardState.scope.withKnownLibs.includes("oss")
          ? true
          : false,
        packages: {
          included: wizardState.scope.withKnownLibs.includes("select")
            ? wizardState.scope.includedPackages
            : [],
          excluded: wizardState.scope.hasExcludedPackages
            ? wizardState.scope.excludedPackages
            : [],
        },
      },
      rules: {
        labels: {
          included: Array.from(
            new Set<string>([
              ...wizardState.targets.selectedTargetLabels
                .filter(
                  (label) => getParsedLabel(label.label).labelType !== "source"
                )
                .map((label) => label.label)
                .filter(Boolean),
              ...wizardState.options.selectedSourceLabels
                .map((label) => label.label)
                .filter(Boolean),
            ])
          ),
          excluded: wizardState.options.excludedLabels,
        },

        path:
          wizardState.customRules.customRulesFiles.length > 0 ? "/rules" : "",

        ...(wizardState.customRules.rulesKind === "repository" && {
          repository: {
            kind: wizardState.customRules?.repositoryType,
            url: wizardState.customRules?.sourceRepository?.trim(),
            branch: wizardState.customRules?.branch?.trim(),
            path: wizardState.customRules?.rootPath?.trim(),
          },
        }),
        ...(wizardState.customRules.rulesKind === "repository" &&
          matchingSourceCredential && {
            identity: {
              id: matchingSourceCredential.id,
              name: matchingSourceCredential.name,
            },
          }),
        ...(ruleSetRefsFromSelectedTargets.length > 0 && {
          ruleSets: ruleSetRefsFromSelectedTargets,
        }),
      },
    },
  };
};

export const useTaskGroupManager = () => {
  const { pushNotification } = useContext(NotificationsContext);
  const [taskGroup, setTaskGroup] = useState<Taskgroup | null>(null);

  // Create taskgroup mutation
  const { mutateAsync: createTaskgroupAsync } = useCreateTaskgroupMutation(
    (data: Taskgroup) => {
      setTaskGroup(data);
    },
    (error: Error | unknown) => {
      console.error("Taskgroup creation failed: ", error);
      pushNotification({
        title: "Taskgroup creation failed",
        variant: "danger",
      });
    }
  );

  // Submit taskgroup mutation
  const { mutate: submitTaskgroupMutate } = useSubmitTaskgroupMutation(
    (_data: Taskgroup) => {
      pushNotification({
        title: "Applications",
        message: "Submitted for analysis",
        variant: "info",
      });
    },
    (_error: Error | unknown) => {
      pushNotification({
        title: "Taskgroup submit failed",
        variant: "danger",
      });
    }
  );

  // Delete taskgroup mutation
  const { mutate: deleteTaskgroupMutate } = useDeleteTaskgroupMutation(
    () => {
      setTaskGroup(null);
    },
    (_error: Error | unknown) => {
      pushNotification({
        title: "Taskgroup: delete failed",
        variant: "danger",
      });
    }
  );

  /**
   * Ensures a taskgroup exists, creating one if needed.
   * Returns the existing or newly created taskgroup.
   */
  const ensureTaskGroup = useCallback(
    async (taskgroupData?: New<Taskgroup>): Promise<Taskgroup> => {
      if (taskGroup) {
        return taskGroup;
      }
      const newTaskGroup = await createTaskgroupAsync(
        taskgroupData || DEFAULT_TASKGROUP
      );
      return newTaskGroup;
    },
    [taskGroup, createTaskgroupAsync]
  );

  /**
   * Prepares the taskgroup with wizard state data and submits it for analysis.
   * Handles all the data transformation internally.
   */
  const submitAnalysis = useCallback(
    (
      wizardState: WizardState,
      analyzableApplications: Application[],
      identities: Identity[]
    ) => {
      if (!taskGroup) {
        console.error("Cannot submit analysis: no taskgroup exists");
        pushNotification({
          title: "Cannot submit analysis",
          message: "No taskgroup has been created",
          variant: "danger",
        });
        return;
      }

      const preparedTaskgroup = buildTaskgroupData(
        taskGroup,
        wizardState,
        analyzableApplications,
        identities
      );
      submitTaskgroupMutate(preparedTaskgroup);
      setTaskGroup(null);
    },
    [taskGroup, submitTaskgroupMutate, pushNotification]
  );

  /**
   * Cancels the current taskgroup, deleting it from the server if it exists.
   * Cleans up the local state.
   */
  const cancelAnalysis = useCallback(() => {
    if (taskGroup?.id) {
      deleteTaskgroupMutate(taskGroup.id);
    }
    setTaskGroup(null);
  }, [taskGroup, deleteTaskgroupMutate]);

  /**
   * Gets the current taskgroup ID if one exists.
   * Useful for file upload operations that need the taskgroup ID.
   */
  const getTaskGroupId = useCallback((): number | undefined => {
    return taskGroup?.id;
  }, [taskGroup]);

  return {
    ensureTaskGroup,
    submitAnalysis,
    cancelAnalysis,
    getTaskGroupId,
  };
};
