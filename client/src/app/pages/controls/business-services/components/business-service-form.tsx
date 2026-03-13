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

import { BusinessService, New } from "@app/api/models";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateBusinessServiceMutation,
  useFetchBusinessServices,
  useUpdateBusinessServiceMutation,
} from "@app/queries/businessservices";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { matchItemsToRef } from "@app/utils/model-utils";
import { duplicateNameCheck } from "@app/utils/utils";

export interface FormValues {
  name: string;
  description: string;
  owner: string;
}

export interface BusinessServiceFormProps {
  businessService: BusinessService | null;
  onClose: () => void;
}

export const BusinessServiceForm: React.FC<BusinessServiceFormProps> = ({
  businessService,
  onClose,
}) => {
  const { t } = useTranslation();

  const {
    businessServices,
    stakeholders,
    stakeholderToRef,
    createBusinessService,
    updateBusinessService,
  } = useBusinessServiceFormData({
    onActionSuccess: onClose,
  });

  const stakeholdersOptions: FilterSelectOptionProps[] = stakeholders.map(
    (stakeholder) => ({
      value: stakeholder.name,
      label: stakeholder.name,
    })
  );

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "A business service with this name already exists. Use a different name.",
        (value) => {
          return duplicateNameCheck(
            businessServices || [],
            businessService || null,
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
      name: businessService?.name || "",
      description: businessService?.description || "",
      owner: businessService?.owner?.name,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onSubmit = (formValues: FormValues) => {
    const payload: New<BusinessService> = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      owner: stakeholderToRef(formValues.owner),
    };

    if (businessService) {
      updateBusinessService({ id: businessService.id, ...payload });
    } else {
      createBusinessService(payload);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="business-service-name"
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
        name="owner"
        label={t("terms.owner")}
        fieldId="owner"
        renderInput={({ field: { value, name, onChange } }) => (
          <TypeaheadSelect
            id="action-select"
            toggleId="action-select-toggle"
            toggleAriaLabel="Action select dropdown toggle"
            ariaLabel={name}
            categoryKey="owner"
            value={value}
            options={stakeholdersOptions}
            onSelect={(selection) => onChange(selection ?? "")}
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
          {!businessService ? t("actions.create") : t("actions.save")}
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

const useBusinessServiceFormData = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { businessServices } = useFetchBusinessServices();
  const { stakeholders } = useFetchStakeholders();

  // Helpers
  const stakeholderToRef = (name: string | undefined | null) =>
    matchItemsToRef(stakeholders, (i) => i.name, name);

  // Mutation notification handlers
  const onCreateBusinessServiceSuccess = (data: BusinessService) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.businessService"),
        what: data.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onCreateBusinessServiceError = (
    _error: AxiosError,
    _payload: New<BusinessService>
  ) => {
    pushNotification({
      title: t("toastr.fail.create", {
        type: t("terms.businessService").toLowerCase(),
      }),
      variant: "danger",
    });
    onActionFail();
  };

  const onUpdateBusinessServiceSuccess = (payload: BusinessService) => {
    pushNotification({
      title: t("toastr.success.saveWhat", {
        type: t("terms.businessService"),
        what: payload.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateBusinessServiceError = (
    _error: AxiosError,
    _payload: New<BusinessService>
  ) => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.businessService").toLowerCase(),
      }),
      variant: "danger",
    });
    onActionFail();
  };

  // Mutations
  const { mutate: createBusinessService } = useCreateBusinessServiceMutation(
    onCreateBusinessServiceSuccess,
    onCreateBusinessServiceError
  );

  const { mutate: updateBusinessService } = useUpdateBusinessServiceMutation(
    onUpdateBusinessServiceSuccess,
    onUpdateBusinessServiceError
  );

  // Send back source data and action that are needed by the ApplicationForm
  return {
    businessServices,
    stakeholders,
    stakeholderToRef,
    createBusinessService,
    updateBusinessService,
  };
};
