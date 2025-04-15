import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { object, string } from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import {
  DEFAULT_SELECT_MAX_HEIGHT,
  COLOR_HEX_VALUES_BY_NAME,
} from "@app/Constants";
import { New, TagCategory } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import { toOptionLike } from "@app/utils/model-utils";
import {
  useCreateTagCategoryMutation,
  useFetchTagCategories,
  useUpdateTagCategoryMutation,
} from "@app/queries/tags";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { Color } from "@app/components/Color";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getTagCategoryFallbackColor } from "@app/components/labels/item-tag-label/item-tag-label";

export interface FormValues {
  name: string;
  color: string | null;
}

export interface TagCategoryFormProps {
  tagCategory?: TagCategory;
  onClose: () => void;
}

export const TagCategoryForm: React.FC<TagCategoryFormProps> = ({
  tagCategory: tagCategory,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = useContext(NotificationsContext);

  const { tagCategories: tagCategories } = useFetchTagCategories();

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
    color: string()
      .trim()
      .nullable()
      .required(t("validation.required"))
      .min(1, t("validation.minLength", { length: 3 })),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: tagCategory?.name || "",
      color: tagCategory
        ? tagCategory.colour || getTagCategoryFallbackColor(tagCategory)
        : null,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onTagSuccess = () =>
    pushNotification({
      title: t("toastr.success.create", {
        type: t("terms.tagCategory"),
      }),
      variant: "success",
    });

  const onTagError = () => {
    pushNotification({
      title: t("toastr.fail.create", {
        type: t("terms.tagCategory").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: createTagCategory } = useCreateTagCategoryMutation(
    onTagSuccess,
    onTagError
  );

  const onUpdateTagCategorySuccess = () =>
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.tagCategory"),
      }),
      variant: "success",
    });

  const onUpdateTagCategoryError = () => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.tagCategory").toLowerCase(),
      }),
      variant: "danger",
    });
  };
  const { mutate: updateTagCategory } = useUpdateTagCategoryMutation(
    onUpdateTagCategorySuccess,
    onUpdateTagCategoryError
  );

  const onSubmit = (formValues: FormValues) => {
    const payload: New<TagCategory> = {
      name: formValues.name.trim(),
      colour: formValues.color || undefined,
    };

    if (tagCategory) updateTagCategory({ id: tagCategory.id, ...payload });
    else createTagCategory(payload);
    onClose();
  };

  const colorOptions = Object.values(COLOR_HEX_VALUES_BY_NAME).map((color) => {
    return {
      value: color.toUpperCase(),
      toString: () => color,
      props: {
        children: <Color hex={color} />,
      },
    };
  });

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Name"
        fieldId="name"
        isRequired
      />
      <HookFormPFGroupController
        control={control}
        name="color"
        label={t("terms.color")}
        fieldId="color"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="single"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            placeholderText={t("composed.selectOne", {
              what: t("terms.color").toLowerCase(),
            })}
            id="type-select"
            toggleId="type-select-toggle"
            toggleAriaLabel="Type select dropdown toggle"
            aria-label={name}
            value={
              value
                ? toOptionLike(value.toUpperCase(), colorOptions)
                : undefined
            }
            options={colorOptions}
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
          {!tagCategory ? t("actions.create") : t("actions.save")}
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
