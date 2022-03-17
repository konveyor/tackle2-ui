import * as React from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  Button,
  SelectProvider,
  Wizard,
  WizardContextConsumer,
  WizardFooter,
  WizardStepFunctionType,
} from "@patternfly/react-core";

import { Application, Task, TaskData } from "@app/api/models";
import { SetMode } from "./set-mode";
import { SetTargets } from "./set-targets";
import { SetScope } from "./set-scope";
import { SetOptions } from "./set-options";
import { Review } from "./review";
import { createTask } from "@app/api/rest";
import { alertActions } from "@app/store/alert";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { CustomRules } from "./custom-rules";
import { IReadFile } from "./components/add-custom-rules";

import "./wizard.css";
import { UploadBinary } from "./components/upload-binary";
import { setTokenExpiryHandler } from "@konveyor/lib-ui";
import { UploadBinaryStep } from "./upload-binary-step";
import { useState } from "react";
import { useCreateInitialTaskMutation, useFetchTask } from "@app/queries/tasks";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
}

export interface IAnalysisWizardFormValues {
  mode: string;
  targets: string[];
  sources: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: any;
  excludedRulesTags: string[];
}

const defaultTaskData: TaskData = {
  application: 0,
  path: "",
  mode: {
    binary: false,
    withDeps: false,
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
  rules: {
    tags: {
      excluded: [],
    },
  },
};

export const AnalysisWizardContainer: React.FunctionComponent<
  IAnalysisWizard
> = ({ applications, onClose }: IAnalysisWizard) => {
  const completeTask = () => {
    console.log("complete task");
  };

  const {
    mutate: createTask,
    postResult,
    isLoading: isCreateInitialTaskLoading,
    error,
  } = useCreateInitialTaskMutation(completeTask());

  const { register, getValues, setValue, handleSubmit, watch, reset } =
    useFormContext<IAnalysisWizardFormValues>();

  const {
    mode,
    targets,
    sources,
    withKnown,
    includedPackages,
    excludedPackages,
    customRulesFiles,
    excludedRulesTags,
  } = getValues();

  const [stepIdReached, setStepIdReached] = useState(1);
  const [showUploadBinaryStep, setShowUploadBinaryStep] = useState(false);
  const [showSetTargetsStep, setShowSetTargetsStep] = useState(false);
  const [showScopeStep, setShowScopeStep] = useState(false);
  const [showAdvancedSteps, setShowAdvancedSteps] = useState(false);
  const [showReviewStep, setShowReviewStep] = useState(false);

  enum stepId {
    AnalysisMode = 1,
    UploadBinaryStep,
    SetTargets,
    Scope,
    CustomRules,
    Options,
    Review,
  }

  const title = "Application analysis";

  const setTask = (application: Application, data: FieldValues): Task => {
    return {
      name: `${application.name}-windup-test`,
      addon: "windup",
      data: {
        ...defaultTaskData,
        application: application.id || 0,
        path: "",
        mode: {
          binary: data.mode.includes("Binary") || data.mode.includes("binary"),
          withDeps: data.mode.includes("dependencies"),
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
        rules: {
          tags: {
            excluded: data.excludedRulesTags,
          },
        },
      },
    };
  };

  const onSubmit = (data: FieldValues) => {
    // if (data.targets.length < 1) {
    //   console.log("Invalid form");
    //   return;
    // }
    // const tasks = applications.map((app) => setTask(app, data));
    // const promises = Promise.all(tasks.map((task) => createTask(task)));
    // promises
    //   .then((response) => {
    //     dispatch(
    //       alertActions.addSuccess(
    //         `Task(s) ${response
    //           .map((res) => res.data.name)
    //           .join(", ")} were added`
    //       )
    //     );
    //     onClose();
    //   })
    //   .catch((error) => {
    //     dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
    //   });
  };

  const onMove: WizardStepFunctionType = (
    { id, name },
    { prevId, prevName }
  ) => {
    if (id && prevId && prevId === 1) {
      console.log("moving past first step -- create task here");
      const initialTask: Task = {
        name: `${applications[0].name}-windup-test`,
        addon: "windup",
        data: {
          application: applications[0].id || 0,
        },
      };

      createTask(initialTask);
    }

    if (id && stepIdReached < id) {
      setStepIdReached(id as number);
    }
    if (prevId && id && prevId > 1 && id === 1) {
      setShowAdvancedSteps(false);
      setShowReviewStep(false);
      setShowScopeStep(false);
      setShowSetTargetsStep(false);
      setShowUploadBinaryStep(false);
    }
  };

  const uploadBinaryStep = {
    id: stepId.UploadBinaryStep,
    name: "Upload Binary",
    component: <UploadBinaryStep></UploadBinaryStep>,
    canJumpTo: stepIdReached >= stepId.UploadBinaryStep,
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
            <SetMode isSingleApp={applications.length === 1 ? true : false} />
          ),
          canJumpTo: stepIdReached >= stepId.AnalysisMode,
        },
        ...(showUploadBinaryStep ? [uploadBinaryStep] : []),
        ...(showSetTargetsStep ? [setTargetsStep] : []),
        ...(showScopeStep ? [scopeStep] : []),
      ],
    },
    ...(showAdvancedSteps ? [advancedSteps] : []),
    ...(showReviewStep ? [reviewStep] : []),
  ];

  console.log(watch());

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
            switch (activeStep.id) {
              case 1:
                {
                  if (mode) {
                    return true;
                  }
                }
                break;
              default:
                true;
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
    if (activeStep.id === 1 && mode === "Upload a local binary") {
      setShowUploadBinaryStep(true);
      setShowSetTargetsStep(true);
      setShowScopeStep(true);
      setShowAdvancedSteps(true);
      setShowReviewStep(true);
      setTimeout(() => {
        callback();
      });
    } else {
      setShowSetTargetsStep(true);
      setShowScopeStep(true);
      setShowAdvancedSteps(true);
      setShowReviewStep(true);
      setTimeout(() => {
        callback();
      });
    }
  };

  const getPreviousStep = (activeStep: any, callback: any) => {
    setTimeout(() => {
      callback();
    });
  };
  const handleClose = () => {
    onClose();
    setStepIdReached(stepId.AnalysisMode);
    setShowAdvancedSteps(false);
    setShowReviewStep(false);
    setShowScopeStep(false);
    setShowSetTargetsStep(false);
    setShowUploadBinaryStep(false);
    reset();
  };
  return (
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
  );
};
