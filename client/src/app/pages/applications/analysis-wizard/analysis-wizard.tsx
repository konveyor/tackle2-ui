import * as React from "react";
import { useIsMutating } from "react-query";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import {
  Truncate,
  Wizard,
  WizardStepFunctionType,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import {
  Application,
  TaskData,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { CustomRules } from "./custom-rules";
import { Review } from "./review";
import { SetMode } from "./set-mode";
import { SetOptions } from "./set-options";
import { SetScope } from "./set-scope";
import { SetTargets } from "./set-targets";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
  useUploadFileMutation,
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

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}

export interface IReadFile {
  fileName: string;
  loadError?: DOMException;
  loadPercentage?: number;
  loadResult?: "danger" | "success";
  data?: string;
  fullFile: File;
}

const defaultTaskData: TaskData = {
  output: "/windup/report",
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

  const { pushNotification } = React.useContext(NotificationsContext);

  const [isInitTaskgroup, setInitTaskgroup] = React.useState(false);
  const [createdTaskgroup, setCreatedTaskgroup] = React.useState<Taskgroup>();
  const [stepIdReached, setStepIdReached] = React.useState(1);
  const isMutating = useIsMutating();

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    setInitTaskgroup(true);
    setCreatedTaskgroup(data);
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

  const onUploadError = (error: Error | unknown) =>
    console.log("Taskgroup upload failed: ", error);

  const { mutate: uploadFile } = useUploadFileMutation(() => {}, onUploadError);

  const onDeleteTaskgroupSuccess = () => setInitTaskgroup(false);

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
      artifact: "",
      mode: "binary",
      targets: [],
      sources: [],
      withKnown: "app",
      includedPackages: [],
      excludedPackages: [],
      customRulesFiles: [],
      excludedRulesTags: [],
      diva: false,
      hasExcludedPackages: false,
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

  const setTaskgroup = (taskgroup: Taskgroup, data: FieldValues): Taskgroup => {
    return {
      ...taskgroup,
      data: {
        ...defaultTaskData,
        mode: {
          binary: mode.includes("binary"),
          withDeps: mode === "source-code-deps",
          artifact: data.artifact ? `/binary/${data.artifact}` : "",
          diva: data.diva,
        },
        targets: data.targets,
        sources: data.sources,
        scope: {
          withKnown: data.withKnown.includes("oss") ? true : false,
          packages: {
            included: hasIncludedPackages ? data.includedPackages : [],
            excluded: hasExcludedPackages ? data.excludedPackages : [],
          },
        },
        rules: {
          path: data.customRulesFiles.length > 0 ? "/rules" : "",
          tags: {
            excluded: data.excludedRulesTags,
          },
        },
      },
    };
  };

  const isModeValid = applications.every((app) => isModeSupported(app, mode));

  const onSubmit = (data: FieldValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }

    if (createdTaskgroup) {
      const taskgroup = setTaskgroup(createdTaskgroup, data);

      data.customRulesFiles.forEach((file: IReadFile) => {
        const formFile = new FormData();
        formFile.append("file", file.fullFile);
        uploadFile({
          id: taskgroup.id as number,
          path: `rules/${file.fileName}`,
          file: formFile,
        });
      });

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
    if (isInitTaskgroup && createdTaskgroup && createdTaskgroup.id)
      deleteTaskgroup(createdTaskgroup.id);
    onClose();
  };

  const analyzableApplications = useAnalyzableApplications(applications, mode);

  // TODO what's the deal here? can we prevent creating the taskgroup until later / even on submission? is it used as part of form rendering?
  React.useEffect(() => {
    if (isInitTaskgroup && createdTaskgroup && createdTaskgroup.id)
      deleteTaskgroup(createdTaskgroup.id);

    if (analyzableApplications.length > 0) {
      const taskgroup: Taskgroup = {
        name: `taskgroup.windup`,
        addon: "windup",
        data: {
          ...defaultTaskData,
        },
        tasks: analyzableApplications.map((app) => initTask(app)),
      };

      createTaskgroup(taskgroup);
    }
  }, [analyzableApplications, createTaskgroup]);

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
              taskgroupID={createdTaskgroup?.id || null}
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
              handleClose();
            }}
          />
        </FormProvider>
      )}
    </>
  );
};
