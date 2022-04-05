import * as React from "react";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import {
  Application,
  TaskData,
  Taskgroup,
  TaskgroupTask,
} from "@app/api/models";
import "./wizard.css";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";

import { alertActions } from "@app/store/alert";
import { useDispatch } from "react-redux";
import {
  Button,
  Wizard,
  WizardContextConsumer,
  WizardFooter,
  WizardStepFunctionType,
} from "@patternfly/react-core";

import { CustomRules } from "./custom-rules";
import { Review } from "./review";
import { SetMode } from "./set-mode";
import { SetOptions } from "./set-options";
import { SetScope } from "./set-scope";
import { SetTargets } from "./set-targets";
import { useIsMutating } from "react-query";
import {
  useCreateTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { uploadFileTaskgroup } from "@app/api/rest";
interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
}
export interface IReadFile {
  fileName: string;
  data?: string;
  loadResult?: "danger" | "success";
  loadError?: DOMException;
}
export interface IAnalysisWizardFormValues {
  mode: string;
  output: string;
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
  path: "",
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

export const AnalysisWizard: React.FunctionComponent<IAnalysisWizard> = ({
  applications,
  onClose,
}: IAnalysisWizard) => {
  const title = "Application analysis";
  const dispatch = useDispatch();

  const [isInitTaskgroup, setInitTaskgroup] = React.useState(false);
  const [createdTaskgroup, setCreatedTaskgroup] = React.useState<Taskgroup>();
  const isMutating = useIsMutating();

  const onCreateTaskgroupSuccess = (response: any) => {
    setInitTaskgroup(true);
    setCreatedTaskgroup(response.data);
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

  const onSubmitTaskgroupSuccess = (response: any) => {
    dispatch(alertActions.addSuccess("Applications", "Submitted for analysis"));
  };

  const onSubmitTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup submit failed: ", error);
    dispatch(alertActions.addDanger("Taskgroup submit failed"));
  };

  const { mutate: submitTaskgroup } = useSubmitTaskgroupMutation(
    onSubmitTaskgroupSuccess,
    onSubmitTaskgroupError
  );

  const schema = yup
    .object({
      mode: yup.string().required(),
      target: yup.array().min(1, "Select one or more target"),
    })
    .required();

  const methods = useForm<IAnalysisWizardFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      mode: "Binary",
      output: "",
      artifact: "",
      targets: [],
      sources: [],
      withKnown: "",
      includedPackages: [""],
      excludedPackages: [""],
      customRulesFiles: [],
      excludedRulesTags: [""],
    },
  });

  const { handleSubmit, watch, reset } = methods;
  const watchAllFields = watch();

  if (!isInitTaskgroup) {
    const initTask = (application: Application): TaskgroupTask => {
      return {
        name: `${application.name}.${application.id}.windup`,
        data: {
          application: application.id as number,
        },
        application: { id: application.id as number, name: application.name },
      };
    };

    const taskgroup: Taskgroup = {
      name: `taskgroup.windup`,
      addon: "windup",
      data: {
        ...defaultTaskData,
      },
      tasks: applications.map((app) => initTask(app)),
    };

    createTaskgroup(taskgroup);
  }

  const setTaskgroup = (taskgroup: Taskgroup, data: FieldValues): Taskgroup => {
    return {
      ...taskgroup,
      data: {
        ...defaultTaskData,
        mode: {
          binary: data.mode.includes("Binary"),
          withDeps: data.mode.includes("dependencies"),
          artifact: data.artifact ? `/binary/${data.artifact}` : "",
        },
        targets: data.targets,
        sources: data.sources,
        scope: {
          withKnown: data.withKnown.includes("depsAll") ? true : false,
          packages: {
            included: data.includedPackages,
            excluded: data.excludedPackages,
          },
        },
        rules:
          data.customRulesFiles.length > 0
            ? {
                path: "/rules",
                tags: {
                  excluded: data.excludedRulesTags,
                },
              }
            : undefined,
      },
    };
  };

  const [stepIdReached, setStepIdReached] = useState(1);

  enum stepId {
    AnalysisMode = 1,
    UploadBinaryStep,
    SetTargets,
    Scope,
    CustomRules,
    Options,
    Review,
  }

  const onSubmit = (data: FieldValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }

    if (createdTaskgroup) {
      const taskgroup = setTaskgroup(createdTaskgroup, data);
      Promise.all(
        data.customRulesFiles.map((file: any) => {
          const formFile = new FormData();
          formFile.append("file", file.file);

          return uploadFileTaskgroup({
            id: taskgroup.id as number,
            path: `/rules/${file.fileName}`,
            file: formFile,
          });
        })
      );

      submitTaskgroup(taskgroup);
    }
    onClose();
  };

  const onMove: WizardStepFunctionType = (
    { id, name },
    { prevId, prevName }
  ) => {
    if (id && stepIdReached < id) {
      setStepIdReached(id as number);
    }
  };

  const setTargetsStep = {
    id: stepId.SetTargets,
    name: "Set targets",
    component: <SetTargets />,
  };
  const scopeStep = {
    id: stepId.Scope,
    name: "Scope",
    component: <SetScope />,
  };
  const advancedSteps = {
    name: "Advanced",
    steps: [
      {
        id: stepId.CustomRules,
        name: "Custom rules",
        component: <CustomRules />,
      },
      {
        id: stepId.Options,
        name: "Options",
        component: <SetOptions />,
      },
    ],
  };
  const reviewStep = {
    id: stepId.Review,
    name: "Review",
    component: <Review applications={applications} />,
    nextButtonText: "Run",
  };

  const steps = [
    {
      name: "Configure analysis",
      steps: [
        {
          id: stepId.AnalysisMode,
          name: "Analysis mode",
          component: (
            <SetMode
              isSingleApp={applications.length === 1 ? true : false}
              taskgroupID={createdTaskgroup?.id || null}
            />
          ),
          canJumpTo: stepIdReached >= stepId.AnalysisMode,
        },
        setTargetsStep,
        scopeStep,
      ],
    },
    advancedSteps,
    reviewStep,
  ];

  const CustomFooter = (
    <WizardFooter>
      <WizardContextConsumer>
        {({
          activeStep,
          goToStepByName,
          goToStepById,
          onNext,
          onBack,
          onClose,
        }) => {
          const isNextEnabled = () => {
            switch (activeStep.name) {
              case "Analysis mode":
                if (isMutating) return false;
                return true;
              default:
                return true;
            }
          };

          return (
            <>
              <Button
                variant="primary"
                type="submit"
                onClick={(event) => {
                  getNextStep(activeStep, onNext);
                }}
                isDisabled={!isNextEnabled()}
              >
                {activeStep.name === "Results" ? "Finish" : "Next"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => getPreviousStep(activeStep, onBack)}
                className={activeStep.name === "General" ? "pf-m-disabled" : ""}
                isDisabled={activeStep.name === "Analysis mode"}
              >
                Back
              </Button>
              <Button variant="link" onClick={onClose}>
                Cancel
              </Button>
            </>
          );
        }}
      </WizardContextConsumer>
    </WizardFooter>
  );

  const getNextStep = (activeStep: any, callback?: any) => {
    setTimeout(() => {
      callback();
    });
  };

  const getPreviousStep = (activeStep: any, callback: any) => {
    setTimeout(() => {
      callback();
    });
  };
  const handleClose = () => {
    onClose();
    setStepIdReached(stepId.AnalysisMode);
    reset();
  };

  return (
    <FormProvider {...methods}>
      <Wizard
        isOpen={true}
        title="Application analysis"
        description={applications.map((app) => app.name).join(", ")}
        navAriaLabel={`${title} steps`}
        mainAriaLabel={`${title} content`}
        steps={steps}
        footer={CustomFooter}
        onNext={onMove}
        onBack={onMove}
        onSave={handleSubmit(onSubmit)}
        onClose={() => {
          handleClose();
        }}
      />
    </FormProvider>
  );
};
