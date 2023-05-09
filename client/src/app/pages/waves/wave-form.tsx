import * as React from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  ActionGroup,
  Button,
  Form,
  Grid,
  GridItem,
  DatePicker,
  Level,
  LevelItem,
} from "@patternfly/react-core";

import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import {
  useFetchMigrationWaves,
  useCreateMigrationWaveMutation,
  useUpdateMigrationWaveMutation,
} from "@app/queries/waves";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Stakeholder, StakeholderGroup, MigrationWave } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { NotificationsContext } from "@app/shared/notifications-context";
dayjs.extend(utc);

const stakeholderGroupToOption = (
  value: StakeholderGroup
): OptionWithValue<StakeholderGroup> => ({
  value,
  toString: () => value.name,
});

const stakeholderToOption = (
  value: Stakeholder
): OptionWithValue<Stakeholder> => ({
  value,
  toString: () => value.name,
  props: {
    description: value.email,
  },
});

interface WaveFormValues {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  stakeholders: Stakeholder[];
  stakeholderGroups: StakeholderGroup[];
}

export interface WaveFormProps {
  wave?: MigrationWave;
  onClose: () => void;
}

export const WaveForm: React.FC<WaveFormProps> = ({ wave, onClose }) => {
  const { t } = useTranslation();

  const { waves } = useFetchMigrationWaves();
  const isLoading = false; // TODO
  const { pushNotification } = React.useContext(NotificationsContext);

  const { stakeholders } = useFetchStakeholders();
  const { stakeholderGroups } = useFetchStakeholderGroups();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const onCreateUpdateMigrationWaveSuccess = (
    response: AxiosResponse<MigrationWave>
  ) => {
    pushNotification({
      title: t("toastr.success.save", {
        what: response.data.name,
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onCreateUpdateMigrationWaveError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.failure.save", {
        type: t("terms.migrationWave").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: createMigrationWave } = useCreateMigrationWaveMutation(
    onCreateUpdateMigrationWaveSuccess,
    onCreateUpdateMigrationWaveError
  );

  const { mutate: updateMigrationWave } = useUpdateMigrationWaveMutation(
    onCreateUpdateMigrationWaveSuccess,
    onCreateUpdateMigrationWaveError
  );

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
        (value) => duplicateNameCheck(waves, wave || null, value || "")
      ),
    startDate: yup
      .date()
      .typeError("Start date is required")
      .required(t("validation.required"))
      .min(today, "Start date can be no sooner than today"),
    endDate: yup
      .date()
      .typeError("Start date is required")
      .required(t("validation.required"))
      .min(yup.ref("startDate"), "End Date must be after Start Date"),
    stakeholders: yup.array(),
    stakeholderGroups: yup.array(),
  });

  const dateFormat = (date: Date) =>
    `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;

  const dateParse = (val: string) => new Date(val.slice(0, 10));

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    control,
    watch,
  } = useForm<WaveFormValues>({
    defaultValues: {
      name: wave?.name || "",
      startDate: wave?.startDate ? dateParse(wave.startDate) : null,
      endDate: wave?.endDate ? dateParse(wave.endDate) : null,
      stakeholders: wave?.stakeholders || [],
      stakeholderGroups: wave?.stakeholderGroups || [],
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const startDate = watch("startDate");
  const endDate = getValues("endDate");

  const onSubmit = (formValues: WaveFormValues) => {
    const payload: MigrationWave = {
      id: wave?.id,
      applications: wave?.applications || [],
      name: formValues.name.trim(),
      startDate: dayjs.utc(formValues.startDate).format(),
      endDate: dayjs.utc(formValues.endDate).format(),
      stakeholders: formValues.stakeholders,
      stakeholderGroups: formValues.stakeholderGroups,
    };
    if (wave)
      updateMigrationWave({
        ...payload,
      });
    else createMigrationWave(payload);

    onClose();
  };

  const startDateValidator = (date: Date) => {
    if (date < today) {
      return "Date is before allowable range.";
    }
    return "";
  };

  const endDateValidator = (date: Date) => {
    const sDate = getValues("startDate") || new Date();
    if (sDate >= date) {
      return "Date is before allowable range.";
    }
    return "";
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Grid hasGutter>
        <GridItem span={12}>
          <HookFormPFTextInput
            control={control}
            name="name"
            label="Name"
            fieldId="name"
            isRequired
          />
        </GridItem>
        <Level>
          <LevelItem>
            <GridItem span={5}>
              <HookFormPFGroupController
                control={control}
                name="startDate"
                label="Potential Start Date"
                fieldId="startDate"
                renderInput={({ field: { value, name, onChange } }) => (
                  <DatePicker
                    aria-label={name}
                    onChange={(e, val, date) => {
                      onChange(date);
                    }}
                    placeholder="MM/DD/YYYY"
                    value={startDate ? dateFormat(startDate) : ""}
                    validators={[startDateValidator]}
                    dateFormat={dateFormat}
                    dateParse={dateParse}
                    appendTo={() =>
                      document.getElementById(
                        "create-edit-wave-modal"
                      ) as HTMLElement
                    }
                  />
                )}
              />
            </GridItem>
          </LevelItem>
          <LevelItem>
            <GridItem span={2}>to</GridItem>
          </LevelItem>
          <LevelItem>
            <GridItem span={5}>
              <HookFormPFGroupController
                control={control}
                name="endDate"
                label="Potential End Date"
                fieldId="endDate"
                renderInput={({ field: { value, name, onChange } }) => (
                  <DatePicker
                    aria-label={name}
                    onChange={(e, val, date) => {
                      onChange(date);
                    }}
                    placeholder="MM/DD/YYYY"
                    value={endDate ? dateFormat(endDate) : ""}
                    validators={[endDateValidator]}
                    dateFormat={dateFormat}
                    dateParse={dateParse}
                    appendTo={() =>
                      document.getElementById(
                        "create-edit-wave-modal"
                      ) as HTMLElement
                    }
                    isDisabled={!startDate}
                  />
                )}
              />
            </GridItem>
          </LevelItem>
        </Level>
        <GridItem span={12}>
          <HookFormPFGroupController
            control={control}
            name="stakeholders"
            label={t("terms.stakeholders")}
            fieldId="stakeholders"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                variant="typeaheadmulti"
                id="stakeholders"
                toggleId="stakeholders-toggle"
                toggleAriaLabel="Stakeholders select dropdown toggle"
                aria-label={name}
                value={value.map(stakeholderToOption)}
                options={stakeholders.map(stakeholderToOption)}
                onChange={(selection) => {
                  const currentValue = value || [];
                  const selectionWithValue =
                    selection as OptionWithValue<Stakeholder>;
                  const e = currentValue.find(
                    (f) => f.id === selectionWithValue.value.id
                  );
                  if (e) {
                    onChange(
                      currentValue.filter(
                        (f) => f.id !== selectionWithValue.value.id
                      )
                    );
                  } else {
                    onChange([...currentValue, selectionWithValue.value]);
                  }
                }}
                onClear={() => onChange([])}
              />
            )}
          />
        </GridItem>
        <GridItem span={12}>
          <HookFormPFGroupController
            control={control}
            name="stakeholderGroups"
            label={t("terms.stakeholderGroup")}
            fieldId="stakeholderGroups"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                variant="typeaheadmulti"
                id="stakeholder-groups"
                toggleId="stakeholder-groups-toggle"
                toggleAriaLabel="Stakeholder groups select dropdown toggle"
                aria-label={name}
                value={value.map(stakeholderGroupToOption)}
                options={stakeholderGroups.map(stakeholderGroupToOption)}
                onChange={(selection) => {
                  const currentValue = value || [];
                  const selectionWithValue =
                    selection as OptionWithValue<StakeholderGroup>;
                  const e = currentValue.find(
                    (f) => f.name === selectionWithValue.value.name
                  );
                  if (e) {
                    onChange(
                      currentValue.filter(
                        (f) => f.name !== selectionWithValue.value.name
                      )
                    );
                  } else {
                    onChange([...currentValue, selectionWithValue.value]);
                  }
                }}
                onClear={() => onChange([])}
              />
            )}
          />
        </GridItem>
      </Grid>
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
          {!wave ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant="link"
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
