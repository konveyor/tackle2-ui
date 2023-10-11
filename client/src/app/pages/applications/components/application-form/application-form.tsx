import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { object, string } from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  ExpandableSection,
  Form,
  Popover,
  PopoverPosition,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { SimpleSelect, OptionWithValue } from "@app/components/SimpleSelect";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Application, Tag, TagRef } from "@app/api/models";
import {
  customURLValidation,
  dedupeArrayOfObjects,
  duplicateNameCheck,
  getAxiosErrorMessage,
} from "@app/utils/utils";
import {
  matchItemsToRef,
  matchItemsToRefs,
  toOptionLike,
} from "@app/utils/model-utils";
import {
  useCreateApplicationMutation,
  useFetchApplications,
  useUpdateApplicationMutation,
} from "@app/queries/applications";
import "./application-form.css";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTagCategories } from "@app/queries/tags";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { NotificationsContext } from "@app/components/NotificationsContext";
import ItemsSelect from "@app/components/items-select/items-select";

export interface FormValues {
  id: number;
  name: string;
  description: string;
  comments: string;
  businessServiceName: string;
  tags: string[];
  owner: string | null;
  contributors: string[];
  kind: string;
  sourceRepository: string;
  branch: string;
  rootPath: string;
  group: string;
  artifact: string;
  version: string;
  packaging: string;
}

