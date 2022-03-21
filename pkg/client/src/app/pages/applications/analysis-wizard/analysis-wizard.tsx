import * as React from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Wizard } from "@patternfly/react-core";

import { Application, Task, TaskData } from "@app/api/models";
import { SetMode } from "./set-mode";
import { SetTargets } from "./set-targets";
import { SetScope } from "./set-scope";
import { SetOptions } from "./set-options";
import { Review } from "./review";
import {
  createTask,
  submitTask,
  updateTask,
  uploadFileTask,
} from "@app/api/rest";
import { alertActions } from "@app/store/alert";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { CustomRules } from "./custom-rules";
import { IReadFile } from "./components/add-custom-rules";

import "./wizard.css";
interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
}

export interface IAnalysisWizardFormValues {
  mode: string;
  output: string;
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
      targets: [],
      sources: [],
      withKnown: "",
      includedPackages: [""],
      excludedPackages: [""],
      customRulesFiles: [],
      excludedRulesTags: [""],
    },
  });

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
        setCreatedTasks(
          response.map((res) => {
            dispatch(
              alertActions.addSuccess(`Tasks ${res.data.id}`, "created")
            );
            return res.data as Task;
          })
        );
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
          binary: data.mode.includes("Binary"),
          withDeps: data.mode.includes("dependencies"),
          artifact: data.artifact,
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

  const onSubmit = (data: FieldValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }

    const tasks = createdTasks.map((task) => setTask(task, data));

    Promise.all(
      tasks.map((task) =>
        data.customRulesFiles.forEach((file: any) => {
          const formFile = new FormData();
          formFile.append("file", file.file);
          dispatch(
            alertActions.addInfo(
              `Task ${task.id}`,
              `Uploading File /rules/${file.fileName}`
            )
          );

          return uploadFileTask(
            task.id as number,
            `/rules/${file.fileName}`,
            formFile
          );
        })
      )
    );

    const promises = Promise.all(tasks.map((task) => updateTask(task)));
    promises
      .then(() => {
        const submissions = Promise.all(tasks.map((task) => submitTask(task)));
        submissions.then((response) => {
          dispatch(alertActions.addSuccess("Tasks", "Submitted for analysis"));
        });
        onClose();
      })
      .catch((error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      });
  };

  const steps = [
    {
      name: "Configure analysis",
      steps: [
        {
          name: "Analysis mode",
          component: (
            <SetMode isSingleApp={applications.length === 1 ? true : false} />
          ),
        },
        {
          name: "Set targets",
          component: <SetTargets />,
        },
        {
          name: "Scope",
          component: <SetScope />,
        },
      ],
    },
    {
      name: "Advanced",
      steps: [
        {
          name: "Custom rules",
          component: <CustomRules />,
        },
        {
          name: "Options",
          component: <SetOptions />,
        },
      ],
    },
    {
      name: "Review",
      component: <Review applications={applications} />,
      nextButtonText: "Run",
    },
  ];

  if (!isInitTasks) initTasks();

  console.log(methods.watch());

  return (
    <FormProvider {...methods}>
      <Wizard
        isOpen={true}
        title="Application analysis"
        description={applications.map((app) => app.name).join(", ")}
        navAriaLabel={`${title} steps`}
        mainAriaLabel={`${title} content`}
        steps={steps}
        onSave={methods.handleSubmit(onSubmit)}
        onClose={onClose}
      />
    </FormProvider>
  );
};
