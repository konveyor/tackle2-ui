import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string, mixed } from "yup";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";

import { SingleSelectFetchOptionValueFormikField } from "@app/shared/components";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createTag, updateTag } from "@app/api/rest";
import { Tag, TagType } from "@app/api/models";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import {
  ITagTypeDropdown,
  toITagTypeDropdown,
  toITagTypeDropdownOptionWithValue,
} from "@app/utils/model-utils";
import { useFetchTags, useFetchTagTypes } from "@app/queries/tags";

export interface FormValues {
  name: string;
  tagType: ITagTypeDropdown | null;
}

export interface TagFormProps {
  tag?: Tag;
  onSaved: (response: AxiosResponse<Tag>) => void;
  onCancel: () => void;
}

export const TagForm: React.FC<TagFormProps> = ({ tag, onSaved, onCancel }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<AxiosError>();

  const { tags } = useFetchTags();

  const {
    tagTypes,
    isFetching: isFetchingTagTypes,
    fetchError: fetchErrorTagTypes,
  } = useFetchTagTypes();

  const tagTypeInitialValue: ITagTypeDropdown | null = useMemo(() => {
    const matchingTagType = tagTypes
      .filter((tagType) => tagType.tags)
      .find((tagType) => {
        const tagValues = Object.values(tagType.tags || []);
        return tagValues.some((tagVal) => tagVal.name === tag?.name);
      });
    return matchingTagType ? toITagTypeDropdown(matchingTagType) : null;
  }, [tag, tagTypes]);

  const initialValues: FormValues = {
    name: tag?.name || "",
    tagType: tagTypeInitialValue,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An tag with this name already exists. Please use a different name.",
        (value) => duplicateNameCheck(tags, tag || null, value || "")
      ),
    tagType: mixed().required(t("validation.required")),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Tag = {
      name: formValues.name.trim(),
      tagType: formValues.tagType as TagType,
    };

    let promise: AxiosPromise<Tag>;
    if (tag) {
      promise = updateTag({
        ...tag,
        ...payload,
      });
    } else {
      promise = createTag(payload);
    }

    promise
      .then((response) => {
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setError(error);
      });
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

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
        )}
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
            autoComplete="off"
          />
        </FormGroup>
        <FormGroup
          label={t("terms.tagType")}
          fieldId="tagType"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.tagType)}
          helperTextInvalid={formik.errors.tagType}
        >
          <SingleSelectFetchOptionValueFormikField<ITagTypeDropdown>
            fieldConfig={{ name: "tagType" }}
            selectConfig={{
              variant: "single",
              toggleId: "tag-type-toggle",
              "aria-label": "Tag type",
              "aria-describedby": "tag-type",
              typeAheadAriaLabel: "tag-type",
              toggleAriaLabel: "Options menu",
              clearSelectionsAriaLabel: "tag-type",
              removeSelectionAriaLabel: "tag-type",
              placeholderText: t("composed.selectOne", {
                what: t("terms.tagType").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              fetchError: fetchErrorTagTypes,
              isFetching: isFetchingTagTypes,
            }}
            options={(tagTypes || []).map(toITagTypeDropdown)}
            toOptionWithValue={toITagTypeDropdownOptionWithValue}
          />
        </FormGroup>

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
            {!tag ? t("actions.create") : t("actions.save")}
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
