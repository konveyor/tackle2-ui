import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { object, string } from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { BusinessService, New } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import {
  useCreateBusinessServiceMutation,
  useFetchBusinessServices,
  useUpdateBusinessServiceMutation,
} from "@app/queries/businessservices";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { matchItemsToRef } from "@app/utils/model-utils";

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
        t("duplicateName", { type: "A business service" }),
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
          <SimpleSelect
            variant="typeahead"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            id="action-select"
            toggleId="action-select-toggle"
            toggleAriaLabel="Action select dropdown toggle"
            aria-label={name}
            value={value}
            options={stakeholdersOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
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
