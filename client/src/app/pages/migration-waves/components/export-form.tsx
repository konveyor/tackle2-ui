import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { IssueManagerKind, New, Ref, Ticket, Tracker } from "@app/api/models";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateTicketsMutation,
  useFetchTickets,
} from "@app/queries/tickets";
import {
  getTrackersByKind,
  useTrackerProjectsByTracker,
  useTrackerTypesByProjectName,
} from "@app/queries/trackers";
import { IssueManagerOptions } from "@app/utils/model-utils";
import { getAxiosErrorMessage } from "@app/utils/utils";

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
    watch,
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
    mode: "all",
  });

  const values = watch();

  const projectsByTracker = useTrackerProjectsByTracker(values.tracker);

  const matchingProject = projectsByTracker.find(
    (project) => values.project === project.name
  );

  const typesByProject = useTrackerTypesByProjectName(
    values.tracker,
    values.project
  );
  const matchingKind = typesByProject.find((type) => values.kind === type.name);

  const onSubmit = (formValues: FormValues) => {
    const matchingtracker = trackers.find(
      (tracker) => formValues?.tracker === tracker.name
    );

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
          <TypeaheadSelect
            toggleId="issue-manager-select-toggle"
            placeholderText={t("composed.selectAn", {
              what: t("terms.instanceType").toLowerCase(),
            })}
            toggleAriaLabel="Type select dropdown toggle"
            ariaLabel={name}
            value={value}
            options={IssueManagerOptions}
            onSelect={(selection) => {
              setValue("tracker", "");
              setValue("project", "");
              setValue("kind", "");
              onChange(selection);
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
          <TypeaheadSelect
            toggleId="tracker-select-toggle"
            placeholderText={t("composed.selectAn", {
              what: t("terms.instance").toLowerCase(),
            })}
            isDisabled={!values.issueManager}
            toggleAriaLabel="tracker select dropdown toggle"
            ariaLabel={name}
            value={value}
            options={
              values.issueManager
                ? getTrackersByKind(
                    trackers,
                    values.issueManager?.toString()
                  ).map(
                    (tracker): FilterSelectOptionProps => ({
                      value: tracker.name,
                      label: tracker.name,
                    })
                  )
                : []
            }
            onSelect={(selection) => {
              setValue("project", "");
              setValue("kind", "");
              onChange(selection ?? "");
            }}
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
          <TypeaheadSelect
            toggleId="project-select-toggle"
            placeholderText={t("composed.selectOne", {
              what: t("terms.project").toLowerCase(),
            })}
            isDisabled={!values.tracker}
            toggleAriaLabel="project select dropdown toggle"
            ariaLabel={name}
            value={value}
            options={
              projectsByTracker?.map(
                (project): FilterSelectOptionProps => ({
                  value: project.name,
                  label: project.name,
                })
              ) || []
            }
            onSelect={(selection) => {
              setValue("kind", "");
              onChange(selection ?? "");
            }}
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
          <TypeaheadSelect
            toggleId="issue-type-select-toggle"
            placeholderText={t("composed.selectAn", {
              what: t("terms.issueType").toLowerCase(),
            })}
            isDisabled={!values.project}
            toggleAriaLabel="issue-type select dropdown toggle"
            ariaLabel={name}
            value={value}
            options={
              typesByProject?.map(
                (issueType): FilterSelectOptionProps => ({
                  value: issueType.name,
                  label: issueType.name,
                })
              ) || []
            }
            onSelect={(selection) => onChange(selection ?? "")}
          />
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
