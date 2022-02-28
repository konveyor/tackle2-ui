import * as React from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Wizard } from "@patternfly/react-core";

import { Application, Task, TaskData } from "@app/api/models";
import { AnalysisMode } from "./analysis-mode";
import { SetTargets } from "./set-targets";
import { Scope } from "./scope";
import { Options } from "./options";
import { Review } from "./review";
import { createTask } from "@app/api/rest";
import { alertActions } from "@app/store/alert";
import { useTranslation } from "react-i18next";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { CustomRules } from "./custom-rules";

import "./analysis-wizard.css";
interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
}

export interface IFormValues {
  mode: string;
  targets: string[];
}

const defaultTaskData: TaskData = {
  application: 0,
  path: "",
  mode: {
    binary: false,
    withDeps: false,
  },
  targets: [],
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
  const { t } = useTranslation();
  const title = "Application analysis";
  const dispatch = useDispatch();

  const schema = yup
    .object({
      mode: yup.string().required(),
      target: yup.array().min(1, "Select one or more target"),
    })
    .required();

  const { register, setValue, handleSubmit, watch, formState } =
    useForm<IFormValues>({
      resolver: yupResolver(schema),
      defaultValues: {
        mode: "Binary",
        targets: [],
      },
    });

  const setTask = (application: Application, data: IFormValues): Task => {
    return {
      name: `${application.name}-windup-test`,
      addon: "windup",
      data: {
        ...defaultTaskData,
        application: application.id || 0,
        path: "/",
        mode: {
          binary: data.mode.includes("Binary"),
          withDeps: data.mode.includes("dependencies"),
        },
      },
    };
  };

  const onSubmit = (data: IFormValues) => {
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
            <AnalysisMode
              register={register}
              formState={formState}
              setValue={setValue}
            />
          ),
        },
        { name: "Set targets", component: <SetTargets setValue={setValue} /> },
        { name: "Scope", component: <Scope /> },
      ],
    },
    {
      name: "Advanced",
      steps: [
        {
          name: "Custom rules",
          component: (
            // <CustomRules projectId={1} skipChangeToProvisional={true} />
            <CustomRules />
          ),
        },
        { name: "Options", component: <Options /> },
      ],
    },
    {
      name: "Review",
      component: <Review />,
      nextButtonText: "Run",
    },
  ];

  // console.log(watch());

  return (
    <Wizard
      isOpen={true}
      title="Application analysis"
      description={applications.map((app) => app.name).join(", ")}
      navAriaLabel={`${title} steps`}
      mainAriaLabel={`${title} content`}
      steps={steps}
      onSave={handleSubmit(onSubmit)}
      onClose={onClose}
    />
  );
};
