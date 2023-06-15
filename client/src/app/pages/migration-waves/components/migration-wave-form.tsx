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
} from "@app/queries/migration-waves";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Stakeholder,
  StakeholderGroup,
  MigrationWave,
  New,
} from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { NotificationsContext } from "@app/shared/notifications-context";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
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
  name?: string;
  startDate: Date | null;
  endDate: Date | null;
  stakeholders: Stakeholder[];
  stakeholderGroups: StakeholderGroup[];
}

export interface WaveFormProps {
  migrationWave?: MigrationWave;
  onClose: () => void;
}

export const WaveForm: React.FC<WaveFormProps> = ({
  migrationWave,
  onClose,
}) => {
  const { t } = useTranslation();

  const { migrationWaves } = useFetchMigrationWaves();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { stakeholders } = useFetchStakeholders();
  const { stakeholderGroups } = useFetchStakeholderGroups();

  const onCreateMigrationWaveSuccess = (
    response: AxiosResponse<MigrationWave>
  ) => {
    pushNotification({
      title: t("toastr.success.create", {
        what: response.data.name,
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onCreateMigrationWaveError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.create", {
        type: t("terms.migrationWave").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: createMigrationWave } = useCreateMigrationWaveMutation(
    onCreateMigrationWaveSuccess,
    onCreateMigrationWaveError
  );

  const onUpdateMigrationWaveSuccess = () => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onUpdateMigrationWaveError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.migrationWave").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: updateMigrationWave } = useUpdateMigrationWaveMutation(
    onUpdateMigrationWaveSuccess,
    onUpdateMigrationWaveError
  );

  const validationSchema: yup.SchemaOf<WaveFormValues> = yup.object().shape({
    name: yup
      .string()
      .trim()
      .max(120, t("validation.maxLength", { length: 120 })),
    startDate: yup
      .date()
      .when([], {
        is: () => !!!migrationWave?.startDate,
        then: yup
          .date()
          .min(dayjs().toDate(), "Start date can be no sooner than today"),
        otherwise: yup.date(),
      })
      .when([], {
        is: () => !!migrationWave?.endDate,
        then: yup
          .date()
          .max(yup.ref("endDate"), "Start date must be before end date"),
        otherwise: yup.date(),
      })
      .required(t("validation.required")),
    endDate: yup
      .date()
      .min(yup.ref("startDate"), "End date must be after start date")
      .required(t("validation.required")),
    stakeholders: yup.array(),
    stakeholderGroups: yup.array(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    control,
    watch,
  } = useForm<WaveFormValues>({
    mode: "onChange",
    defaultValues: {
      name: migrationWave?.name || "",
      startDate: migrationWave?.startDate
        ? dayjs(migrationWave.startDate).toDate()
        : null,
      endDate: migrationWave?.endDate
        ? dayjs(migrationWave.endDate).toDate()
        : null,
      stakeholders: migrationWave?.stakeholders || [],
      stakeholderGroups: migrationWave?.stakeholderGroups || [],
    },
    resolver: yupResolver(validationSchema),
  });

  const startDate = watch("startDate");
  const endDate = getValues("endDate");

  const onSubmit = (formValues: WaveFormValues) => {
    const payload: New<MigrationWave> = {
      applications: migrationWave?.applications || [],
      name: formValues.name?.trim() || "",
      startDate: dayjs.utc(formValues.startDate).format(),
      endDate: dayjs.utc(formValues.endDate).format(),
      stakeholders: formValues.stakeholders,
      stakeholderGroups: formValues.stakeholderGroups,
    };
    if (migrationWave)
      updateMigrationWave({
        id: migrationWave.id,
        ...payload,
      });
    else createMigrationWave(payload);

    onClose();
  };

  const startDateValidator = (date: Date) => {
    if (date < dayjs().toDate()) {
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
                isRequired
                renderInput={({ field: { value, name, onChange } }) => {
                  const startDateValue = value
                    ? dayjs(value).format("MM/DD/YYYY")
                    : "";
                  return (
                    <DatePicker
                      aria-label={name}
                      onChange={(e, val, date) => {
                        onChange(date);
                      }}
                      placeholder="MM/DD/YYYY"
                      value={startDateValue}
                      dateFormat={(val) => dayjs(val).format("MM/DD/YYYY")}
                      dateParse={(val) => dayjs(val).toDate()}
                      validators={[startDateValidator]}
                      appendTo={() =>
                        document.getElementById(
                          "create-edit-migration-wave-modal"
                        ) as HTMLElement
                      }
                      isDisabled={dayjs(value).isBefore(dayjs())}
                    />
                  );
                }}
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
                isRequired
                renderInput={({ field: { value, name, onChange } }) => (
                  <DatePicker
                    aria-label={name}
                    onChange={(e, val, date) => {
                      onChange(date);
                    }}
                    placeholder="MM/DD/YYYY"
                    value={endDate ? dayjs(endDate).format("MM/DD/YYYY") : ""}
                    dateFormat={(val) => dayjs(val).format("MM/DD/YYYY")}
                    dateParse={(val) => dayjs(val).toDate()}
                    validators={[endDateValidator]}
                    appendTo={() =>
                      document.getElementById(
                        "create-edit-migration-wave-modal"
                      ) as HTMLElement
                    }
                    isDisabled={
                      !startDate || dayjs(startDate).isBefore(dayjs())
                    }
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
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                variant="typeaheadmulti"
                id="stakeholders"
                toggleId="stakeholders-toggle"
                toggleAriaLabel="Stakeholders select dropdown toggle"
                aria-label={name}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.stakeholders").toLowerCase(),
                })}
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
            label={t("terms.stakeholderGroups")}
            fieldId="stakeholderGroups"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                variant="typeaheadmulti"
                id="stakeholder-groups"
                toggleId="stakeholder-groups-toggle"
                toggleAriaLabel="Stakeholder groups select dropdown toggle"
                aria-label={name}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.stakeholderGroups").toLowerCase(),
                })}
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
          id="migration-wave-form-submit"
          variant="primary"
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!migrationWave ? "Create" : "Save"}
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
