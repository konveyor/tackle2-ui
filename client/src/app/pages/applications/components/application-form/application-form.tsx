import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import { object, string, StringSchema } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  ExpandableSection,
  Form,
  Popover,
  PopoverPosition,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { SimpleSelect, OptionWithValue } from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Application, TagRef } from "@app/api/models";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  standardURLRegex,
} from "@app/utils/utils";
import { toOptionLike } from "@app/utils/model-utils";
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
} from "@app/shared/components/hook-form-pf-fields";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import { useFetchStakeholders } from "@app/queries/stakeholders";

export interface FormValues {
  name: string;
  description: string;
  comments: string;
  businessServiceName: string;
  tags: TagRef[];
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
  id: number;
}

export interface ApplicationFormProps {
  application?: Application;
  onSaved: (response: AxiosResponse<Application>) => void;
  onCancel: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  application,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [axiosError, setAxiosError] = useState<AxiosError>();

  const { businessServices } = useFetchBusinessServices();
  const { stakeholders } = useFetchStakeholders();

  const { tagCategories: tagCategories, refetch: fetchTagCategories } =
    useFetchTagCategories();

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

  useEffect(() => {
    fetchTagCategories();
  }, [fetchTagCategories]);

  // Tags

  const [tags, setTags] = useState<TagRef[]>();

  useEffect(() => {
    if (tagCategories) {
      setTags(tagCategories.flatMap((f) => f.tags || []));
    }
  }, []);

  const tagOptions =
    tags?.map((tag) => {
      return {
        value: tag.name,
        toString: () => tag.name,
      };
    }) || [];

  const getBinaryInitialValue = (
    application: Application | undefined,
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

  const customURLValidation = (schema: StringSchema) => {
    const gitUrlRegex =
      /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
    return schema.matches(
      gitUrlRegex || standardURLRegex,
      "Must be a valid URL."
    );
  };

  const { data: applications } = useFetchApplications();

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
              applications ? applications : [],
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
          is: (branch: any) => branch?.length > 0,
          then: (schema) =>
            customURLValidation(schema).required("Enter repository url."),
          otherwise: (schema) => customURLValidation(schema),
        })
        .when("rootPath", {
          is: (rootPath: any) => rootPath?.length > 0,
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
      tags: application?.tags || [],
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
    mode: "onChange",
  });

  const buildBinaryFieldString = (
    group: string,
    artifact: string,
    version: string,
    packaging: string
  ) => {
    if (packaging) {
      return `${group}:${artifact}:${version}:${packaging}`;
    } else {
      return `${group}:${artifact}:${version}`;
    }
  };

  const onCreateUpdateApplicationSuccess = (response: any) => {
    onSaved(response);
  };

  const onCreateUpdateApplicationError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: createApplication } = useCreateApplicationMutation(
    onCreateUpdateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  const { mutate: updateApplication } = useUpdateApplicationMutation(
    onCreateUpdateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  const onSubmit = (formValues: FormValues) => {
    const matchingBusinessService = businessServices.find(
      (businessService) =>
        formValues?.businessServiceName === businessService.name
    );

    const matchingOwner = stakeholders.find(
      (stakeholder) => formValues?.owner === stakeholder.name
    );

    const matchingContributors = stakeholders?.filter((stakeholder) =>
      formValues.contributors.includes(stakeholder.name)
    );

    const payload: Application = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      comments: formValues.comments.trim(),
      businessService: matchingBusinessService
        ? {
            id: matchingBusinessService.id,
            name: matchingBusinessService.name,
          }
        : undefined,
      tags: formValues.tags,
      owner: matchingOwner
        ? { id: matchingOwner.id, name: matchingOwner.name }
        : undefined,
      contributors: matchingContributors,
      ...(formValues.sourceRepository
        ? {
            repository: {
              kind: formValues.kind.trim(),
              url: formValues.sourceRepository
                ? formValues.sourceRepository.trim()
                : undefined,
              branch: formValues.branch.trim(),
              path: formValues.rootPath.trim(),
            },
          }
        : { repository: undefined }),
      binary: buildBinaryFieldString(
        formValues.group,
        formValues.artifact,
        formValues.version,
        formValues.packaging
      ),
      review: undefined, // The review should not updated through this form
      id: formValues.id,
    };

    if (application) {
      updateApplication(payload);
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

  const getTagRef = (tagName: string) =>
    tags?.find((tag) => tag.name === tagName);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {axiosError && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(axiosError)}
        />
      )}
      <ExpandableSection
        toggleText={"Basic information"}
        className="toggle"
        onToggle={() => setBasicExpanded(!isBasicExpanded)}
        isExpanded={isBasicExpanded}
      >
        <div className="pf-c-form">
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
                onClear={() => onChange([])}
              />
            )}
          />

          <HookFormPFGroupController
            control={control}
            name="tags"
            label={t("terms.tags")}
            fieldId="tags"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.tags").toLowerCase(),
                })}
                id="tags-select"
                variant="typeaheadmulti"
                toggleId="tags-select-toggle"
                toggleAriaLabel="tags dropdown toggle"
                aria-label={name}
                value={value
                  .map((formTag) =>
                    tags?.find((tagRef) => tagRef.name === formTag.name)
                  )
                  .map((matchingTag) =>
                    matchingTag
                      ? {
                          value: matchingTag.name,
                          toString: () => matchingTag.name,
                        }
                      : undefined
                  )
                  .filter((e) => e !== undefined)}
                options={tagOptions}
                onChange={(selection) => {
                  const selectionWithValue =
                    selection as OptionWithValue<string>;

                  const currentValue = value || [];
                  const e = currentValue.find(
                    (f) => f.name === selectionWithValue.value
                  );
                  if (e) {
                    onChange(
                      currentValue.filter(
                        (f) => f.name !== selectionWithValue.value
                      )
                    );
                  } else {
                    onChange([
                      ...currentValue,
                      getTagRef(selectionWithValue.value),
                    ]);
                  }
                }}
                onClear={() => onChange([])}
                noResultsFoundText={t("message.noResultsFoundTitle")}
              />
            )}
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
                onClear={() => onChange([])}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
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
        </div>
      </ExpandableSection>
      <ExpandableSection
        toggleText={t("terms.sourceCode")}
        className="toggle"
        onToggle={() => setSourceCodeExpanded(!isSourceCodeExpanded)}
        isExpanded={isSourceCodeExpanded}
      >
        <div className="pf-c-form">
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
        <div className="pf-c-form">
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
                <span className="pf-c-icon pf-m-info">
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
          id="application-form-submit"
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
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
