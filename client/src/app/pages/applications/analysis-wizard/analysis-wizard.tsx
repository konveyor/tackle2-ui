import * as React from "react";
import { useIsMutating } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardStep,
  WizardStepType,
  WizardHeader,
  Truncate,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import {
  Application,
  TaskData,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { Review } from "./review";
import { SetMode } from "./set-mode";
import { SetOptions } from "./set-options";
import { SetScope } from "./set-scope";
import { SetTargets } from "./set-targets";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { yupResolver } from "@hookform/resolvers/yup";

import "./wizard.css";
import { useAnalyzableApplications, isModeSupported } from "./utils";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  AnalysisWizardFormValues,
  useAnalysisWizardFormValidationSchema,
} from "./schema";
import { useAsyncYupValidation } from "@app/hooks/useAsyncYupValidation";
import { CustomRules } from "./custom-rules";
import { useFetchIdentities } from "@app/queries/identities";
import { useTaskGroup } from "./components/TaskGroupContext";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

const defaultTaskData: TaskData = {
  tagger: {
    enabled: true,
  },
  mode: {
    binary: false,
    withDeps: false,
    artifact: "",
    diva: false,
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

export const defaultTaskgroup: Taskgroup = {
  name: `taskgroup.analyzer`,
  addon: "analyzer",
  data: {
    ...defaultTaskData,
  },
  tasks: [],
};

const initTask = (application: Application): TaskgroupTask => {
  return {
    name: `${application.name}.${application.id}.windup`,
    data: {},
    application: { id: application.id as number, name: application.name },
  };
};

export const AnalysisWizard: React.FC<IAnalysisWizard> = ({
  applications,
  onClose,
  isOpen,
}: IAnalysisWizard) => {
  const { t } = useTranslation();
  const title = t("dialog.title.applicationAnalysis");

  const { identities } = useFetchIdentities();

  const { pushNotification } = React.useContext(NotificationsContext);

  const { taskGroup, updateTaskGroup } = useTaskGroup();

  const [stepIdReached, setStepIdReached] = React.useState(1);
  const isMutating = useIsMutating();

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    updateTaskGroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    pushNotification({
      title: "Taskgroup creation failed",
      variant: "danger",
    });
    onClose();
  };

  const { mutate: createTaskgroup } = useCreateTaskgroupMutation(
    onCreateTaskgroupSuccess,
    onCreateTaskgroupError
  );

  const onSubmitTaskgroupSuccess = (data: Taskgroup) =>
    pushNotification({
      title: "Applications",
      message: "Submitted for analysis",
      variant: "info",
    });

  const onSubmitTaskgroupError = (error: Error | unknown) =>
    pushNotification({
      title: "Taskgroup submit failed",
      variant: "danger",
    });

  const { mutate: submitTaskgroup } = useSubmitTaskgroupMutation(
    onSubmitTaskgroupSuccess,
    onSubmitTaskgroupError
  );

  const onDeleteTaskgroupSuccess = () => {
    updateTaskGroup(null);
  };

  const onDeleteTaskgroupError = (error: Error | unknown) => {
    pushNotification({
      title: "Taskgroup: delete failed",
      variant: "danger",
    });
  };

  const { mutate: deleteTaskgroup } = useDeleteTaskgroupMutation(
    onDeleteTaskgroupSuccess,
    onDeleteTaskgroupError
  );

  const { schemas, allFieldsSchema } = useAnalysisWizardFormValidationSchema({
    applications,
  });

  const methods = useForm<AnalysisWizardFormValues>({
    defaultValues: {
      artifact: null,
      mode: "binary",
      formLabels: [],
      selectedTargets: [],
      withKnownLibs: "app",
      includedPackages: [],
      excludedPackages: [],
      customRulesFiles: [],
      excludedRulesTags: [],
      diva: false,
      hasExcludedPackages: false,
      associatedCredentials: "",
      rulesKind: "manual",
      repositoryType: undefined,
      sourceRepository: "",
      branch: "",
      rootPath: "",
      autoTaggingEnabled: true,
    },
    resolver: yupResolver(allFieldsSchema),
    mode: "all",
  });

  const { handleSubmit, watch, reset } = methods;
  const values = watch();

  enum StepId {
    AnalysisMode = 1,
    SetTargets,
    Scope,
    CustomRules,
    Options,
    Review,
  }

  const isStepValid: Record<StepId, boolean> = {
    [StepId.AnalysisMode]: useAsyncYupValidation(values, schemas.modeStep),
    [StepId.SetTargets]: useAsyncYupValidation(values, schemas.targetsStep),
    [StepId.Scope]: useAsyncYupValidation(values, schemas.scopeStep),
    [StepId.CustomRules]: useAsyncYupValidation(
      values,
      schemas.customRulesStep
    ),
    [StepId.Options]: useAsyncYupValidation(values, schemas.optionsStep),
    [StepId.Review]: true,
  };

  const firstInvalidStep: StepId | null =
    (
      Object.values(StepId).filter((val) => typeof val === "number") as StepId[]
    ).find((stepId) => !isStepValid[stepId]) || null;

  const { mode, withKnownLibs, hasExcludedPackages } = values;
  const hasIncludedPackages = withKnownLibs.includes("select");

  const setupTaskgroup = (
    currentTaskgroup: Taskgroup,
    fieldValues: AnalysisWizardFormValues
  ): Taskgroup => {
    const matchingSourceCredential = identities.find(
      (identity) => identity.name === fieldValues.associatedCredentials
    );
    return {
      ...currentTaskgroup,
      tasks: analyzableApplications.map((app: Application) => initTask(app)),
      data: {
        ...defaultTaskData,
        tagger: {
          enabled: fieldValues.autoTaggingEnabled,
        },
        mode: {
          binary: mode.includes("binary"),
          withDeps: mode === "source-code-deps",
          artifact: fieldValues.artifact?.name
            ? `/binary/${fieldValues.artifact.name}`
            : "",
          diva: fieldValues.diva,
        },
        scope: {
          withKnownLibs: fieldValues.withKnownLibs.includes("oss")
            ? true
            : false,
          packages: {
            included: hasIncludedPackages ? fieldValues.includedPackages : [],
            excluded: hasExcludedPackages ? fieldValues.excludedPackages : [],
          },
        },
        rules: {
          labels: {
            included: Array.from(
              new Set<string>([
                ...fieldValues.formLabels.map((label) => label.label),
              ])
            ),
            excluded: [],
          },
          path: fieldValues.customRulesFiles.length > 0 ? "/rules" : "",
          tags: {
            excluded: fieldValues.excludedRulesTags,
          },
          ...(fieldValues.rulesKind === "repository" && {
            repository: {
              kind: fieldValues?.repositoryType,
              url: fieldValues?.sourceRepository?.trim(),
              branch: fieldValues?.branch?.trim(),
              path: fieldValues?.rootPath?.trim(),
            },
          }),
          ...(fieldValues.associatedCredentials &&
            matchingSourceCredential &&
            fieldValues.rulesKind === "repository" && {
              identity: {
                id: matchingSourceCredential.id,
                name: matchingSourceCredential.name,
              },
            }),
        },
      },
    };
  };

  const isModeValid = applications.every((app) => isModeSupported(app, mode));

  const handleCancel = () => {
    if (taskGroup && taskGroup.id) {
      deleteTaskgroup(taskGroup.id);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onSubmit = (fieldValues: AnalysisWizardFormValues) => {
    if (taskGroup) {
      const taskgroup = setupTaskgroup(taskGroup, fieldValues);
      submitTaskgroup(taskgroup);
    }
    updateTaskGroup(null);
    reset();
    onClose();
  };

  const onMove = (current: WizardStepType) => {
    const id = current.id;
    if (id && stepIdReached < (id as number)) setStepIdReached(id as number);
    if (id === StepId.SetTargets) {
      if (!taskGroup) {
        createTaskgroup(defaultTaskgroup);
      }
    }
  };

  const analyzableApplications = useAnalyzableApplications(applications, mode);

  const isStepEnabled = (stepId: StepId) => {
    return (
      stepIdReached + 1 >= stepId &&
      (firstInvalidStep === null || firstInvalidStep >= stepId)
    );
  };

  const steps = [
    <WizardStep
      name={t("wizard.terms.configureAnalysis")}
      id="wizard-configureAnalysis"
      steps={[
        <WizardStep
          id={StepId.AnalysisMode}
          name={t("wizard.terms.analysisMode")}
          isDisabled={!isStepEnabled(StepId.AnalysisMode)}
          footer={{
            isNextDisabled:
              !isMutating && !isStepEnabled(StepId.AnalysisMode + 1),
          }}
        >
          <>
            <SetMode
              isSingleApp={applications.length === 1 ? true : false}
              isModeValid={isModeValid}
            />
          </>
        </WizardStep>,
        <WizardStep
          id={StepId.SetTargets}
          name={t("wizard.terms.setTargets")}
          isDisabled={!isStepEnabled(StepId.SetTargets)}
          footer={{ isNextDisabled: !isStepEnabled(StepId.SetTargets + 1) }}
        >
          <SetTargets />
        </WizardStep>,
        <WizardStep
          id={StepId.Scope}
          name={t("wizard.terms.scope")}
          isDisabled={!isStepEnabled(StepId.Scope)}
          footer={{ isNextDisabled: !isStepEnabled(StepId.Scope + 1) }}
        >
          <SetScope />
        </WizardStep>,
      ]}
    ></WizardStep>,
    <WizardStep
      name={t("wizard.terms.advanced")}
      id="wizard-advanced"
      steps={[
        <WizardStep
          id={StepId.CustomRules}
          name={t("wizard.terms.customRules")}
          isDisabled={!isStepEnabled(StepId.CustomRules)}
          footer={{ isNextDisabled: !isStepEnabled(StepId.CustomRules + 1) }}
        >
          <CustomRules />
        </WizardStep>,
        <WizardStep
          id={StepId.Options}
          name={t("wizard.terms.options")}
          isDisabled={!isStepEnabled(StepId.Options)}
          footer={{ isNextDisabled: !isStepEnabled(StepId.Options + 1) }}
        >
          <SetOptions />
        </WizardStep>,
      ]}
    ></WizardStep>,
    <WizardStep
      name={t("wizard.terms.review")}
      id={StepId.Review}
      isDisabled={!isStepEnabled(StepId.Review)}
      footer={{ nextButtonText: "Run" }}
    >
      <Review applications={applications} mode={mode} />
    </WizardStep>,
  ];

  return (
    <>
      {isOpen && (
        <FormProvider {...methods}>
          <Modal
            isOpen={isOpen}
            showClose={false}
            aria-label="Application analysis wizard modal"
            hasNoBodyWrapper
            onEscapePress={handleCancel}
            variant={ModalVariant.large}
          >
            <Wizard
              onClose={handleCancel}
              onSave={handleSubmit(onSubmit)}
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
              {steps}
            </Wizard>
          </Modal>
        </FormProvider>
      )}
    </>
  );
};
