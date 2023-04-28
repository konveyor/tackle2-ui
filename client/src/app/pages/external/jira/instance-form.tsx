import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import * as yup from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  Switch,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { JiraTracker, JiraKind } from "@app/api/models";
import { toOptionLike } from "@app/utils/model-utils";
import {
  useCreateJiraTrackerMutation,
  useFetchJiraTrackers,
  useUpdateJiraTrackerMutation,
} from "@app/queries/jiratrackers";
import { useFetchIdentities } from "@app/queries/identities";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { NotificationsContext } from "@app/shared/notifications-context";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";

interface FormValues {
  id: number;
  name: string;
  url: string;
  kind: JiraKind;
  credentialName: string;
}

export interface InstanceFormProps {
  instance?: JiraTracker;
  onClose: () => void;
}

export const InstanceForm: React.FC<InstanceFormProps> = ({
  instance,
  onClose,
}) => {
  const { t } = useTranslation();

  const [axiosError, setAxiosError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [insecureCommunication, setInsecureCommunication] = useState(false);

  const { jiraTrackers: instances } = useFetchJiraTrackers();
  const { identities } = useFetchIdentities();

  const { pushNotification } = React.useContext(NotificationsContext);

  const onCreateInstanceSuccess = (_: AxiosResponse<JiraTracker>) =>
    pushNotification({
      title: t("terms.jiraInstanceCreated"),
      variant: "success",
    });

  const onCreateUpdateInstanceError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: createInstance } = useCreateJiraTrackerMutation(
    onCreateInstanceSuccess,
    onCreateUpdateInstanceError
  );

  const onUpdateInstanceSuccess = (_: AxiosResponse<JiraTracker>) =>
    pushNotification({
      title: t("terms.jiraInstanceUpdated"),
      variant: "success",
    });

  const { mutate: updateInstance } = useUpdateJiraTrackerMutation(
    onUpdateInstanceSuccess,
    onCreateUpdateInstanceError
  );

  const onSubmit = (formValues: FormValues) => {
    const matchingCredential = identities.find(
      (identity) => formValues?.credentialName === identity.name
    );

    const payload: JiraTracker = {
      name: formValues.name.trim(),
      url: formValues.url.trim(),
      id: formValues.id,
      kind: formValues.kind,
      metadata: { projects: [] },
      message: "",
      connected: false,
      identity: matchingCredential
        ? { id: matchingCredential.id, name: matchingCredential.name }
        : undefined,
    };
    if (instance) {
      updateInstance({
        ...payload,
      });
    } else {
      createInstance(payload);
    }
    onClose();
  };

  const validationSchema: yup.SchemaOf<FormValues> = yup.object().shape({
    id: yup.number().defined(),
    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An identity with this name already exists. Use a different name.",
        (value) => duplicateNameCheck(instances, instance || null, value || "")
      ),
    url: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .max(250, t("validation.maxLength", { length: 250 })),
    kind: yup.mixed<JiraKind>().required(),
    credentialName: yup.string().required(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: instance?.name || "",
      url: instance?.url || "",
      id: instance?.id || 0,
      kind: instance?.kind,
      credentialName: instance?.identity?.name || "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = getValues();
  const watchAllFields = watch();

  const kindOptions: OptionWithValue<JiraKind>[] = [
    {
      value: "jira-cloud",
      toString: () => "Jira Cloud",
    },
    {
      value: "jira-server",
      toString: () => "Jira Server",
    },
    {
      value: "jira-datacenter",
      toString: () => "Jira Datacenter",
    },
  ];

  const identityOptions = identities
    .filter((identity) => identity.kind === "jira")
    .map((identity) => {
      return {
        value: identity.name,
        toString: () => identity.name,
      };
    });

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {axiosError && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(axiosError)}
        />
      )}
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Instance name"
        fieldId="name"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="url"
        label="URL"
        fieldId="url"
        isRequired
      />
      <HookFormPFGroupController
        control={control}
        name="kind"
        label="Instance type"
        fieldId="type-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="type-select"
            toggleId="type-select-toggle"
            variant="typeahead"
            placeholderText={t("composed.selectMany", {
              what: t("terms.instanceType").toLowerCase(),
            })}
            toggleAriaLabel="Type select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, kindOptions) : undefined}
            options={kindOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<JiraKind>;
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="credentialName"
        label={t("terms.credentials")}
        fieldId="credentials-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="credentials-select"
            toggleId="credentials-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectMany", {
              what: t("terms.credentials").toLowerCase(),
            })}
            toggleAriaLabel="Credentials select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, identityOptions) : undefined}
            options={identityOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <Switch
        id="insecureCommunication"
        className="repo"
        label="Enable insecure communication"
        aria-label="Insecure Communication"
        // TODO Handle field once hub support is ready
        isChecked={insecureCommunication}
        onChange={() => setInsecureCommunication(!insecureCommunication)}
      />
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
          }
        >
          {!instance ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
