import * as React from "react";
import { useIsMutating } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import {
  Truncate,
  Wizard,
  WizardStepFunctionType,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import {
  Application,
  IReadFile,
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
import { NotificationsContext } from "@app/shared/notifications-context";
import {
  AnalysisWizardFormValues,
  useAnalysisWizardFormValidationSchema,
} from "./schema";
import { useAsyncYupValidation } from "@app/shared/hooks/useAsyncYupValidation";
import { CustomRules } from "./custom-rules";
import { useSetting } from "@app/queries/settings";
import defaultSources from "./sources";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

const defaultTaskData: TaskData = {
  output: "/windup/report",
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

const defaultTaskgroup: Taskgroup = {
  name: `taskgroup.windup`,
  addon: "windup",
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

  const { data: isCSVDownloadEnabled } = useSetting("download.csv.enabled");

  const { pushNotification } = React.useContext(NotificationsContext);

  const [currentTaskgroup, setCurrentTaskgroup] =
    React.useState<Taskgroup | null>();

  const [stepIdReached, setStepIdReached] = React.useState(1);
  const isMutating = useIsMutating();

  React.useEffect(() => {
    if (!currentTaskgroup) {
      createTaskgroup(defaultTaskgroup);
    }
  }, []);

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    setCurrentTaskgroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup creation failed: ", error);
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
    setCurrentTaskgroup(null);
  };

  const onDeleteTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup: delete failed: ", error);
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
      formTargets: [],
      selectedFormSources: [],
      formSources: defaultSources,
      formRuleBundles: [],
      withKnown: "app",
      includedPackages: [],
      excludedPackages: [],
      customRulesFiles: [],
      excludedRulesTags: [],
      diva: false,
      hasExcludedPackages: false,
      associatedCredentials: { id: 0, name: "" },
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
          ...(isCSVDownloadEnabled && { csv: isCSVDownloadEnabled }),
        },
        targets: fieldValues.formTargets,
        sources: fieldValues.selectedFormSources,
        scope: {
          withKnown: fieldValues.withKnown.includes("oss") ? true : false,
          packages: {
            included: hasIncludedPackages ? fieldValues.includedPackages : [],
            excluded: hasExcludedPackages ? fieldValues.excludedPackages : [],
          },
        },
        rules: {
          path: fieldValues.customRulesFiles.length > 0 ? "/rules" : "",
          tags: {
            excluded: fieldValues.excludedRulesTags,
          },
          bundles: fieldValues.formRuleBundles.map((ruleBundle) => {
            return { name: ruleBundle.name, id: ruleBundle.id };
          }),
          ...(fieldValues.rulesKind === "repository" && {
            repository: {
              kind: fieldValues?.repositoryType,
              url: fieldValues?.sourceRepository?.trim(),
              branch: fieldValues?.branch?.trim(),
              path: fieldValues?.rootPath?.trim(),
            },
          }),
          ...(fieldValues.associatedCredentials &&
            !!fieldValues?.associatedCredentials?.id &&
            fieldValues.rulesKind === "repository" && {
              identity: fieldValues.associatedCredentials,
            }),
        },
      },
    };
  };

  const isModeValid = applications.every((app) => isModeSupported(app, mode));

  const onSubmit = (fieldValues: AnalysisWizardFormValues) => {
    if (fieldValues.formRuleBundles.length < 1) {
      console.log("Invalid form");
      return;
    }
    if (currentTaskgroup) {
      const taskgroup = setupTaskgroup(currentTaskgroup, fieldValues);

      submitTaskgroup(taskgroup);
    }
    onClose();
  };

  const onMove: WizardStepFunctionType = (
    { id, name },
    { prevId, prevName }
  ) => {
    if (id && stepIdReached < id) setStepIdReached(id as number);
  };

  const handleClose = () => {
    reset();
    if (currentTaskgroup && currentTaskgroup.id)
      deleteTaskgroup(currentTaskgroup.id);
    onClose();
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
              taskgroupID={
                currentTaskgroup && currentTaskgroup?.id
                  ? currentTaskgroup.id
                  : null
              }
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
          component: (
            <CustomRules
              taskgroupID={
                currentTaskgroup && currentTaskgroup?.id
                  ? currentTaskgroup.id
                  : null
              }
            />
          ),
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
              handleClose();
            }}
          />
        </FormProvider>
      )}
    </>
  );
};
