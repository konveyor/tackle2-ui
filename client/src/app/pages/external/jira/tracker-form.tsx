import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import * as yup from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  Spinner,
  Switch,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { IssueManagerKind, Tracker } from "@app/api/models";
import { IssueManagerOptions, toOptionLike } from "@app/utils/model-utils";
import {
  useCreateTrackerMutation,
  useFetchTrackers,
  useUpdateTrackerMutation,
} from "@app/queries/trackers";
import { useFetchIdentities } from "@app/queries/identities";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  standardURLRegex,
} from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { NotificationsContext } from "@app/shared/notifications-context";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import TrackerStatus from "./components/tracker-status";

interface FormValues {
  id: number;
  name: string;
  url: string;
  kind: IssueManagerKind;
  credentialName: string;
  insecure: boolean;
}

export interface TrackerFormProps {
  tracker?: Tracker;
  modalState: {
    setTrackerModalState: (value: any) => void;
    trackerModalState: any;
  };
}

export const TrackerForm: React.FC<TrackerFormProps> = ({
  tracker,
  modalState,
}) => {
  const { t } = useTranslation();

  const [axiosError, setAxiosError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTracker, setCurrentTracker] = useState<Tracker | null>(
    tracker || null
  );

  const { trackers: trackers } = useFetchTrackers();
  const { identities } = useFetchIdentities();
  useEffect(() => {
    reset({
      name: tracker?.name || "",
      url: tracker?.url || "",
      id: tracker?.id || 0,
      kind: tracker?.kind,
      credentialName: tracker?.identity?.name || "",
      insecure: tracker?.insecure || false,
    });
  }, []);
  useEffect(() => {
    if (currentTracker) {
      const matchingTracker =
        trackers.find((updatedTracker) => {
          return updatedTracker.name === tracker?.name;
        }) || currentTracker;
      console.log("matchingTracker", matchingTracker?.lastUpdated);
      console.log("tracker", tracker?.lastUpdated);
      if (
        matchingTracker &&
        matchingTracker.lastUpdated !== "0001-01-01T00:00:00Z" &&
        currentTracker.lastUpdated !== matchingTracker.lastUpdated
      ) {
        // update tracker
        console.log("update tracker");
        setCurrentTracker(matchingTracker);
        reset({
          name: matchingTracker?.name || "",
          url: matchingTracker?.url || "",
          id: matchingTracker?.id || 0,
          kind: matchingTracker?.kind,
          credentialName: matchingTracker?.identity?.name || "",
          insecure: matchingTracker?.insecure || false,
        });
        setIsLoading(false);
      }
    }
  }, [trackers]);

  const { pushNotification } = React.useContext(NotificationsContext);

  const onCreateTrackerSuccess = (createdTracker: Tracker) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.instance").toLocaleLowerCase(),
      }),
      variant: "success",
    });

    modalState.setTrackerModalState({ mode: "edit", resource: createdTracker });
    setCurrentTracker(createdTracker);
  };

  const onCreateUpdatetrackerError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: createTracker } = useCreateTrackerMutation(
    onCreateTrackerSuccess,
    onCreateUpdatetrackerError
  );

  const onUpdateTrackerSuccess = (_: AxiosResponse<Tracker>) =>
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.instance").toLocaleLowerCase(),
      }),
      variant: "success",
    });

  const { mutate: updateTracker } = useUpdateTrackerMutation(
    onUpdateTrackerSuccess,
    onCreateUpdatetrackerError
  );

  const onSubmit = (formValues: FormValues) => {
    const matchingCredential = identities.find(
      (identity) => formValues?.credentialName === identity.name
    );

    const payload: Tracker = {
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
      insecure: formValues.insecure,
    };
    if (tracker) {
      updateTracker({
        ...payload,
      });
    } else {
      createTracker({ tracker: payload });
    }
    // onClose();
    setIsLoading(true);
    reset();
  };

  const standardURL = new RegExp(standardURLRegex);

  const validationSchema: yup.SchemaOf<FormValues> = yup.object().shape({
    id: yup.number().defined(),
    name: yup
      .string()
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An identity with this name already exists. Use a different name.",
        (value) => duplicateNameCheck(trackers, tracker || null, value || "")
      )
      .required(t("validation.required")),
    url: yup
      .string()
      .max(250, t("validation.maxLength", { length: 250 }))
      .matches(standardURL, "Enter a valid URL")
      .required(t("validation.required")),
    kind: yup.mixed<IssueManagerKind>().required(),
    credentialName: yup.string().required(),
    insecure: yup.boolean().required(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    formState,
    getValues,
    setValue,
    control,
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  console.log(
    "!isValid",
    "isSubmitting",
    "isValidating",
    "isLoading",
    "!isDirty",
    !isValid,
    isSubmitting,
    isValidating,
    isLoading,
    !isDirty
  );
  console.log("dirtyFields", formState.dirtyFields);
  const values = getValues();
  const watchAllFields = watch();

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
        isDisabled={!!currentTracker}
      />
      <HookFormPFTextInput
        control={control}
        name="url"
        label="URL"
        fieldId="url"
        isRequired
        isDisabled={isLoading}
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
            isDisabled={isLoading}
            value={value ? toOptionLike(value, IssueManagerOptions) : undefined}
            options={IssueManagerOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<IssueManagerKind>;
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
            isDisabled={isLoading}
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
      <HookFormPFGroupController
        control={control}
        name="insecure"
        fieldId="insecure-switch"
        renderInput={({ field: { value, onChange } }) => (
          <Switch
            id="insecure-switch"
            label="Enable insecure communication"
            aria-label="Insecure Communication"
            isDisabled={isLoading}
            isChecked={value}
            onChange={onChange}
          />
        )}
      />
      <div>
        {currentTracker ? (
          currentTracker.connected ? (
            <TrackerStatus connected={true} />
          ) : (
            <TrackerStatus connected={false} />
          )
        ) : (
          <div />
        )}
      </div>
      <ActionGroup>
        {isLoading && <Spinner />}
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
          }
        >
          {!tracker ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
          id="close"
          aria-label="close"
          variant={ButtonVariant.secondary}
          isDisabled={isSubmitting || isValidating}
          onClick={() => modalState.setTrackerModalState(null)}
        >
          Close
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={() => modalState.setTrackerModalState(null)}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
