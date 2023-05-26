import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import { object, string } from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { New, Ref, StakeholderGroup } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import { toOptionLike } from "@app/utils/model-utils";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import {
  useCreateStakeholderGroupMutation,
  useFetchStakeholderGroups,
  useUpdateStakeholderGroupMutation,
} from "@app/queries/stakeholdergoups";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { NotificationsContext } from "@app/shared/notifications-context";

export interface FormValues {
  name: string;
  description: string;
  stakeholderNames: string[];
}

export interface StakeholderGroupFormProps {
  stakeholderGroup?: StakeholderGroup;
  onClose: () => void;
}

export const StakeholderGroupForm: React.FC<StakeholderGroupFormProps> = ({
  stakeholderGroup,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const {
    stakeholders,
    isFetching: isFetchingStakeholders,
    fetchError: fetchErrorStakeholders,
  } = useFetchStakeholders();

  const {
    stakeholderGroups,
    isFetching: isFetchingStakeholderGroups,
    fetchError: fetchErrorStakeholderGroups,
  } = useFetchStakeholderGroups();

  const stakeholdersOptions = stakeholders.map((stakeholder) => {
    return {
      value: stakeholder.name,
      toString: () => stakeholder.name,
    };
  });

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An stakeholder group with this name already exists. Use a different name.",
        (value) => {
          return duplicateNameCheck(
            stakeholderGroups || [],
            stakeholderGroup || null,
            value || ""
          );
        }
      ),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: stakeholderGroup?.name || "",
      description: stakeholderGroup?.description || "",
      stakeholderNames: stakeholderGroup?.stakeholders?.map(
        (stakeholder) => stakeholder.name
      ),
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onCreateStakeholderGroupSuccess = (
    _: AxiosResponse<StakeholderGroup>
  ) =>
    pushNotification({
      title: t("toastr.success.create", {
        type: t("terms.stakeholderGroup"),
      }),
      variant: "success",
    });

  const onCreateStakeholderGroupError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.create", {
        type: t("terms.stakeholderGroup").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: createStakeholderGroup } = useCreateStakeholderGroupMutation(
    onCreateStakeholderGroupSuccess,
    onCreateStakeholderGroupError
  );

  const onUpdateStakeholderGroupSuccess = (
    res: AxiosResponse<StakeholderGroup>
  ) =>
    pushNotification({
      title: t("toastr.success.save", {
        what: res.data.name,
        type: t("terms.stakeholderGroup"),
      }),
      variant: "success",
    });

  const onUpdateStakeholderGroupError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.stakeholderGroup").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: updateStakeholderGroup } = useUpdateStakeholderGroupMutation(
    onUpdateStakeholderGroupSuccess,
    onUpdateStakeholderGroupError
  );

  const onSubmit = (formValues: FormValues) => {
    const matchingStakeholderRefs: Ref[] = stakeholders
      .filter((stakeholder) =>
        formValues?.stakeholderNames?.includes(stakeholder.name)
      )
      .map((stakeholder) => {
        return {
          id: stakeholder.id,
          name: stakeholder.name,
        };
      });

    const payload: New<StakeholderGroup> = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      stakeholders: matchingStakeholderRefs,
    };

    if (stakeholderGroup) {
      updateStakeholderGroup({ id: stakeholderGroup.id, ...payload });
    } else {
      createStakeholderGroup(payload);
    }
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
      <HookFormPFTextArea
        control={control}
        name="description"
        label={t("terms.description")}
        fieldId="description"
      />
      <HookFormPFGroupController
        control={control}
        name="stakeholderNames"
        label={t("terms.member(s)")}
        fieldId="stakeholders"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeaheadmulti"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            id="stakeholders"
            toggleId="stakeholders-toggle"
            toggleAriaLabel="Stakeholders select dropdown toggle"
            aria-label={name}
            value={
              value
                ? value.map((value) => toOptionLike(value, stakeholdersOptions))
                : undefined
            }
            options={stakeholdersOptions}
            onChange={(selection) => {
              const currentValue = value || [];
              const selectionWithValue = selection as OptionWithValue<string>;
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
          />
        )}
      />

      <ActionGroup>
        <Button
          type="submit"
          id="stakeholder-group-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!stakeholderGroup ? t("actions.create") : t("actions.save")}
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
