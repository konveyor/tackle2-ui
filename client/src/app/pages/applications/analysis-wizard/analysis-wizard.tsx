import * as React from "react";
import { useIsMutating } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { Truncate } from "@patternfly/react-core";
import {
  Wizard,
  WizardStepFunctionType,
} from "@patternfly/react-core/deprecated";
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
import { TaskGroupProvider, useTaskGroup } from "./components/TaskGroupContext";

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
    withKnown: false,
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
      withKnown: "app",
      includedPackages: [],
      excludedPackages: [],
      customRulesFiles: [],
      excludedRulesTags: [],
      diva: false,
      hasExcludedPackages: false,
      associatedCredentials: "",
      rulesKind: "manual",
      repositoryType: "",
      sourceRepository: "",
      branch: "",
      rootPath: "",
      autoTaggingEnabled: true,
    },
    resolver: yupResolver(allFieldsSchema),
    mode: "onChange",
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

  const { mode, withKnown, hasExcludedPackages } = values;
  const hasIncludedPackages = withKnown.includes("select");

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
          withKnown: fieldValues.withKnown.includes("oss") ? true : false,
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

  const onMove: WizardStepFunctionType = (
    { id, name },
    { prevId, prevName }
  ) => {
    if (id && stepIdReached < (id as number)) setStepIdReached(id as number);
    if (id === StepId.SetTargets) {
      if (!taskGroup) {
        createTaskgroup(defaultTaskgroup);
      }
    }
  };

  const analyzableApplications = useAnalyzableApplications(applications, mode);

  const getStepNavProps = (stepId: StepId, forceBlock = false) => ({
    enableNext:
      !forceBlock &&
      stepIdReached >= stepId &&
      (firstInvalidStep === null || firstInvalidStep >= stepId + 1),
    canJumpTo:
      !forceBlock &&
      stepIdReached >= stepId &&
      (firstInvalidStep === null || firstInvalidStep >= stepId),
  });

  const steps = [
    {
      name: t("wizard.terms.configureAnalysis"),
      steps: [
        {
          id: StepId.AnalysisMode,
          name: t("wizard.terms.analysisMode"),
          component: (
            <SetMode
              isSingleApp={applications.length === 1 ? true : false}
              isModeValid={isModeValid}
            />
          ),
          ...getStepNavProps(StepId.AnalysisMode, !!isMutating),
        },
        {
          id: StepId.SetTargets,
          name: t("wizard.terms.setTargets"),
          component: <SetTargets />,
          ...getStepNavProps(StepId.SetTargets),
        },
        {
          id: StepId.Scope,
          name: t("wizard.terms.scope"),
          component: <SetScope />,
          ...getStepNavProps(StepId.Scope),
        },
      ],
    },
    {
      name: t("wizard.terms.advanced"),
      steps: [
        {
          id: StepId.CustomRules,
          name: t("wizard.terms.customRules"),
          component: <CustomRules />,
          ...getStepNavProps(StepId.CustomRules),
        },
        {
          id: StepId.Options,
          name: t("wizard.terms.options"),
          component: <SetOptions />,
          ...getStepNavProps(StepId.Options),
        },
      ],
    },
    {
      id: StepId.Review,
      name: t("wizard.terms.review"),
      component: <Review applications={applications} mode={mode} />,
      nextButtonText: "Run",
      ...getStepNavProps(StepId.Review),
    },
  ];
  return (
    <>
      {isOpen && (
        <FormProvider {...methods}>
          <Wizard
            isOpen={isOpen}
            title="Application analysis"
            description={
              <Truncate
                content={applications.map((app) => app.name).join(", ")}
              />
            }
            navAriaLabel={`${title} steps`}
            mainAriaLabel={`${title} content`}
            steps={steps}
            onNext={onMove}
            onBack={onMove}
            onSave={handleSubmit(onSubmit)}
            onClose={() => {
              handleCancel();
            }}
          />
        </FormProvider>
      )}
    </>
  );
};
