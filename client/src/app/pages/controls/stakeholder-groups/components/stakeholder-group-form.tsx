import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { object, string } from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { New, Ref, StakeholderGroup } from "@app/api/models";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateStakeholderGroupMutation,
  useFetchStakeholderGroups,
  useUpdateStakeholderGroupMutation,
} from "@app/queries/stakeholdergroups";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { duplicateNameCheck } from "@app/utils/utils";

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

  const { stakeholders } = useFetchStakeholders();

  const { stakeholderGroups } = useFetchStakeholderGroups();

  const stakeholdersOptions = stakeholders.map((stakeholder) => {
    return { value: stakeholder.name };
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
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: stakeholderGroup?.name || "",
      description: stakeholderGroup?.description || "",
      stakeholderNames: stakeholderGroup?.stakeholders?.map(
        (stakeholder) => stakeholder.name
      ),
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onCreateStakeholderGroupSuccess = () =>
    pushNotification({
      title: t("toastr.success.create", {
        type: t("terms.stakeholderGroup"),
      }),
      variant: "success",
    });

  const onCreateStakeholderGroupError = () => {
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
    _response: unknown,
    group: StakeholderGroup
  ) =>
    pushNotification({
      title: t("toastr.success.saveWhat", {
        what: group.name,
        type: t("terms.stakeholderGroup"),
      }),
      variant: "success",
    });

  const onUpdateStakeholderGroupError = (_error: AxiosError) => {
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
          <MultiSelect
            toggleId="stakeholders-toggle"
            toggleAriaLabel="Stakeholders select dropdown toggle"
            aria-label={name}
            values={value}
            hasChips={true}
            options={stakeholdersOptions}
            onSelect={(selection) => {
              if (!selection) {
                return;
              }
              const currentValue = value || [];
              const e = currentValue.find((f) => f === selection);
              if (e) {
                onChange(currentValue.filter((f) => f !== selection));
              } else {
                onChange([...currentValue, selection]);
              }
            }}
            onClear={() => onChange([])}
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
