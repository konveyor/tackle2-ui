import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { object, string } from "yup";
import {
  ExpandableSection,
  Form,
  Popover,
  PopoverPosition,
} from "@patternfly/react-core";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { SimpleSelect, OptionWithValue } from "@app/components/SimpleSelect";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Application, New, TagRef } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
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
import { type TagItemType, useFetchTagsWithTagItems } from "@app/queries/tags";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
  HookFormAutocomplete,
} from "@app/components/HookFormPFFields";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useFetchPlatformById,
  useFetchPlatforms,
} from "@app/queries/platforms";

export interface FormValues {
  id: number;
  name: string;
  description: string;
  comments: string;
  businessServiceName: string;
  tags: TagItemType[];
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
  sourcePlatform: string;
}

export interface ApplicationFormProps {
  application: Application | null;
  onClose: () => void;
}

export const useApplicationFormHook = ({
  application,
  onClose,
}: ApplicationFormProps) => {
  const { t } = useTranslation();
  const {
    existingApplications,
    businessServices,
    businessServiceToRef,
    stakeholders,
    stakeholderToRef,
    stakeholdersToRefs,
    tagItems,
    idsToTagRefs,
    createApplication,
    updateApplication,
    sourcePlatforms,
    sourcePlatformToRef,
  } = useApplicationFormData({
    onActionSuccess: onClose,
  });

  const { platform } = useFetchPlatformById(application?.platform?.id);

  const businessServiceOptions = businessServices.map((businessService) => {
    return {
      value: businessService.name,
      toString: () => businessService.name,
    };
  });

  const sourcePlatformOptions = sourcePlatforms.map((sourcePlatform) => {
    return {
      value: sourcePlatform.name,
      toString: () => sourcePlatform.name,
    };
  });

  const stakeholdersOptions = stakeholders.map((stakeholder) => {
    return {
      value: stakeholder.name,
      toString: () => stakeholder.name,
    };
  });

  const manualTagRefs: TagRef[] = useMemo(() => {
    return application?.tags?.filter((t) => !t?.source) ?? [];
  }, [application?.tags]);

  const nonManualTagRefs = useMemo(() => {
    return application?.tags?.filter((t) => t?.source ?? "" !== "") ?? [];
  }, [application?.tags]);

  const getBinaryInitialValue = (
    application: Application | null,
    fieldName: string
  ) => {
    const binaryString = application?.binary?.startsWith("mvn://")
      ? application.binary.substring(6)
      : application?.binary;

    const fieldList = binaryString?.split(":") || [];

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

      // source code fields
      kind: string().oneOf(["", "git", "subversion"]),
      sourceRepository: string().when("kind", {
        is: (kind: string) => kind !== "",
        then: (schema) => schema.repositoryUrl("kind").required(),
      }),
      branch: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      rootPath: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),

      // binary fields
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
    trigger,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: application?.name || "",
      description: application?.description || "",
      id: application?.id || 0,
      comments: application?.comments || "",
      businessServiceName: application?.businessService?.name || "",

      tags: manualTagRefs
        .map(({ id }) => tagItems.find((tag) => tag.id === id))
        .filter(Boolean),

      owner: application?.owner?.name || undefined,
      contributors:
        application?.contributors?.map((contributor) => contributor.name) || [],

      kind: application?.repository?.kind || "",
      sourceRepository: application?.repository?.url || "",
      branch: application?.repository?.branch || "",
      rootPath: application?.repository?.path || "",
      group: getBinaryInitialValue(application, "group"),
      artifact: getBinaryInitialValue(application, "artifact"),
      version: getBinaryInitialValue(application, "version"),
      packaging: getBinaryInitialValue(application, "packaging"),
      sourcePlatform: platform?.name || "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (formValues: FormValues) => {
    const binaryValues = [
      formValues.group,
      formValues.artifact,
      formValues.version,
      formValues.packaging,
    ].filter(Boolean);

    const payload: New<Application> = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      comments: formValues.comments.trim(),

      businessService: businessServiceToRef(formValues.businessServiceName),

      // Note: We need to manually retain the non-manual tags in the payload
      tags: [
        ...(idsToTagRefs(formValues.tags.map((t) => t.id)) ?? []),
        ...nonManualTagRefs,
      ],

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
      binary:
        binaryValues.length > 0 ? `mvn://${binaryValues.join(":")}` : undefined,

      // Values not editable on the form but still need to be passed through
      identities: application?.identities ?? undefined,
      migrationWave: application?.migrationWave ?? null,
      platform: sourcePlatformToRef(formValues.sourcePlatform),
    };

    if (application) {
      updateApplication({ id: application.id, ...payload });
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

  return {
    handleSubmit,
    onValidSubmit,
    setBasicExpanded,
    isBasicExpanded,
    trigger,
    control,
    tagItems,
    stakeholdersOptions,
    setSourceCodeExpanded,
    isSourceCodeExpanded,
    kindOptions,
    setBinaryExpanded,
    isBinaryExpanded,
    isSubmitDisabled: !isValid || isSubmitting || isValidating || !isDirty,
    isCancelDisabled: isSubmitting || isValidating,
    stakeholders,
    businessServiceOptions,
    sourcePlatformOptions,
    onSubmit: handleSubmit(onValidSubmit),
  };
};

