import { useCallback, useContext, useRef } from "react";
import { sift, unique } from "radash";

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
 * Build the taskgroup data from wizard state for profile-based analysis.
 * Only includes the profile ID and tagger/verbosity settings.
 */
const buildProfileTaskgroupData = (
  currentTaskgroup: Taskgroup,
  wizardState: WizardState,
  analyzableApplications: Application[]
): Taskgroup => {
  if (!wizardState.flowMode.selectedProfile) {
    throw new Error("Profile mode requires a selected profile");
  }

  return {
    ...currentTaskgroup,
    tasks: analyzableApplications.map(initTask),
    data: {
      tagger: {
        enabled: wizardState.options.autoTaggingEnabled,
      },
      verbosity: wizardState.options.advancedAnalysisEnabled ? 1 : 0,
      profile: toRef(wizardState.flowMode.selectedProfile),
      // mode, scope, and rules are NOT included - hub will use the profile's settings
    },
  };
};

/**
 * Build the taskgroup data from wizard state for manual analysis.
 */
const buildManualTaskgroupData = (
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
    wizardState.targets.selectedTargets.map(([target]) => target.ruleset)
  );

  // TODO: Review this logic for included labels for all potential sources of labels
  const allLabels = unique(
    sift([
      ...wizardState.targets.selectedTargets
        .flatMap(([target, targetLabel]) => targetLabel || target.labels)
        .map((targetLabel) => targetLabel?.label),

      ...wizardState.customRules.customLabels.map(({ label }) => label),

      ...wizardState.options.additionalTargetLabels.map(({ label }) => label),
      ...wizardState.options.additionalSourceLabels.map(({ label }) => label),
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

        // labels from seeded targets, custom targets, custom rules, and advanced options
        labels: {
          included: allLabels,
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

/**
 * Build the taskgroup data from wizard state.
 * Routes to profile or manual build function based on flowMode.
 */
const buildTaskgroupData = (
  currentTaskgroup: Taskgroup,
  wizardState: WizardState,
  analyzableApplications: Application[],
  identities: Identity[]
): Taskgroup => {
  if (wizardState.flowMode.flowMode === "profile") {
    return buildProfileTaskgroupData(
      currentTaskgroup,
      wizardState,
      analyzableApplications
    );
  }

  return buildManualTaskgroupData(
    currentTaskgroup,
    wizardState,
    analyzableApplications,
    identities
  );
};

export const useTaskGroupManager = () => {
  const { pushNotification } = useContext(NotificationsContext);
  const taskGroupRef = useRef<Taskgroup | null>(null);
  const creationPromiseRef = useRef<Promise<Taskgroup> | null>(null);

  // Create taskgroup mutation
  const { mutateAsync: createTaskgroupAsync } = useCreateTaskgroupMutation(
    undefined,
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
      taskGroupRef.current = null;
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
      taskGroupRef.current = null;
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
   * Uses refs to prevent race conditions from concurrent calls.
   */
  const ensureTaskGroup = useCallback(
    async (taskgroupData?: New<Taskgroup>): Promise<Taskgroup> => {
      // Return existing taskgroup if available (ref avoids stale closure)
      if (taskGroupRef.current !== null) {
        return taskGroupRef.current;
      }

      // If creation is in progress, wait for the same promise
      if (creationPromiseRef.current !== null) {
        return creationPromiseRef.current;
      }

      // Start creation and store the promise for concurrent callers
      creationPromiseRef.current = createTaskgroupAsync(
        taskgroupData || DEFAULT_TASKGROUP
      );

      try {
        const newTaskGroup = await creationPromiseRef.current;
        taskGroupRef.current = newTaskGroup;
        return newTaskGroup;
      } finally {
        creationPromiseRef.current = null;
      }
    },
    [createTaskgroupAsync]
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
      const baseTaskgroup = taskGroupRef.current ?? (await ensureTaskGroup());
      const builtTaskgroup = buildTaskgroupData(
        baseTaskgroup,
        wizardState,
        analyzableApplications,
        identities
      );
      submitTaskgroupMutate(builtTaskgroup);
    },
    [ensureTaskGroup, submitTaskgroupMutate]
  );

  /**
   * Cancels the current taskgroup, deleting it from the server if it exists.
   * Cleans up the local state.
   */
  const cancelAnalysis = useCallback(() => {
    if (taskGroupRef.current !== null) {
      deleteTaskgroupMutate(taskGroupRef.current.id);
    }
  }, [deleteTaskgroupMutate]);

  return {
    ensureTaskGroup,
    submitAnalysis,
    cancelAnalysis,
  };
};
