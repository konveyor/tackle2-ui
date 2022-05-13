import * as React from "react";
import { useIsMutating } from "react-query";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  Truncate,
  Wizard,
  WizardStepFunctionType,
} from "@patternfly/react-core";

import {
  Application,
  TaskData,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import { alertActions } from "@app/store/alert";
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

import "./wizard.css";
import {
  isApplicationBinaryEnabled,
  isApplicationSourceCodeDepsEnabled,
  isApplicationSourceCodeEnabled,
  isModeSupported,
} from "./utils";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
  isOpen: boolean;
}
export interface IReadFile {
  fileName: string;
  data?: string;
  loadResult?: "danger" | "success";
  loadError?: DOMException;
}
export interface IAnalysisWizardFormValues {
  artifact: string;
  targets: string[];
  sources: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: IReadFile[];
  excludedRulesTags: string[];
}

const defaultTaskData: TaskData = {
  output: "/windup/report",
  mode: {
    binary: false,
    withDeps: false,
    artifact: "",
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

export const AnalysisWizard: React.FunctionComponent<IAnalysisWizard> = ({
  applications,
  onClose,
  isOpen,
}: IAnalysisWizard) => {
  const title = "Application analysis";
  const dispatch = useDispatch();

  const [isInitTaskgroup, setInitTaskgroup] = React.useState(false);
  const [createdTaskgroup, setCreatedTaskgroup] = React.useState<Taskgroup>();
  const [stepIdReached, setStepIdReached] = React.useState(1);
  const [mode, setMode] = React.useState("binary");
  const isMutating = useIsMutating();

  const [analyzeableApplications, setAnalyzeableApplications] = React.useState<
    Application[]
  >([]);

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    setInitTaskgroup(true);
    setCreatedTaskgroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup creation failed: ", error);
    dispatch(alertActions.addDanger("Taskgroup creation failed"));
    onClose();
  };

  const { mutate: createTaskgroup } = useCreateTaskgroupMutation(
    onCreateTaskgroupSuccess,
    onCreateTaskgroupError
  );

  const onSubmitTaskgroupSuccess = (data: Taskgroup) =>
    dispatch(alertActions.addSuccess("Applications", "Submitted for analysis"));

  const onSubmitTaskgroupError = (error: Error | unknown) =>
    dispatch(alertActions.addDanger("Taskgroup submit failed"));

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
    dispatch(alertActions.addDanger("Taskgroup: delete failed"));
  };

  const { mutate: deleteTaskgroup } = useDeleteTaskgroupMutation(
    onDeleteTaskgroupSuccess,
    onDeleteTaskgroupError
  );

  const methods = useForm<IAnalysisWizardFormValues>({
    defaultValues: {
      artifact: "",
      targets: [],
      sources: [],
      withKnown: "app",
      includedPackages: [],
      excludedPackages: [],
      customRulesFiles: [],
      excludedRulesTags: [],
    },
  });

  const { handleSubmit, watch, reset } = methods;
  const watchAllFields = watch();
  const { artifact, targets } = methods.getValues();

  const setTaskgroup = (taskgroup: Taskgroup, data: FieldValues): Taskgroup => {
    return {
      ...taskgroup,
      data: {
        ...defaultTaskData,
        mode: {
          binary: mode.includes("binary"),
          withDeps: mode === "source-code-deps",
          artifact: data.artifact ? `/binary/${data.artifact}` : "",
        },
        targets: data.targets,
        sources: data.sources,
        scope: {
          withKnown: data.withKnown.includes("oss") ? true : false,
          packages: {
            included: data.includedPackages,
            excluded: data.excludedPackages,
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
  const areApplicationsBinaryEnabled = (): boolean =>
    applications.every((application) =>
      isApplicationBinaryEnabled(application)
    );

  const areApplicationsSourceCodeEnabled = (): boolean =>
    applications.every((application) =>
      isApplicationSourceCodeEnabled(application)
    );

  const areApplicationsSourceCodeDepsEnabled = (): boolean =>
    applications.every((application) =>
      isApplicationSourceCodeDepsEnabled(application)
    );

  const isModeValid = (): boolean => {
    if (mode === "binary-upload") return !isMutating && artifact !== "";
    if (mode === "binary") return areApplicationsBinaryEnabled();
    else if (mode === "source-code-deps")
      return areApplicationsSourceCodeDepsEnabled();
    else return areApplicationsSourceCodeEnabled();
  };

  const onSubmit = (data: FieldValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }

    if (createdTaskgroup) {
      const taskgroup = setTaskgroup(createdTaskgroup, data);

      data.customRulesFiles.forEach((file: any) => {
        const formFile = new FormData();
        formFile.append("file", file.file);

        uploadFile({
          id: taskgroup.id as number,
          path: `/rules/${file.fileName}`,
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

  enum stepId {
    AnalysisMode = 1,
    UploadBinaryStep,
    SetTargets,
    Scope,
    CustomRules,
    Options,
    Review,
  }

  const handleClose = () => {
    setStepIdReached(stepId.AnalysisMode);
    reset();
    if (isInitTaskgroup && createdTaskgroup && createdTaskgroup.id)
      deleteTaskgroup(createdTaskgroup.id);
    onClose();
  };

  React.useEffect(() => {
    const apps = applications.filter((application) =>
      isModeSupported(application, mode)
    );
    setAnalyzeableApplications(apps);
  }, [mode]);

  React.useEffect(() => {
    if (isInitTaskgroup && createdTaskgroup && createdTaskgroup.id)
      deleteTaskgroup(createdTaskgroup.id);

    if (analyzeableApplications.length > 0) {
      const taskgroup: Taskgroup = {
        name: `taskgroup.windup`,
        addon: "windup",
        data: {
          ...defaultTaskData,
        },
        tasks: analyzeableApplications.map((app) => initTask(app)),
      };

      createTaskgroup(taskgroup);
    }
  }, [analyzeableApplications, createTaskgroup]);

  const steps = [
    {
      name: "Configure analysis",
      steps: [
        {
          id: stepId.AnalysisMode,
          name: "Analysis mode",
          component: (
            <SetMode
              mode={mode}
              isSingleApp={applications.length === 1 ? true : false}
              taskgroupID={createdTaskgroup?.id || null}
              isModeValid={isModeValid()}
              setMode={setMode}
            />
          ),

          enableNext:
            (analyzeableApplications.length === 1 &&
              !isMutating &&
              artifact !== "") ||
            (analyzeableApplications.length > 0 && !isMutating),
          canJumpTo: stepIdReached >= stepId.AnalysisMode,
        },
        {
          id: stepId.SetTargets,
          name: "Set targets",
          component: <SetTargets />,
          enableNext: targets.length > 0,
          canJumpTo: stepIdReached >= stepId.SetTargets,
        },
        {
          id: stepId.Scope,
          name: "Scope",
          component: <SetScope />,
          canJumpTo: stepIdReached >= stepId.Scope,
        },
      ],
    },
    {
      name: "Advanced",
      steps: [
        {
          id: stepId.CustomRules,
          name: "Custom rules",
          component: <CustomRules />,
          canJumpTo: stepIdReached >= stepId.CustomRules,
        },
        {
          id: stepId.Options,
          name: "Options",
          component: <SetOptions />,
          enableNext: targets.length > 0,
          canJumpTo: stepIdReached >= stepId.Options,
        },
      ],
    },
    {
      id: stepId.Review,
      name: "Review",
      component: <Review applications={applications} mode={mode} />,
      nextButtonText: "Run",
      canJumpTo: stepIdReached >= stepId.Review,
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
