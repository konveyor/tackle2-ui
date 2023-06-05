import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Tracker, IssueManagerKind, Ref, Ticket, New } from "@app/api/models";
import { IssueManagerOptions, toOptionLike } from "@app/utils/model-utils";
import {
  getTrackersByKind,
  getTrackerProjectsByTracker,
  getTrackerTypesByProjectName,
} from "@app/queries/trackers";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { NotificationsContext } from "@app/shared/notifications-context";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import {
  useCreateTicketsMutation,
  useFetchTickets,
} from "@app/queries/tickets";

interface FormValues {
  issueManager: IssueManagerKind | undefined;
  tracker: string;
  project: string;
  kind: string;
}

export interface ExportFormProps {
  applications: Ref[];
  trackers: Tracker[];
  onClose: () => void;
}

export const ExportForm: React.FC<ExportFormProps> = ({
  applications,
  trackers,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { tickets } = useFetchTickets();

  const onExportSuccess = () =>
    pushNotification({
      title: t("toastr.success.create", {
        type: t("terms.exportToIssue"),
      }),
      variant: "success",
    });

  const onExportError = (error: AxiosError) =>
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });

  const { mutate: createTickets } = useCreateTicketsMutation(
    onExportSuccess,
    onExportError
  );

  const validationSchema: yup.SchemaOf<FormValues> = yup.object().shape({
    issueManager: yup
      .mixed<IssueManagerKind>()
      .required("Issue Manager is a required field"),
    tracker: yup.string().required("Instance is a required field"),
    project: yup.string().required("Project is a required field"),
    kind: yup.string().required("Issue type is a required field"),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      issueManager: undefined,
      tracker: "",
      project: "",
      kind: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = getValues();

  const onSubmit = (formValues: FormValues) => {
    const matchingtracker = trackers.find(
      (tracker) => formValues?.tracker === tracker.name
    );
    const matchingProject = getTrackerProjectsByTracker(
      trackers,
      formValues.tracker
    ).find((project) => formValues.project === project.name);
    const matchingKind = getTrackerTypesByProjectName(
      trackers,
      formValues.tracker,
      formValues.project
    ).find((type) => formValues.kind === type.name);

    if (matchingtracker) {
      const payload: New<Ticket> = {
        tracker: { id: matchingtracker.id, name: matchingtracker.name },
        parent: matchingProject?.id || "",
        kind: matchingKind?.id || "",
      };
      const applicationsWithNoAssociatedTickets = applications.filter(
        (application) => {
          const existingApplicationIDs = tickets.flatMap(
            (ticket) => ticket?.application?.id
          );
          return !existingApplicationIDs.includes(application.id);
        }
      );
      createTickets({
        payload,
        applications: applicationsWithNoAssociatedTickets,
      });
    }
    onClose();
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFGroupController
        control={control}
        name="issueManager"
        label="Issue Manager"
        fieldId="issue-manager-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="issue-manager-select"
            toggleId="issue-manager-select-toggle"
            variant="typeahead"
            placeholderText={t("composed.selectAn", {
              what: t("terms.instanceType").toLowerCase(),
            })}
            toggleAriaLabel="Type select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, IssueManagerOptions) : undefined}
            options={IssueManagerOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<IssueManagerKind>;
              setValue("tracker", "");
              setValue("project", "");
              setValue("kind", "");
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="tracker"
        label={t("terms.instance")}
        fieldId="tracker-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="tracker-select"
            toggleId="tracker-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectAn", {
              what: t("terms.instance").toLowerCase(),
            })}
            isDisabled={!values.issueManager}
            toggleAriaLabel="tracker select dropdown toggle"
            aria-label={name}
            value={value}
            options={
              values.issueManager
                ? getTrackersByKind(
                    trackers,
                    values.issueManager?.toString()
                  ).map((tracker) => {
                    return {
                      value: tracker.name,
                      toString: () => tracker.name,
                    };
                  })
                : []
            }
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              setValue("project", "");
              setValue("kind", "");
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="project"
        label={t("terms.project")}
        fieldId="project-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="project-select"
            toggleId="project-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectOne", {
              what: t("terms.project").toLowerCase(),
            })}
            isDisabled={!values.tracker}
            toggleAriaLabel="project select dropdown toggle"
            aria-label={name}
            value={value}
            options={getTrackerProjectsByTracker(trackers, values.tracker).map(
              (project) => {
                return {
                  value: project.name,
                  toString: () => project.name,
                };
              }
            )}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              setValue("kind", "");
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="kind"
        label={t("terms.issueType")}
        fieldId="issue-type-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="issue-type-select"
            toggleId="issue-type-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectAn", {
              what: t("terms.issueType").toLowerCase(),
            })}
            isDisabled={!values.project}
            toggleAriaLabel="issue-type select dropdown toggle"
            aria-label={name}
            value={value}
            options={getTrackerTypesByProjectName(
              trackers,
              values.tracker,
              values.project
            ).map((issueType) => {
              return {
                value: issueType.name,
                toString: () => issueType.name,
              };
            })}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {t("actions.export")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
