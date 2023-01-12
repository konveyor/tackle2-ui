import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string, StringSchema } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  ExpandableSection,
  Form,
  FormGroup,
  Popover,
  PopoverPosition,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import QuestionCircleIcon from "@patternfly/react-icons/dist/js/icons/question-circle-icon";

import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  SingleSelectFetchOptionValueFormikField,
  MultiSelectFetchOptionValueFormikField,
  SimpleSelect,
  OptionWithValue,
} from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Application, Ref } from "@app/api/models";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import {
  IBusinessServiceDropdown,
  isIModelEqual,
  ITagDropdown,
  toIBusinessServiceDropdown,
  toIBusinessServiceDropdownOptionWithValue,
  toITagDropdown,
  toITagDropdownOptionWithValue,
  toOptionLike,
} from "@app/utils/model-utils";
import {
  useCreateApplicationMutation,
  useFetchApplications,
  useUpdateApplicationMutation,
} from "@app/queries/applications";
import "./application-form.css";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTagTypes } from "@app/queries/tags";
export interface FormValues {
  name: string;
  description: string;
  comments: string;
  businessService: IBusinessServiceDropdown | null;
  tags: ITagDropdown[];
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

  // Business services

  const {
    businessServices,
    isFetching: isFetchingBusinessServices,
    fetchError: fetchErrorBusinessServices,
  } = useFetchBusinessServices();

  // TagTypes

  const {
    tagTypes,
    isFetching: isFetchingTagTypes,
    fetchError: fetchErrorTagTypes,
    refetch: fetchTagTypes,
  } = useFetchTagTypes();

  useEffect(() => {
    fetchTagTypes();
  }, [fetchTagTypes]);

  // Tags

  const [tags, setTags] = useState<Ref[]>();

  useEffect(() => {
    if (tagTypes) {
      setTags(tagTypes.flatMap((f) => f.tags || []));
    }
  }, []);

  // Formik

  const businessServiceInitialValue = useMemo(() => {
    let result: IBusinessServiceDropdown | null = null;
    if (application && application.businessService && businessServices) {
      const businessServiceId = Number(application.businessService.id);
      const businessService = businessServices.find(
        (f) => f.id === businessServiceId
      );

      if (businessService) {
        result = toIBusinessServiceDropdown({
          id: businessServiceId,
          name: businessService.name,
        });
      }
    }

    return result;
  }, [application, businessServices]);

  const tagsInitialValue = useMemo(() => {
    let result: ITagDropdown[] = [];

    if (application && application.tags && tags) {
      result = application.tags.reduce((prev, current) => {
        const exists = tags.find((f) => f.id === current.id);
        return exists ? [...prev, toITagDropdown(exists)] : prev;
      }, [] as ITagDropdown[]);
    }

    return result;
  }, [application, tags]);
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

  const initialValues: FormValues = {
    name: application?.name || "",
    description: application?.description || "",
    id: application?.id || 0,
    comments: application?.comments || "",
    businessService: businessServiceInitialValue,
    tags: tagsInitialValue,
    kind: application?.repository?.kind || "git",
    sourceRepository: application?.repository?.url || "",
    branch: application?.repository?.branch || "",
    rootPath: application?.repository?.path || "",
    group: getBinaryInitialValue(application, "group"),
    artifact: getBinaryInitialValue(application, "artifact"),
    version: getBinaryInitialValue(application, "version"),
    packaging: getBinaryInitialValue(application, "packaging"),
  };

  const customURLValidation = (schema: StringSchema) => {
    const gitUrlRegex =
      /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
    let standardUrlRegex =
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    standardUrlRegex = new RegExp(standardUrlRegex);
    const containsURL = (string: string) =>
      gitUrlRegex.test(string) || standardUrlRegex.test(string);

    return schema.test("gitUrlTest", "Must be a valid URL.", (value) => {
      if (value) {
        return containsURL(value);
      } else {
        return true;
      }
    });
  };

  const { applications } = useFetchApplications();

