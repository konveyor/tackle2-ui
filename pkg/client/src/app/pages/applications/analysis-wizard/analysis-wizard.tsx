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
import { createTask } from "@app/api/rest";
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
  targets: string[];
  sources: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: IReadFile[];
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

export const AnalysisWizard: React.FunctionComponent<IAnalysisWizard> = ({
  applications,
  onClose,
}: IAnalysisWizard) => {
  const title = "Application analysis";
  const dispatch = useDispatch();

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
      targets: [],
      sources: [],
      withKnown: "",
      includedPackages: [""],
      excludedPackages: [""],
      customRulesFiles: [],
      excludedRulesTags: [""],
    },
  });

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
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }
    const tasks = applications.map((app) => setTask(app, data));
    const promises = Promise.all(tasks.map((task) => createTask(task)));
    promises
      .then((response) => {
        dispatch(
          alertActions.addSuccess(
            `Task(s) ${response
              .map((res) => res.data.name)
              .join(", ")} were added`
          )
        );
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
