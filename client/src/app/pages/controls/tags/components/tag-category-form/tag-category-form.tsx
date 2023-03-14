import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string, number } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  NumberInput,
  TextInput,
} from "@patternfly/react-core";

import { SingleSelectOptionValueFormikField } from "@app/shared/components";
import {
  DEFAULT_SELECT_MAX_HEIGHT,
  DEFAULT_COLOR_PALETE as DEFAULT_COLOR_PALETTE,
} from "@app/Constants";
import { createTagCategory, updateTagCategory } from "@app/api/rest";
import { TagCategory } from "@app/api/models";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import { colorHexToOptionWithValue } from "@app/utils/model-utils";
import { useFetchTagCategories } from "@app/queries/tags";

export interface FormValues {
  name: string;
  rank?: number;
  color: string | null;
}

export interface TagCategoryFormProps {
  tagCategory?: TagCategory;
  onSaved: (response: AxiosResponse<TagCategory>) => void;
  onCancel: () => void;
}

export const TagCategoryForm: React.FC<TagCategoryFormProps> = ({
  tagCategory: tagCategory,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const { tagCategories: tagCategories } = useFetchTagCategories();

  const initialValues: FormValues = {
    name: tagCategory?.name || "",
    rank: tagCategory?.rank || 1,
    color: tagCategory?.colour || null,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(40, t("validation.maxLength", { length: 40 }))
      .test(
        "Duplicate name",
        "A tag type with this name already exists. Use a different name.",
        (value) => {
          return duplicateNameCheck(
            tagCategories || [],
            tagCategory || null,
            value || ""
          );
        }
      ),
    rank: number().min(1, t("validation.min", { value: 1 })),
    color: string()
      .trim()
      .nullable()
      .required(t("validation.required"))
      .min(1, t("validation.minLength", { length: 3 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: TagCategory = {
      name: formValues.name.trim(),
      rank: formValues.rank,
      colour: formValues.color || undefined,
    };

    let promise: AxiosPromise<TagCategory>;
    if (tagCategory) {
      promise = updateTagCategory({
        ...tagCategory,
        ...payload,
      });
    } else {
      promise = createTagCategory(payload);
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
            id="tag-type-name"
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
          label={t("terms.rank")}
          id="rank"
          fieldId="rank"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.rank)}
          helperTextInvalid={formik.errors.rank}
        >
          <NumberInput
            id="rank-input-id"
            inputName="rank"
            inputAriaLabel="rank"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            value={formik.values.rank}
            onMinus={() => {
              formik.setFieldValue("rank", (formik.values.rank || 0) - 1);
            }}
            onChange={formik.handleChange}
            onPlus={() => {
              formik.setFieldValue("rank", (formik.values.rank || 0) + 1);
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.color")}
          fieldId="color"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.color)}
          helperTextInvalid={formik.errors.color}
        >
          <SingleSelectOptionValueFormikField<string>
            fieldConfig={{ name: "color" }}
            selectConfig={{
              variant: "single",
              toggleId: "color-toggle",
              "aria-label": "color",
              "aria-describedby": "color",
              typeAheadAriaLabel: "color",
              toggleAriaLabel: "Options menu",
              clearSelectionsAriaLabel: "color",
              removeSelectionAriaLabel: "color",
              placeholderText: t("composed.selectOne", {
                what: t("terms.color").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
            }}
            options={DEFAULT_COLOR_PALETTE}
            toOptionWithValue={colorHexToOptionWithValue}
          />
        </FormGroup>

        <ActionGroup>
          <Button
            type="submit"
            id="tag-type-form-submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {!tagCategory ? t("actions.create") : t("actions.save")}
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