  const validationSchema = object().shape(
    {
      name: string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 }))
        .test(
          "Duplicate name",
          "An application with this name already exists. Please use a different name.",
          (value) =>
            duplicateNameCheck(applications, application || null, value || "")
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
            customURLValidation(schema).required(
              "Please enter repository url."
            ),
          otherwise: (schema) => customURLValidation(schema),
        })
        .when("rootPath", {
          is: (rootPath: any) => rootPath?.length > 0,
          then: (schema) =>
            customURLValidation(schema).required(
              "Please enter repository url."
            ),
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

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Application = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      comments: formValues.comments.trim(),
      businessService: formValues?.businessService
        ? {
            id: formValues.businessService.id,
            name: formValues.businessService.name,
          }
        : undefined,
      tags: formValues.tags.map((f): Ref => {
        const thisTag = { id: f.id, name: f.name };
        return thisTag;
      }),
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
      updateApplication({
        ...application,
        ...payload,
      });
    } else {
      createApplication(payload);
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
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
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
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
            <FormGroup
              label={t("terms.name")}
              fieldId="name"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.name)}
              helperTextInvalid={formik.errors.name}
            >
              <TextInput
                type="text"
                name="name"
                data-testid="application-name"
                aria-label="name"
                aria-describedby="name"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                validated={getValidatedFromErrorTouched(
                  formik.errors.name,
                  formik.touched.name
                )}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.description")}
              fieldId="description"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.description)}
              helperTextInvalid={formik.errors.description}
            >
              <TextInput
                type="text"
                name="description"
                data-testid="description"
                aria-label="description"
                aria-describedby="description"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.description}
                validated={getValidatedFromErrorTouched(
                  formik.errors.description,
                  formik.touched.description
                )}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.businessService")}
              fieldId="businessService"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.businessService)}
              helperTextInvalid={formik.errors.businessService}
            >
              <SingleSelectFetchOptionValueFormikField<IBusinessServiceDropdown>
                fieldConfig={{
                  name: "businessService",
                }}
                data-testid="business-service-select"
                selectConfig={{
                  variant: "typeahead",
                  "aria-label": "Select business service",
                  "aria-describedby": "business-service-select-input",
                  typeAheadAriaLabel: "business-service-dropdown",
                  toggleAriaLabel: "business-service",
                  clearSelectionsAriaLabel: "business-service",
                  removeSelectionAriaLabel: "business-service",
                  placeholderText: t("composed.selectOne", {
                    what: t("terms.businessService").toLowerCase(),
                  }),
                  menuAppendTo: () => document.body,
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  isFetching: isFetchingBusinessServices,
                  fetchError: fetchErrorBusinessServices,
                }}
                options={(businessServices || []).map(
                  toIBusinessServiceDropdown
                )}
                toOptionWithValue={toIBusinessServiceDropdownOptionWithValue}
                isClearable={true}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.tags")}
              fieldId="tags"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.tags)}
              helperTextInvalid={formik.errors.tags}
            >
              <MultiSelectFetchOptionValueFormikField<ITagDropdown>
                fieldConfig={{
                  name: "tags",
                }}
                selectConfig={{
                  variant: "typeaheadmulti",
                  "aria-label": "tags",
                  "aria-describedby": "tags",
                  typeAheadAriaLabel: "tags",
                  toggleAriaLabel: "tags",
                  clearSelectionsAriaLabel: "tags",
                  removeSelectionAriaLabel: "tags",
                  // t("terms.tag(s)")
                  placeholderText: t("composed.selectOne", {
                    what: t("terms.tag(s)").toLowerCase(),
                  }),
                  menuAppendTo: () => document.body,
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  isFetching: isFetchingTagTypes,
                  fetchError: fetchErrorTagTypes,
                }}
                options={(tags || []).map(toITagDropdown)}
                toOptionWithValue={toITagDropdownOptionWithValue}
                isEqual={isIModelEqual}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.comments")}
              fieldId="comments"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.comments)}
              helperTextInvalid={formik.errors.comments}
            >
              <TextArea
                type="text"
                name="comments"
                aria-label="comments"
                aria-describedby="comments"
                isRequired={false}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.comments}
                validated={getValidatedFromErrorTouched(
                  formik.errors.comments,
                  formik.touched.comments
                )}
              />
            </FormGroup>
          </div>
        </ExpandableSection>
        <ExpandableSection
          data-testid="source-code-toggle"
          toggleText={t("terms.sourceCode")}
          className="toggle"
          onToggle={() => setSourceCodeExpanded(!isSourceCodeExpanded)}
          isExpanded={isSourceCodeExpanded}
        >
          <div className="pf-c-form">
            <FormGroup
              data-testid="repository-type"
              label="Repository type"
              fieldId="kind"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.kind)}
              helperTextInvalid={formik.errors.kind}
            >
              <SimpleSelect
                toggleId="repo-type-toggle"
                toggleAriaLabel="repo-type-toggle"
                aria-label={formik.values.kind}
                value={
                  formik.values.kind
                    ? toOptionLike(formik.values.kind, kindOptions)
                    : undefined
                }
                options={kindOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<any>;
                  formik.setFieldValue("kind", selectionValue.value);
                }}
              />
            </FormGroup>

            <FormGroup
              label={t("terms.sourceRepo")}
              fieldId="sourceRepository"
              validated={getValidatedFromError(formik.errors.sourceRepository)}
              helperTextInvalid={"Must be a valid URL."}
            >
              <TextInput
                data-testid="repository-url"
                type="text"
                name="sourceRepository"
                aria-label="Source Repository"
                aria-describedby="Source Repository URL"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.sourceRepository}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.sourceBranch")}
              fieldId="branch"
              validated={getValidatedFromError(formik.errors.branch)}
              helperTextInvalid={formik.errors.branch}
            >
              <TextInput
                data-testid="repository-branch"
                type="text"
                name="branch"
                aria-label="Source Repository Branch"
                aria-describedby="Source Repository Branch"
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.branch}
                validated={getValidatedFromErrorTouched(
                  formik.errors.branch,
                  formik.touched.branch
                )}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.sourceRootPath")}
              fieldId="rootPath"
              validated={getValidatedFromError(formik.errors.rootPath)}
              helperTextInvalid={formik.errors.rootPath}
            >
              <TextInput
                type="text"
                name="rootPath"
                data-testid="repository-root"
                aria-label="Source Repository Root Path"
                aria-describedby="Source Repository Root Path"
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.rootPath}
                validated={getValidatedFromErrorTouched(
                  formik.errors.rootPath,
                  formik.touched.rootPath
                )}
              />
            </FormGroup>
          </div>
        </ExpandableSection>
        <ExpandableSection
          data-testid="binary-toggle"
          toggleText={t("terms.binary")}
          className="toggle"
          onToggle={() => setBinaryExpanded(!isBinaryExpanded)}
          isExpanded={isBinaryExpanded}
        >
          <div className="pf-c-form">
            <FormGroup
              label={t("terms.binaryGroup")}
              fieldId="group"
              validated={getValidatedFromError(formik.errors.group)}
              helperTextInvalid={formik.errors.group}
            >
              <TextInput
                data-testid="binary-group"
                type="text"
                name="group"
                aria-label="Binary Group"
                aria-describedby="Binary Group"
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.group}
                validated={getValidatedFromErrorTouched(
                  formik.errors.group,
                  formik.touched.group
                )}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.binaryArtifact")}
              fieldId="artifact"
              validated={getValidatedFromError(formik.errors.artifact)}
              helperTextInvalid={formik.errors.artifact}
            >
              <TextInput
                data-testid="binary-artifact"
                type="text"
                name="artifact"
                aria-label="Binary Artifact"
                aria-describedby="Binary Artifact"
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.artifact}
                validated={getValidatedFromErrorTouched(
                  formik.errors.artifact,
                  formik.touched.artifact
                )}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.binaryVersion")}
              fieldId="version"
              validated={getValidatedFromError(formik.errors.version)}
              helperTextInvalid={formik.errors.version}
            >
              <TextInput
                data-testid="binary-version"
                type="text"
                name="version"
                aria-label="Binary version"
                aria-describedby="Binary version"
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.version}
                validated={getValidatedFromErrorTouched(
                  formik.errors.version,
                  formik.touched.version
                )}
              />
            </FormGroup>
            <FormGroup
              data-testid="binary-packaging"
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
              fieldId="packaging"
              validated={getValidatedFromError(formik.errors.packaging)}
              helperTextInvalid={formik.errors.packaging}
            >
              <TextInput
                type="text"
                name="packaging"
                aria-label="Binary Packaging"
                aria-describedby="Binary Packaging"
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.packaging}
                validated={getValidatedFromErrorTouched(
                  formik.errors.packaging,
                  formik.touched.packaging
                )}
              />
            </FormGroup>
          </div>
        </ExpandableSection>
        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {!application ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