export const ApplicationForm: React.FC<
  ReturnType<typeof useApplicationFormHook>
> = ({
  setBasicExpanded,
  isBasicExpanded,
  trigger,
  control,
  tagItems,
  stakeholdersOptions,
  setSourceCodeExpanded,
  isSourceCodeExpanded,
  kindOptions,
  setBinaryExpanded,
  isBinaryExpanded,
  stakeholders,
  businessServiceOptions,
  sourcePlatformOptions,
}) => {
  const { t } = useTranslation();
  const watchKind = useWatch({ control, name: "kind" });

  return (
    <Form>
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

          <HookFormAutocomplete<FormValues>
            items={tagItems}
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
                  console.log({ selection });
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
                  .map((formContributor) =>
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
          <HookFormPFGroupController
            control={control}
            name="sourcePlatform"
            label={t("terms.sourcePlatform")}
            fieldId="sourcePlatform"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.sourcePlatform").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="source-platform-toggle"
                id="source-platform-select"
                toggleAriaLabel="Source platform select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, sourcePlatformOptions) : undefined
                }
                options={sourcePlatformOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
                onClear={() => onChange("")}
              />
            )}
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
                  trigger("sourceRepository");
                }}
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="sourceRepository"
            label={t("terms.sourceRepo")}
            fieldId="sourceRepository"
            aria-label="source repository url"
            isRequired={kindOptions.some(({ value }) => value === watchKind)}
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
  const { tags, tagItems } = useFetchTagsWithTagItems();
  const { businessServices } = useFetchBusinessServices();
  const { stakeholders } = useFetchStakeholders();
  const { data: existingApplications } = useFetchApplications();
  const { platforms: sourcePlatforms } = useFetchPlatforms();

  // Helpers
  const idsToTagRefs = (ids: number[] | undefined | null) =>
    matchItemsToRefs(tags, (i) => i.id, ids);

  const businessServiceToRef = (name: string | undefined | null) =>
    matchItemsToRef(businessServices, (i) => i.name, name);

  const sourcePlatformToRef = (name: string | undefined | null) =>
    matchItemsToRef(sourcePlatforms, (i) => i.name, name);

  const stakeholderToRef = (name: string | undefined | null) =>
    matchItemsToRef(stakeholders, (i) => i.name, name);

  const stakeholdersToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholders, (i) => i.name, names);

  // Mutation notification handlers
  const onCreateApplicationSuccess = (application: Application) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.application"),
        what: application.name,
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
    tags,
    tagItems,
    idsToTagRefs,
    createApplication,
    updateApplication,
    sourcePlatforms,
    sourcePlatformToRef,
  };
};