export interface ApplicationFormProps {
  application: Application | null;
  onClose: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  application,
  onClose,
}) => {
  const { t } = useTranslation();
  const {
    existingApplications,
    businessServices,
    businessServiceToRef,
    stakeholders,
    stakeholderToRef,
    stakeholdersToRefs,
    tags,
    tagsToRefs,
    createApplication,
    updateApplication,
  } = useApplicationFormData({
    onActionSuccess: onClose,
  });

  const businessServiceOptions = businessServices.map((businessService) => {
    return {
      value: businessService.name,
      toString: () => businessService.name,
    };
  });

  const stakeholdersOptions = stakeholders.map((stakeholder) => {
    return {
      value: stakeholder.name,
      toString: () => stakeholder.name,
    };
  });

  const manualTags: TagRef[] = useMemo(() => {
    const rawManualTags: TagRef[] =
      application?.tags?.filter((t) => t?.source ?? "" === "") ?? [];
    return dedupeArrayOfObjects<TagRef>(rawManualTags, "name");
  }, [application?.tags]);

  const nonManualTags =
    application?.tags?.filter((t) => t?.source ?? "" !== "") ?? [];

  // Allow all tags to be selected manually, even if they are included from another source
  const allowedManualTags = tags;

  const getBinaryInitialValue = (
    application: Application | null,
    fieldName: string
  ) => {
    const fieldList = application?.binary?.split(":") || [];
    switch (fieldName) {
      case "group":
        return fieldList[0] || "";
      case "artifact":
        return fieldList[1] || "";
      case "version":
        return fieldList[2] || "";
      case "packaging":
        return fieldList[3] || "";
      default:
        return "";
    }
  };

  const validationSchema = object().shape(
    {
      name: string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 }))
        .test(
          "Duplicate name",
          "An application with this name already exists. Use a different name.",
          (value) =>
            duplicateNameCheck(
              existingApplications,
              application || null,
              value || ""
            )
        ),
      description: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      businessService: object()
        .shape({
          id: string()
            .trim()
            .max(250, t("validation.maxLength", { length: 250 })),
          value: string()
            .trim()
            .max(250, t("validation.maxLength", { length: 250 })),
        })
        .nullable(),
      comments: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      branch: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      rootPath: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      sourceRepository: string()
        .when("branch", {
          is: (branch: string) => branch?.length > 0,
          then: (schema) =>
            customURLValidation(schema).required("Enter repository url."),
          otherwise: (schema) => customURLValidation(schema),
        })
        .when("rootPath", {
          is: (rootPath: string) => rootPath?.length > 0,
          then: (schema) =>
            customURLValidation(schema).required("Enter repository url."),
          otherwise: (schema) => customURLValidation(schema),
        }),
      group: string()
        .when("artifact", {
          is: (artifact: string) => artifact?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("version", {
          is: (version: string) => version?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      artifact: string()
        .when("group", {
          is: (group: string) => group?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("version", {
          is: (version: string) => version?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      version: string()
        .when("group", {
          is: (group: string) => group?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("artifact", {
          is: (artifact: string) => artifact?.length > 0,
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
    },
    [
      ["version", "group"],
      ["version", "artifact"],
      ["artifact", "group"],
      ["artifact", "version"],
      ["group", "artifact"],
      ["group", "version"],
    ]
  );

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: application?.name || "",
      description: application?.description || "",
      id: application?.id || 0,
      comments: application?.comments || "",
      businessServiceName: application?.businessService?.name || "",
      tags: manualTags.map((tag) => tag.name) || [],
      owner: application?.owner?.name || undefined,
      contributors:
        application?.contributors?.map((contributor) => contributor.name) || [],
      kind: application?.repository?.kind || "git",
      sourceRepository: application?.repository?.url || "",
      branch: application?.repository?.branch || "",
      rootPath: application?.repository?.path || "",
      group: getBinaryInitialValue(application, "group"),
      artifact: getBinaryInitialValue(application, "artifact"),
      version: getBinaryInitialValue(application, "version"),
      packaging: getBinaryInitialValue(application, "packaging"),
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onSubmit = (formValues: FormValues) => {
    // Note: We need to manually retain the tags with source != "" in the payload
    const tags = [...(tagsToRefs(formValues.tags) ?? []), ...nonManualTags];

    const payload: Application = {
      id: formValues.id,
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      comments: formValues.comments.trim(),

      businessService: businessServiceToRef(formValues.businessServiceName),
      tags,
      owner: stakeholderToRef(formValues.owner),
      contributors: stakeholdersToRefs(formValues.contributors),

      repository: formValues.sourceRepository
        ? {
            kind: formValues.kind.trim(),
            url: formValues.sourceRepository.trim(),
            branch: formValues.branch.trim(),
            path: formValues.rootPath.trim(),
          }
        : undefined,
      binary: formValues.packaging
        ? `${formValues.group}:${formValues.artifact}:${formValues.version}:${formValues.packaging}`
        : `${formValues.group}:${formValues.artifact}:${formValues.version}`,

      // Values not editable on the form but still need to be passed through
      identities: application?.identities ?? undefined,
      migrationWave: application?.migrationWave ?? null,
    };

    if (application) {
      updateApplication({ ...payload });
    } else {
      createApplication(payload);
    }
  };

  const [isBasicExpanded, setBasicExpanded] = React.useState(true);
  const [isSourceCodeExpanded, setSourceCodeExpanded] = React.useState(false);
  const [isBinaryExpanded, setBinaryExpanded] = React.useState(false);

  const kindOptions = [
    {
      value: "git",
      toString: () => `Git`,
    },
    {
      value: "subversion",
      toString: () => `Subversion`,
    },
  ];

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <ExpandableSection
        toggleText={"Basic information"}
        className="toggle"
        onToggle={() => setBasicExpanded(!isBasicExpanded)}
        isExpanded={isBasicExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFTextInput
            control={control}
            name="name"
            label="Name"
            fieldId="name"
            isRequired
          />
          <HookFormPFTextInput
            control={control}
            name="description"
            label="Description"
            fieldId="description"
          />
          <HookFormPFGroupController
            control={control}
            name="businessServiceName"
            label={t("terms.businessService")}
            fieldId="businessService"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.businessService").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="business-service-toggle"
                id="business-service-select"
                toggleAriaLabel="Business service select dropdown toggle"
                aria-label={name}
                value={
                  value
                    ? toOptionLike(value, businessServiceOptions)
                    : undefined
                }
                options={businessServiceOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
                onClear={() => onChange("")}
              />
            )}
          />

          <ItemsSelect<Tag, FormValues>
            items={allowedManualTags}
            control={control}
            name="tags"
            label={t("terms.manualTags")}
            fieldId="tags"
            noResultsMessage={t("message.noResultsFoundTitle")}
            placeholderText={t("composed.selectMany", {
              what: t("terms.tags").toLowerCase(),
            })}
            searchInputAriaLabel="tags-select-toggle"
          />

          <HookFormPFGroupController
            control={control}
            name="owner"
            label={t("terms.owner")}
            fieldId="owner"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectAn", {
                  what: t("terms.owner").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="owner-toggle"
                id="owner-select"
                toggleAriaLabel="Owner select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, stakeholdersOptions) : undefined
                }
                options={stakeholdersOptions}
                onClear={() => onChange("")}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
                onBlur={onChange}
              />
            )}
          />
          <HookFormPFGroupController
            control={control}
            name="contributors"
            label={t("terms.contributors")}
            fieldId="contributors"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.contributors").toLowerCase(),
                })}
                id="contributors-select"
                variant="typeaheadmulti"
                toggleId="contributors-select-toggle"
                toggleAriaLabel="contributors dropdown toggle"
                aria-label={name}
                value={value
                  .map(
                    (formContributor) =>
                      stakeholders?.find(
                        (stakeholder) => stakeholder.name === formContributor
                      )
                  )
                  .map((matchingStakeholder) =>
                    matchingStakeholder
                      ? {
                          value: matchingStakeholder.name,
                          toString: () => matchingStakeholder.name,
                        }
                      : undefined
                  )
                  .filter((e) => e !== undefined)}
                options={stakeholdersOptions}
                onChange={(selection) => {
                  const selectionWithValue =
                    selection as OptionWithValue<string>;

                  const currentValue = value || [];
                  const e = currentValue.find(
                    (f) => f === selectionWithValue.value
                  );
                  if (e) {
                    onChange(
                      currentValue.filter((f) => f !== selectionWithValue.value)
                    );
                  } else {
                    onChange([...currentValue, selectionWithValue.value]);
                  }
                }}
                onClear={() => onChange([])}
                noResultsFoundText={t("message.noResultsFoundTitle")}
              />
            )}
          />
          <HookFormPFTextArea
            control={control}
            name="comments"
            label={t("terms.comments")}
            fieldId="comments"
            resizeOrientation="vertical"
          />
        </div>
      </ExpandableSection>
      <ExpandableSection
        toggleText={t("terms.sourceCode")}
        className="toggle"
        onToggle={() => setSourceCodeExpanded(!isSourceCodeExpanded)}
        isExpanded={isSourceCodeExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFGroupController
            control={control}
            name="kind"
            label="Repository type"
            fieldId="repository-type-select"
            isRequired
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                toggleId="repo-type-toggle"
                toggleAriaLabel="Type select dropdown toggle"
                aria-label={name}
                value={value ? toOptionLike(value, kindOptions) : undefined}
                options={kindOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="sourceRepository"
            label={t("terms.sourceRepo")}
            fieldId="sourceRepository"
          />
          <HookFormPFTextInput
            control={control}
            type="text"
            aria-label="Repository branch"
            name="branch"
            label={t("terms.sourceBranch")}
            fieldId="branch"
          />
          <HookFormPFTextInput
            control={control}
            name="rootPath"
            label={t("terms.sourceRootPath")}
            fieldId="rootPath"
          />
        </div>
      </ExpandableSection>
      <ExpandableSection
        toggleText={t("terms.binary")}
        className="toggle"
        onToggle={() => setBinaryExpanded(!isBinaryExpanded)}
        isExpanded={isBinaryExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFTextInput
            control={control}
            name="group"
            label={t("terms.binaryGroup")}
            fieldId="group"
          />
          <HookFormPFTextInput
            control={control}
            name="artifact"
            label={t("terms.binaryArtifact")}
            fieldId="artifact"
          />
          <HookFormPFTextInput
            control={control}
            name="version"
            label={t("terms.binaryVersion")}
            fieldId="version"
          />
          <HookFormPFTextInput
            control={control}
            name="packaging"
            fieldId="packaging"
            label={t("terms.binaryPackaging")}
            labelIcon={
              <Popover
                position={PopoverPosition.top}
                aria-label="binary packaging details"
                bodyContent={t("message.binaryPackaging")}
                className="popover"
              >
                <span className="pf-v5-c-icon pf-m-info">
                  <QuestionCircleIcon />
                </span>
              </Popover>
            }
          />
        </div>
      </ExpandableSection>
      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!application ? t("actions.create") : t("actions.save")}
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

const useApplicationFormData = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { tagCategories } = useFetchTagCategories();
  const tags = useMemo(
    () => tagCategories.flatMap((tc) => tc.tags).filter(Boolean),
    [tagCategories]
  );

  const { businessServices } = useFetchBusinessServices();
  const { stakeholders } = useFetchStakeholders();
  const { data: existingApplications } = useFetchApplications();

  // Helpers
  const tagsToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(tags, (i) => i.name, names);

  const businessServiceToRef = (name: string | undefined | null) =>
    matchItemsToRef(businessServices, (i) => i.name, name);

  const stakeholderToRef = (name: string | undefined | null) =>
    matchItemsToRef(stakeholders, (i) => i.name, name);

  const stakeholdersToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholders, (i) => i.name, names);

  // Mutation notification handlers
  const onCreateApplicationSuccess = (data: Application) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.application"),
        what: data.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateApplicationSuccess = (payload: Application) => {
    pushNotification({
      title: t("toastr.success.saveWhat", {
        type: t("terms.application"),
        what: payload.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onCreateUpdateApplicationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail();
  };

  // Mutations
  const { mutate: createApplication } = useCreateApplicationMutation(
    onCreateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  const { mutate: updateApplication } = useUpdateApplicationMutation(
    onUpdateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  // Send back source data and action that are needed by the ApplicationForm
  return {
    businessServices,
    businessServiceToRef,
    stakeholders,
    stakeholderToRef,
    stakeholdersToRefs,
    existingApplications,
    tagCategories,
    tags,
    tagsToRefs,
    createApplication,
    updateApplication,
  };
};
