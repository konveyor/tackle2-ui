import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  Truncate,
  Wizard,
  WizardHeader,
  WizardStep,
  WizardStepType,
} from "@patternfly/react-core";

import {
  AnalysisTaskData,
  Application,
  New,
  Ref,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";
import { getParsedLabel } from "@app/utils/rules-utils";
import { isNotEmptyString } from "@app/utils/utils";

import { AdvancedOptions } from "./steps/advanced-options";
import { AnalysisMode } from "./steps/analysis-mode";
import { AnalysisScope } from "./steps/analysis-scope";
import { CustomRules } from "./steps/custom-rules";
import { Review } from "./steps/review";
import { SetTargets } from "./steps/set-targets";
import { useTaskGroupManager } from "./useTaskGroupManager";
import { useWizardReducer } from "./useWizardReducer";
import { useAnalyzableApplications } from "./utils";

import "./wizard.css";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

const defaultTaskData: AnalysisTaskData = {
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

export const defaultTaskgroup: New<Taskgroup> = {
  name: `taskgroup.analyzer`,
  kind: "analyzer",
  data: {
    ...defaultTaskData,
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

enum StepId {
  AnalysisMode = 1,
  SetTargets,
  Scope,
  CustomRules,
  Options,
  Review,
}

export const AnalysisWizard: React.FC<IAnalysisWizard> = ({
  applications,
  onClose,
  isOpen,
}: IAnalysisWizard) => {
  const { t } = useTranslation();

  const { identities } = useFetchIdentities();

  const {
    state,
    setMode,
    setTargets,
    setScope,
    setCustomRules,
    setOptions,
    reset,
  } = useWizardReducer();

  const {
    taskGroup,
    createTaskGroup,
    submitTaskGroup,
    deleteTaskGroup,
    updateTaskGroup,
  } = useTaskGroupManager();

  const [stepIdReached, setStepIdReached] = React.useState(1);

  // TODO: Consider moving this to the useTaskGroupManager hook as part of submitTaskGroup
  const setupTaskgroup = (
    currentTaskgroup: Taskgroup,
    wizardState: typeof state
  ): Taskgroup => {
    const matchingSourceCredential = identities.find(
      (identity) =>
        identity.name === wizardState.customRules.associatedCredentials // TODO: double check this
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
        ...defaultTaskData,
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
            included: wizardState.scope.withKnownLibs.includes("select") // TODO: double check this, doesn't seem correct
              ? wizardState.scope.includedPackages
              : [],
            excluded: wizardState.scope.hasExcludedPackages
              ? wizardState.scope.excludedPackages
              : [],
          },
        },
        rules: {
          // TODO: Review how the included and excluded labels are created
          labels: {
            included: Array.from(
              new Set<string>([
                ...wizardState.targets.selectedTargetLabels
                  .filter(
                    (label) =>
                      getParsedLabel(label.label).labelType !== "source"
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

  const handleCancel = () => {
    // TODO: Move the taskgroup handling to the useTaskGroupManager hook
    if (taskGroup && taskGroup.id) {
      deleteTaskGroup(taskGroup.id);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onSubmit = () => {
    // TODO: Move the taskgroup handling to the useTaskGroupManager hook
    if (taskGroup) {
      const taskgroup = setupTaskgroup(taskGroup, state);
      submitTaskGroup(taskgroup);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onMove = (current: WizardStepType) => {
    const id = current.id;
    if (id && stepIdReached < (id as number)) setStepIdReached(id as number);
    if (id === StepId.SetTargets) {
      // TODO: Move the taskgroup handling to the useTaskGroupManager hook
      if (!taskGroup) {
        createTaskGroup();
      }
    }
  };

  const analyzableApplications = useAnalyzableApplications(
    applications,
    state.mode.mode
  );

  const isStepEnabled = (stepId: StepId) => {
    return stepIdReached + 1 >= stepId;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      showClose={false}
      aria-label="Application analysis wizard modal"
      hasNoBodyWrapper
      onEscapePress={handleCancel}
      variant={ModalVariant.large}
    >
      <Wizard
        data-testid="analysis-wizard"
        onClose={handleCancel}
        onSave={onSubmit}
        onStepChange={(_event, currentStep: WizardStepType) =>
          onMove(currentStep)
        }
        header={
          <WizardHeader
            onClose={handleCancel}
            title="Application analysis"
            description={
              <Truncate
                content={applications.map((app) => app.name).join(", ")}
              />
            }
          />
        }
      >
        <WizardStep
          key="wizard-configureAnalysis"
          id="wizard-configureAnalysis"
          name={t("wizard.terms.configureAnalysis")}
          steps={[
            <WizardStep
              key={StepId.AnalysisMode}
              id={StepId.AnalysisMode}
              name={t("wizard.terms.analysisMode")}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.AnalysisMode + 1) ||
                  !state.mode.isValid,
              }}
            >
              <AnalysisMode
                applications={applications}
                taskGroup={taskGroup}
                createTaskGroup={createTaskGroup}
                onStateChanged={setMode}
                initialState={state.mode}
              />
            </WizardStep>,
            <WizardStep
              key={StepId.SetTargets}
              id={StepId.SetTargets}
              name={t("wizard.terms.setTargets")}
              isDisabled={!isStepEnabled(StepId.SetTargets)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.SetTargets + 1) ||
                  !state.targets.isValid,
              }}
            >
              <SetTargets
                applications={applications}
                areCustomRulesEnabled={
                  state.customRules.customRulesFiles.length > 0 ||
                  isNotEmptyString(state.customRules.sourceRepository)
                }
                onStateChanged={setTargets}
                initialState={state.targets}
              />
            </WizardStep>,
            <WizardStep
              key={StepId.Scope}
              id={StepId.Scope}
              name={t("wizard.terms.scope")}
              isDisabled={!isStepEnabled(StepId.Scope)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.Scope + 1) || !state.scope.isValid,
              }}
            >
              <AnalysisScope
                onStateChanged={setScope}
                initialState={state.scope}
              />
            </WizardStep>,
          ]}
        />

        <WizardStep
          key="wizard-advanced"
          id="wizard-advanced"
          name={t("wizard.terms.advanced")}
          steps={[
            <WizardStep
              key={StepId.CustomRules}
              id={StepId.CustomRules}
              name={t("wizard.terms.customRules")}
              isDisabled={!isStepEnabled(StepId.CustomRules)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.CustomRules + 1) ||
                  !state.customRules.isValid,
              }}
            >
              <CustomRules
                taskGroup={taskGroup}
                isCustomRuleRequired={
                  state.targets.selectedTargets.length === 0
                }
                onStateChanged={setCustomRules}
                initialState={state.customRules}
              />
            </WizardStep>,
            <WizardStep
              key={StepId.Options}
              id={StepId.Options}
              name={t("wizard.terms.options")}
              isDisabled={!isStepEnabled(StepId.Options)}
              footer={{
                isNextDisabled:
                  !isStepEnabled(StepId.Options + 1) || !state.options.isValid,
              }}
            >
              {/* TODO: Explicitly handle target, custom and manual TargetLabels */}
              <AdvancedOptions
                selectedTargets={state.targets.selectedTargets}
                onSelectedTargetsChanged={(targets) => {
                  setTargets({ ...state.targets, selectedTargets: targets });
                }}
                onStateChanged={setOptions}
                initialState={state.options}
              />
            </WizardStep>,
          ]}
        />

        <WizardStep
          key={StepId.Review}
          id={StepId.Review}
          name={t("wizard.terms.review")}
          isDisabled={!isStepEnabled(StepId.Review)}
          footer={{ nextButtonText: "Run", isNextDisabled: !state.isReady }}
        >
          <Review
            applications={applications}
            mode={state.mode.mode}
            targets={state.targets}
            scope={state.scope}
            customRules={state.customRules}
            options={state.options}
          />
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
