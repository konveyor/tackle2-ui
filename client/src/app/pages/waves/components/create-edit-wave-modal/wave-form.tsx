import * as React from "react";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ActionGroup, Button, Form } from "@patternfly/react-core";

import { Stakeholder, StakeholderGroup, Wave } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import { HookFormPFTextInput } from "@app/shared/components/hook-form-pf-fields";

interface WaveFormValues {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  stakeholders: Stakeholder[];
  stakeholderGroups: StakeholderGroup[];
}

export interface WaveFormProps {
  waveBeingEdited?: Wave;
  onCancel: () => void;
}

export const WaveForm: React.FC<WaveFormProps> = ({
  waveBeingEdited,
  onCancel,
}) => {
  const { t } = useTranslation();

  const waves: Wave[] = []; // TODO use the useFetchWaves query here
  const isLoading = false; // TODO

  const validationSchema: yup.SchemaOf<WaveFormValues> = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An identity with this name already exists. Use a different name.",
        (value) =>
          duplicateNameCheck(waves, waveBeingEdited || null, value || "")
      ),
    startDate: yup.date().required(t("validation.required")),
    endDate: yup.date().required(t("validation.required")),
    stakeholders: yup.array(),
    stakeholderGroups: yup.array(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    setValue,
    control,
    watch,
  } = useForm<WaveFormValues>({
    defaultValues: {
      name: "",
      startDate: null,
      endDate: null,
      stakeholders: [],
      stakeholderGroups: [],
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = watch();

  const onSubmit = (formValues: WaveFormValues) => {
    // TODO
  };

  // TODO grid layout
  // TODO datepickers
  // TODO multiselects for stakeholders/groups? are they interdependent? reuse existing query

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Name"
        fieldId="name"
        isRequired
      />
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="wave-form-submit"
          variant="primary"
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
          }
        >
          {!waveBeingEdited ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant="link"
          isDisabled={isSubmitting || isValidating}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
