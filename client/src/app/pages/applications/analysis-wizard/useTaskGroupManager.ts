import { useCallback, useContext, useState } from "react";

import {
  AnalysisTaskData,
  Application,
  Identity,
  New,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { toRef, toRefs } from "@app/utils/model-utils";
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
    application: toRef(application),
    data: {},
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
  const customRulesIdentity =
    wizardState.customRules.rulesKind === "repository" &&
    toRef(
      identities.find(
        (identity) =>
          identity.name === wizardState.customRules.associatedCredentials
      )
    );

  const targetRuleSetRefs = toRefs(
    wizardState.targets.selectedTargets.map(({ ruleset }) => ruleset)
  );

  // TODO: Review this logic for included labels for all potential sources of labels
  const uniqIncludedLabels = Array.from(
    new Set<string>([
      ...wizardState.targets.selectedTargetLabels
        .filter((label) => getParsedLabel(label.label).labelType !== "source")
        .map((label) => label.label)
        .filter(Boolean),
      ...wizardState.options.selectedSourceLabels
        .map((label) => label.label)
        .filter(Boolean),
    ])
  );

  return {
    ...currentTaskgroup,
    tasks: analyzableApplications.map(initTask),

    data: {
      ...DEFAULT_TASK_DATA,

      tagger: {
        enabled: wizardState.options.autoTaggingEnabled,
      },
      verbosity: wizardState.options.advancedAnalysisEnabled ? 1 : 0,
      mode: {
        withDeps: wizardState.mode.mode === "source-code-deps",
        binary: wizardState.mode.mode.includes("binary"),
        artifact: wizardState.mode.artifact?.name
          ? `/binary/${wizardState.mode.artifact.name}`
          : "",
      },
      // targets?
      // sources?
      scope: {
        withKnownLibs: wizardState.scope.withKnownLibs.includes("oss"),
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
        // custom rules uploaded files
        path:
          wizardState.customRules.customRulesFiles.length > 0 ? "/rules" : "",

        // custom rules repository and associated credentials
        ...(wizardState.customRules.rulesKind === "repository" && {
          repository: {
            kind: wizardState.customRules?.repositoryType,
            url: wizardState.customRules?.sourceRepository?.trim(),
            branch: wizardState.customRules?.branch?.trim(),
            path: wizardState.customRules?.rootPath?.trim(),
          },
        }),
        ...(customRulesIdentity && {
          identity: customRulesIdentity,
        }),

        // labels from seeded targets, custom targets, options, and custom rules
        labels: {
          included: uniqIncludedLabels,
          excluded: wizardState.options.excludedLabels,
        },

        // rulesets from selected custom targets (All custom targets have a ruleset, but repository
        // custom targets do not have labels. Include the ruleSets to ensure all custom targets are
        // included.)
        ...(targetRuleSetRefs.length > 0 && {
          ruleSets: targetRuleSetRefs,
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
      setTaskGroup(null);
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
      if (taskGroup !== null) {
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
    async (
      wizardState: WizardState,
      analyzableApplications: Application[],
      identities: Identity[]
    ) => {
      const baseTaskgroup = taskGroup ?? (await ensureTaskGroup());

      const preparedTaskgroup = buildTaskgroupData(
        baseTaskgroup,
        wizardState,
        analyzableApplications,
        identities
      );
      submitTaskgroupMutate(preparedTaskgroup);
      setTaskGroup(null);
    },
    [taskGroup, ensureTaskGroup, submitTaskgroupMutate]
  );

  /**
   * Cancels the current taskgroup, deleting it from the server if it exists.
   * Cleans up the local state.
   */
  const cancelAnalysis = useCallback(() => {
    if (taskGroup !== null) {
      deleteTaskgroupMutate(taskGroup.id);
      setTaskGroup(null);
    }
  }, [taskGroup, deleteTaskgroupMutate]);

  return {
    ensureTaskGroup,
    submitAnalysis,
    cancelAnalysis,
  };
};
