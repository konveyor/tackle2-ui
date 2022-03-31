import * as React from "react";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { Wizard, WizardStepFunctionType } from "@patternfly/react-core";
import { useIsMutating } from "react-query";

import { Application, Task, TaskData } from "@app/api/models";
import {
  createTask,
  submitTask,
  updateTask,
  uploadFileTask,
} from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { alertActions } from "@app/store/alert";
import { CustomRules } from "./custom-rules";
import { Review } from "./review";
import { SetMode } from "./set-mode";
import { SetOptions } from "./set-options";
import { SetScope } from "./set-scope";
import { SetTargets } from "./set-targets";

import "./wizard.css";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";

enum stepId {
  AnalysisMode = 1,
  SetTargets,
  Scope,
  CustomRules,
  Options,
  Review,
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

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
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
  const isMutating = useIsMutating();

  const [isInitTasks, setInitTasks] = React.useState(false);
  const [createdTasks, setCreatedTasks] = React.useState<Array<Task>>([]);

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
      withKnown: "depsOnly",
      includedPackages: [""],
      excludedPackages: [""],
      customRulesFiles: [],
      excludedRulesTags: [""],
    },
  });

  const { identities, fetchIdentities } = useFetchIdentities();

  React.useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const hasIdentity = (application: Application, kind: string): boolean =>
    !!application.identities?.some((appIdentity) =>
      identities?.find(
        (identity) => appIdentity.id === identity.id && identity.kind === kind
      )
    );

  const areApplicationsBinaryEnabled = (): boolean =>
    applications.every(
      (application) =>
        application.binary !== "::" &&
        application.identities &&
        application.identities.length > 0 &&
        hasIdentity(application, "maven")
    );

  const areApplicationsSourceCodeEnabled = (): boolean =>
    applications.every(
      (application) =>
        application.repository &&
        application.repository.url !== "" &&
        application.identities &&
        application.identities.length > 0
    );

  const areApplicationsSourceCodeDepsEnabled = (): boolean =>
    applications.every(
      (application) =>
        application.repository &&
        application.repository.url !== "" &&
        application.identities &&
        application.identities.length > 0 &&
        hasIdentity(application, "maven")
    );

  const { handleSubmit, watch, reset } = methods;
  const watchAllFields = watch();

  const initTask = (application: Application): Task => {
    return {
      name: `${application.name}.${application.id}.windup`,
      addon: "windup",
      application: { id: application.id || 0 },
      data: {
        ...defaultTaskData,
      },
    };
  };

  const initTasks = () => {
    const tasks = applications.map((app) => initTask(app));
    const promises = Promise.all(tasks.map((task) => createTask(task)));
    promises
      .then((response) => {
        setInitTasks(true);
        setCreatedTasks(response.map((res) => res.data as Task));
      })
      .catch((error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
        onClose();
      });
  };

  const setTask = (task: Task, data: FieldValues): Task => {
    return {
      ...task,
      data: {
        ...defaultTaskData,
        mode: {
          binary: data.mode.includes("Binary") || data.mode.includes("binary"),
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

  !isInitTasks && initTasks();

  const [stepIdReached, setStepIdReached] = React.useState(1);

  const onSubmit = (data: FieldValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }

    const tasks = createdTasks.map((task: Task) => setTask(task, data));

    Promise.all(
      tasks.map((task) =>
        data.customRulesFiles.forEach((file: any) => {
          const formFile = new FormData();
          formFile.append("file", file.file);

          return uploadFileTask({
            id: task.id as number,
            path: `/rules/${file.fileName}`,
            file: formFile,
          });
        })
      )
    );

    const promises = Promise.all(tasks.map((task) => updateTask(task)));

    promises
      .then(() => {
        const submissions = Promise.all(tasks.map((task) => submitTask(task)));
        submissions.then((response) => {
          dispatch(
            alertActions.addSuccess("Applications", "Submitted for analysis")
          );
        });
        onClose();
      })
      .catch((error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      });
  };

  const onMove: WizardStepFunctionType = ({ id }) => {
    if (id && stepIdReached < id) {
      setStepIdReached(id as number);
    }
  };

  const { mode, artifact, targets } = methods.getValues();

  const isModeValid = (): boolean => {
    if (mode.includes("Upload")) return !isMutating && artifact !== "";
    if (mode.includes("Binary")) return areApplicationsBinaryEnabled();
    else if (mode.includes("dependencies"))
      return areApplicationsSourceCodeDepsEnabled();
    else return areApplicationsSourceCodeEnabled();
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
              createdTaskID={createdTasks[0]?.id || null}
              isModeValid={isModeValid()}
            />
          ),
          canJumpTo: stepIdReached >= stepId.AnalysisMode,
          enableNext: isModeValid(),
        },
        {
          id: stepId.SetTargets,
          name: "Set targets",
          component: <SetTargets />,
          canJumpTo: stepIdReached >= stepId.SetTargets,
          enableNext: targets.length > 0,
        },
        {
          id: stepId.Scope,
          name: "Scope",
          component: <SetScope />,
          canJumpTo: stepIdReached >= stepId.Scope,
          enableNext: true,
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
          enableNext: true,
        },
        {
          id: stepId.Options,
          name: "Options",
          component: <SetOptions />,
          canJumpTo: stepIdReached >= stepId.Options,
          enableNext: true,
        },
      ],
    },
    {
      id: stepId.Review,
      name: "Review",
      component: <Review applications={applications} />,
      nextButtonText: "Run",
      canJumpTo: stepIdReached >= stepId.Review,
    },
  ];

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
