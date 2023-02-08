import React from "react";
import YAML from "yaml";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  useCreateTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";
import { SimpleSelect } from "@app/shared/components";
import { Application, Addon, Taskgroup, TaskgroupTask } from "@app/api/models";
import { getValidatedFromErrorTouched } from "@app/utils/utils";
import { toAddonDropdownOptionWithValue } from "@app/utils/model-utils";
import { NotificationsContext } from "@app/shared/notifications-context";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { useFetchAllTasks } from "@app/queries/tasks";

interface RunAddonFormValues {
  addon: string;
  data: string;
}

export interface RunAddonFormProps {
  applications?: Application[];
  addons: Addon[];
  onSaved: () => void;
  onCancel: () => void;
}

export const RunAddonForm: React.FC<RunAddonFormProps> = ({
  applications,
  addons,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const { tasks } = useFetchAllTasks();
  const { pushNotification } = React.useContext(NotificationsContext);

  const onCreateTaskgroupSuccess = (data: Taskgroup) => {
    submitTaskgroup(data);
  };

  const onCreateTaskgroupError = (error: Error | unknown) => {
    console.log("Taskgroup creation failed: ", error);
    pushNotification({
      title: "Taskgroup creation failed",
      variant: "danger",
    });
  };

  const { mutate: createTaskgroup } = useCreateTaskgroupMutation(
    onCreateTaskgroupSuccess,
    onCreateTaskgroupError
  );

  const onSubmitTaskgroupSuccess = (data: Taskgroup) => {
    pushNotification({
      title: "Applications",
      message: `Task submitted`,
      variant: "info",
    });
    onSaved();
  };

  const onSubmitTaskgroupError = (error: Error | unknown) => {
    pushNotification({
      title: "Taskgroup submit failed",
      variant: "danger",
    });
  };

  const { mutate: submitTaskgroup } = useSubmitTaskgroupMutation(
    onSubmitTaskgroupSuccess,
    onSubmitTaskgroupError
  );

  const initTask = (addon: string, application: Application): TaskgroupTask => {
    return {
      name: `${application.name}.${application.id}.${addon}`,
      data: {},
      application: { id: application.id as number, name: application.name },
    };
  };

  const onSubmit = (formValues: RunAddonFormValues) => {
    const addon = formValues.addon.trim();
    const data = YAML.parse(formValues.data.trim());
    var payload: Taskgroup;
    if (!applications?.length || applications.length < 1) {
      console.log("Invalid form");
      return;
    }

    payload = {
      name: `${formValues.addon.trim()}`,
      addon: addon,
      data: data,
      tasks: applications?.map((application) => initTask(addon, application)),
    };
    createTaskgroup(payload);
  };

  const isAppRunningAddon = (addon: string) => {
    if (!applications?.length || applications.length < 1) {
      return false;
    }
    const addonTasks = tasks.filter((task) => task.addon === addon);
    const runningTasks = addonTasks.filter((task) => {
      return applications.some((app) => {
        return (
          task.application?.id === app.id &&
          task.state?.match(/(Created|Running|Ready|Pending)/)
        );
      });
    });
    return runningTasks.length !== 0;
  };

  const validationSchema: yup.SchemaOf<RunAddonFormValues> = yup
    .object()
    .shape({
      addon: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .test(
          "Application(s) running addon",
          "Task(s) running for at least one of selected applications.",
          (value) => !isAppRunningAddon(value || "")
        ),
      data: yup.string().required(t("validation.required")),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid },
    control,
  } = useForm<RunAddonFormValues>({
    defaultValues: {
      addon: "",
      data: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFGroupController
        control={control}
        name="addon"
        label="Addon"
        fieldId="addon-select"
        isRequired
        renderInput={({
          field: { onChange, onBlur, value, name },
          fieldState: { isTouched, error },
        }) => (
          <SimpleSelect
            id="addon-select"
            toggleId="addon-select-toggle"
            toggleAriaLabel="Addon select dropdown toggle"
            aria-label={name}
            value={value ? value : undefined}
            options={addons?.map((addon) =>
              toAddonDropdownOptionWithValue(addon)
            )}
            onChange={(value) => {
              onChange(value);
              onBlur();
            }}
            validated={getValidatedFromErrorTouched(error, isTouched)}
          />
        )}
      />

      <HookFormPFGroupController
        control={control}
        name="data"
        label="Data"
        fieldId="data"
        isRequired
        renderInput={({ field: { onChange, value } }) => (
          <CodeEditor
            code={value ? value : ""}
            onChange={onChange}
            language={Language.yaml}
            onEditorDidMount={(editor, monaco) => {
              editor.layout();
              editor.focus();
              monaco.editor.getModels()[0].updateOptions({ tabSize: 4 });
            }}
            height="20em"
          />
        )}
      />

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating}
        >
          {"Run"}
        </Button>
        <Button
          type="button"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
