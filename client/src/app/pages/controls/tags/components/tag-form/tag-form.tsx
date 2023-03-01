import React, { useMemo, useState } from "react";
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
import { Tag, TagCategory } from "@app/api/models";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import {
  ITagCategoryDropdown,
  toITagCategoryDropdown,
  toITagCategoryDropdownOptionWithValue,
} from "@app/utils/model-utils";
import { useFetchTags, useFetchTagCategories } from "@app/queries/tags";

export interface FormValues {
  name: string;
  tagCategory: ITagCategoryDropdown | null;
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
    tagCategories,
    isFetching: isFetchingTagCategories,
    fetchError: fetchErrorTagCategories,
  } = useFetchTagCategories();

  const tagCategoryInitialValue: ITagCategoryDropdown | null = useMemo(() => {
    const matchingTagCategory = tagCategories
      .filter((tagCategory) => tagCategory.tags)
      .find((tagCategory) => {
        const tagValues = Object.values(tagCategory.tags || []);
        return tagValues.some((tagVal) => tagVal.name === tag?.name);
      });
    return matchingTagCategory
      ? toITagCategoryDropdown(matchingTagCategory)
      : null;
  }, [tag, tagCategories]);

  const initialValues: FormValues = {
    name: tag?.name || "",
    tagCategory: tagCategoryInitialValue,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test("Duplicate name", t("message.duplicateTag"), (value) =>
        duplicateNameCheck(tags, tag || null, value || "")
      ),
    tagCategory: mixed().required(t("validation.required")),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Tag = {
      name: formValues.name.trim(),
      category: formValues.tagCategory as TagCategory,
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
            id="tag-name"
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
          label={t("terms.tagCategory")}
          fieldId="tagCategory"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.tagCategory)}
          helperTextInvalid={formik.errors.tagCategory}
        >
          <SingleSelectFetchOptionValueFormikField<ITagCategoryDropdown>
            fieldConfig={{ name: "tagCategory" }}
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
                what: t("terms.tagCategory").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              fetchError: fetchErrorTagCategories,
              isFetching: isFetchingTagCategories,
            }}
            options={(tagCategories || []).map(toITagCategoryDropdown)}
            toOptionWithValue={toITagCategoryDropdownOptionWithValue}
          />
        </FormGroup>

        <ActionGroup>
          <Button
            type="submit"
            id="tag-form-submit"
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
            id="cancel"
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
