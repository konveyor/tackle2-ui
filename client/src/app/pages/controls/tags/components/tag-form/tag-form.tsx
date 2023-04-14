import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { object, string, mixed } from "yup";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createTag, updateTag } from "@app/api/rest";
import { Tag, TagCategory } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { ITagCategoryDropdown } from "@app/utils/model-utils";
import { useFetchTags, useFetchTagCategories } from "@app/queries/tags";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import {
  OptionWithValue,
  SimpleSelect,
} from "@app/shared/components/simple-select";

export interface FormValues {
  name: string;
  tagCategory: string;
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

  const { tagCategories } = useFetchTagCategories();

  const tagCategoryOptions = tagCategories.map((tagCategory) => {
    return {
      value: tagCategory.name,
      toString: () => tagCategory.name,
    };
  });

  const tagCategoryInitialValue: ITagCategoryDropdown | null = useMemo(() => {
    const matchingTagCategory = tagCategories
      .filter((tagCategory) => tagCategory.tags)
      .find((tagCategory) => {
        const tagValues = Object.values(tagCategory.tags || []);
        return tagValues.some((tagVal) => tagVal.name === tag?.name);
      });
    return matchingTagCategory ? matchingTagCategory : null;
  }, [tag, tagCategories]);

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
  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: tag?.name || "",
      tagCategory: tagCategoryInitialValue?.name,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = (formValues: FormValues) => {
    const matchingTagCategoryRef = tagCategories.find(
      (tagCategory) => tagCategory.name === formValues.tagCategory
    );
    const payload: Tag = {
      name: formValues.name.trim(),
      category: matchingTagCategoryRef,
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
        onSaved(response);
      })
      .catch((error) => {
        setError(error);
      });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert variant="danger" isInline title={getAxiosErrorMessage(error)} />
      )}
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId=""
        isRequired
      />
      <HookFormPFGroupController
        control={control}
        name="tagCategory"
        label={t("terms.tagCategory")}
        fieldId="tagCategory"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="single"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            id="tag-type-select"
            toggleId="tag-type-select-toggle"
            toggleAriaLabel="Tag Type select dropdown toggle"
            aria-label={name}
            value={value}
            options={tagCategoryOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          id="tag-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!tag ? t("actions.create") : t("actions.save")}
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
