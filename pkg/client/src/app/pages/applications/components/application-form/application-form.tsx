import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  ExpandableSection,
  Form,
  FormGroup,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import {
  SingleSelectFetchOptionValueFormikField,
  MultiSelectFetchOptionValueFormikField,
} from "@app/shared/components";
import { useFetchBusinessServices, useFetchTagTypes } from "@app/shared/hooks";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Application, Ref, Tag } from "@app/api/models";
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
} from "@app/utils/model-utils";

import "./application-form.css";
import {
  ApplicationsQueryKey,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
} from "@app/queries/applications";
import { useQueryClient } from "react-query";
export interface FormValues {
  name: string;
  description: string;
  comments: string;
  businessService: IBusinessServiceDropdown | null;
  tags: ITagDropdown[];
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
    fetchBusinessServices,
  } = useFetchBusinessServices();

  useEffect(() => {
    fetchBusinessServices();
  }, [fetchBusinessServices]);

  // TagTypes

  const {
    tagTypes,
    isFetching: isFetchingTagTypes,
    fetchError: fetchErrorTagTypes,
    fetchTagTypes,
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
  }, [tagTypes]);

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
        break;
      case "artifact":
        return fieldList[1] || "";
        break;
      case "version":
        return fieldList[2] || "";
        break;
      case "packaging":
        return fieldList[3] || "";
        break;
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
    sourceRepository: application?.repository?.url || "",
    branch: application?.repository?.branch || "",
    rootPath: application?.repository?.path || "",
    group: getBinaryInitialValue(application, "group"),
    artifact: getBinaryInitialValue(application, "artifact"),
    version: getBinaryInitialValue(application, "version"),
    packaging: getBinaryInitialValue(application, "packaging"),
  };
  const queryClient = useQueryClient();
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
          (value) => {
            const applications: Application[] =
              queryClient.getQueryData(ApplicationsQueryKey) || [];
            return duplicateNameCheck(
              applications,
              application || null,
              value || ""
            );
          }
        ),
      description: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      businessService: object().shape({
        id: string()
          .trim()
          .required()
          .max(250, t("validation.maxLength", { length: 250 })),
        value: string()
          .trim()
          .max(250, t("validation.maxLength", { length: 250 })),
      }),
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
            schema.url().required("Please enter repository url"),
          otherwise: (schema) => schema.url(),
        })
        .when("rootPath", {
          is: (rootPath: any) => rootPath?.length > 0,
          then: (schema) =>
            schema.url().required("Please enter repository url"),
          otherwise: (schema) => schema.url(),
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
      businessService: formValues.businessService
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
            isRequired={true}
            validated={getValidatedFromError(formik.errors.businessService)}
            helperTextInvalid={
              formik.errors.businessService && "This field is required"
            }
          >
            <SingleSelectFetchOptionValueFormikField<IBusinessServiceDropdown>
              fieldConfig={{
                name: "businessService",
              }}
              selectConfig={{
                variant: "typeahead",
                "aria-label": "business-service",
                "aria-describedby": "business-service",
                typeAheadAriaLabel: "business-service",
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
              options={(businessServices || []).map(toIBusinessServiceDropdown)}
              toOptionWithValue={toIBusinessServiceDropdownOptionWithValue}
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
        </ExpandableSection>
        <ExpandableSection
          toggleText={t("terms.sourceCode")}
          className="toggle"
          onToggle={() => setSourceCodeExpanded(!isSourceCodeExpanded)}
          isExpanded={isSourceCodeExpanded}
        >
          <FormGroup
            label={t("terms.sourceRepo")}
            fieldId="sourceRepository"
            validated={getValidatedFromError(formik.errors.sourceRepository)}
            helperTextInvalid={"Must be a valid URL."}
          >
            <TextInput
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
        </ExpandableSection>
        <ExpandableSection
          toggleText={t("terms.binary")}
          className="toggle"
          onToggle={() => setBinaryExpanded(!isBinaryExpanded)}
          isExpanded={isBinaryExpanded}
        >
          <FormGroup
            label={t("terms.binaryGroup")}
            fieldId="group"
            validated={getValidatedFromError(formik.errors.group)}
            helperTextInvalid={formik.errors.group}
          >
            <TextInput
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
            label={t("terms.binaryPackaging")}
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
