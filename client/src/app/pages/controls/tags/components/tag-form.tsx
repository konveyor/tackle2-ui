import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import { object, string, mixed } from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { New, Tag, TagCategory } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import { ITagCategoryDropdown } from "@app/utils/model-utils";
import {
  useFetchTags,
  useFetchTagCategories,
  useCreateTagMutation,
  useUpdateTagMutation,
} from "@app/queries/tags";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";

export interface FormValues {
  name: string;
  tagCategory: string;
}

export interface TagFormProps {
  tag?: Tag;
  onClose: () => void;
}

export const TagForm: React.FC<TagFormProps> = ({ tag, onClose }) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [error, setError] = useState<AxiosError>();

  const { tags } = useFetchTags();

  const { tagCategories } = useFetchTagCategories();

  const tagCategoryOptions = useMemo(() => {
    const options = tagCategories.map((tagCategory: TagCategory) => {
      return {
        value: tagCategory.name,
        toString: () => tagCategory.name,
      };
    });

    return options.sort((a, b) => a.value.localeCompare(b.value));
  }, [tagCategories]);

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
    mode: "all",
  });

  const onTagSuccess = (_: AxiosResponse<Tag>) =>
    pushNotification({
      title: t("toastr.success.create", {
        type: t("terms.tag"),
      }),
      variant: "success",
    });

  const onTagError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.create", {
        type: t("terms.tag").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: createTag } = useCreateTagMutation(onTagSuccess, onTagError);

  const onUpdateTagSuccess = (_: AxiosResponse<Tag>) =>
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.tag"),
      }),
      variant: "success",
    });

  const onUpdateTagError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.tag").toLowerCase(),
      }),
      variant: "danger",
    });
  };
  const { mutate: updateTag } = useUpdateTagMutation(
    onUpdateTagSuccess,
    onUpdateTagError
  );

  const onSubmit = (formValues: FormValues) => {
    const matchingTagCategoryRef = tagCategories.find(
      (tagCategory) => tagCategory.name === formValues.tagCategory
    );
    if (!matchingTagCategoryRef) {
      console.error("No matching category found");
      onClose();
      pushNotification({
        title: t("toastr.fail.save", {
          type: t("terms.tag").toLowerCase(),
        }),
        variant: "danger",
      });
      return;
    }

    const { id, name } = matchingTagCategoryRef;

    const payload: New<Tag> = {
      name: formValues.name.trim(),
      category: { id, name },
    };

    if (tag) updateTag({ id: tag.id, ...payload });
    else createTag(payload);
    onClose();
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
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
            placeholderText={t("composed.selectOne", {
              what: t("terms.tagCategory").toLowerCase(),
            })}
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
          id="submit"
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
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
