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
  Popover,
  PopoverPosition,
  Switch,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import "./tracker-form.css";
import { IdentityKind, IssueManagerKind, Tracker } from "@app/api/models";
import { IssueManagerOptions, toOptionLike } from "@app/utils/model-utils";
import {
  useCreateTrackerMutation,
  useFetchTrackers,
  useUpdateTrackerMutation,
} from "@app/queries/trackers";
import { useFetchIdentities } from "@app/queries/identities";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  standardStrictURLRegex,
} from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { QuestionCircleIcon } from "@patternfly/react-icons";

const supportedIdentityKindByIssueManagerKind: Record<
  IssueManagerKind,
  IdentityKind[]
> = {
  "jira-cloud": ["basic-auth"],
  "jira-onprem": ["basic-auth", "bearer"],
};

interface FormValues {
  id: number;
  name: string;
  url: string;
  kind?: IssueManagerKind;
  credentialName: string;
  insecure: boolean;
}

export interface TrackerFormProps {
  onClose: () => void;
  addUpdatingTrackerId: (id: number) => void;
  tracker?: Tracker;
}

export const TrackerForm: React.FC<TrackerFormProps> = ({
  tracker,
  onClose,
  addUpdatingTrackerId,
}) => {
  const { t } = useTranslation();

  const [axiosError, setAxiosError] = useState<AxiosError>();

  const { trackers: trackers } = useFetchTrackers();
  const { identities } = useFetchIdentities();

  const { pushNotification } = React.useContext(NotificationsContext);

  const onCreateTrackerSuccess = (_: AxiosResponse<Tracker>) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.instance"),
      }),
      variant: "success",
    });

    addUpdatingTrackerId(_.data.id);
  };

  const onUpdateTrackerSuccess = (
    _: AxiosResponse<Tracker>,
    tracker: Tracker
  ) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.instance"),
      }),
      variant: "success",
    });

    addUpdatingTrackerId(tracker.id);
  };

  const onCreateUpdatetrackerError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: createTracker } = useCreateTrackerMutation(
    onCreateTrackerSuccess,
    onCreateUpdatetrackerError
  );

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
      kind: formValues.kind!,
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
      createTracker(payload);
    }
    onClose();
  };

  const standardStrictURL = new RegExp(standardStrictURLRegex);

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
      .matches(
        standardStrictURL,
        "Enter a valid URL. Note that a cloud instance or most public instances will require the use of HTTPS."
      )
      .required(t("validation.required")),
    kind: yup.mixed<IssueManagerKind>().required(),
    credentialName: yup.string().required(),
    insecure: yup.boolean().required(),
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
      name: tracker?.name || "",
      url: tracker?.url || "",
      id: tracker?.id || 0,
      kind: tracker?.kind,
      credentialName: tracker?.identity?.name || "",
      insecure: tracker?.insecure || false,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const values = getValues();
  const watchAllFields = watch();

  const identityOptions = (kind?: IssueManagerKind) => {
    const identityKinds = kind
      ? supportedIdentityKindByIssueManagerKind[kind]
      : [];
    return identities
      .filter((identity) =>
        identity.kind ? identityKinds.includes(identity.kind) : false
      )
      .map((identity) => {
        return {
          value: identity.name,
          toString: () => identity.name,
        };
      });
  };

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
            value={
              value
                ? toOptionLike(value, identityOptions(values.kind))
                : undefined
            }
            options={identityOptions(values.kind)}
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
          <span>
            <Switch
              id="insecure-switch"
              label="Enable insecure communication"
              aria-label="Insecure Communication"
              isChecked={value}
              onChange={onChange}
            />
            <Popover
              position={PopoverPosition.top}
              aria-label="insecure details"
              bodyContent={t("message.insecureTracker")}
              className="popover"
            >
              <span className={`${spacing.mlSm} pf-v5-c-icon pf-m-info`}>
                <QuestionCircleIcon />
              </span>
            </Popover>
          </span>
        )}
      />

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!tracker ? "Create" : "Save"}
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
