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
} from "@patternfly/react-core";

import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergroups";
import {
  useCreateMigrationWaveMutation,
  useUpdateMigrationWaveMutation,
} from "@app/queries/migration-waves";
import dayjs from "dayjs";

import {
  Stakeholder,
  StakeholderGroup,
  MigrationWave,
  New,
} from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { matchItemsToRefs } from "@app/utils/model-utils";
import { useRef } from "react";

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
  startDateStr: string;
  endDateStr: string;
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

  const { pushNotification } = React.useContext(NotificationsContext);

  const { stakeholders } = useFetchStakeholders();
  const { stakeholderGroups } = useFetchStakeholderGroups();

  const onCreateMigrationWaveSuccess = (
    response: AxiosResponse<MigrationWave>
  ) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        what: response.data.name,
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onCreateMigrationWaveError = (error: AxiosError) => {
    if (error.response?.status === 409)
      pushNotification({
        title: t("message.duplicateWave"),
        variant: "danger",
      });
    else
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
    if (error.response?.status === 409)
      pushNotification({
        title: t("message.duplicateWave"),
        variant: "danger",
      });
    else
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

  const dateStrFormatValidator = (dateStr: string) =>
    dayjs(dateStr, "MM/DD/YYYY", true).isValid();

  const validationSchema: yup.SchemaOf<WaveFormValues> = yup.object().shape({
    name: yup
      .string()
      .defined()
      .test(
        "min-char-check",
        "Name is invalid. The name must be between 3 and 120 characters ",
        (value) => {
          if (value) {
            const schema = yup
              .string()
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 }));
            return schema.isValidSync(value);
          }
          return true;
        }
      ),
    startDateStr: yup
      .string()
      .required(t("validation.required"))
      .test(
        "isValidFormat",
        "Date must be formatted as MM/DD/YYYY",
        (value) => !!value && dateStrFormatValidator(value)
      )
      .test(
        "noSoonerThanToday",
        "Start date can be no sooner than today",
        (value) => !dayjs(value).isBefore(dayjs(), "day")
      ),
    endDateStr: yup
      .string()
      .required(t("validation.required"))
      .test(
        "isValidFormat",
        "Date must be formatted as MM/DD/YYYY",
        (value) => !!value && dateStrFormatValidator(value)
      )
      .when("startDateStr", (startDateStr, schema: yup.StringSchema) =>
        schema.test(
          "afterStartDate",
          "End date must be after start date",
          (value) =>
            !startDateStr || dayjs(value).isAfter(dayjs(startDateStr), "day")
        )
      ),
    stakeholders: yup.array(),
    stakeholderGroups: yup.array(),
  });

  const {
    handleSubmit,
    formState: {
      isSubmitting,
      isValidating,
      isValid,
      isDirty,
      errors: formErrors,
    },
    control,
    watch,
    trigger,
  } = useForm<WaveFormValues>({
    mode: "onChange",
    defaultValues: {
      name: migrationWave?.name || "",
      startDateStr: migrationWave?.startDate
        ? dayjs(migrationWave.startDate).format("MM/DD/YYYY")
        : "",
      endDateStr: migrationWave?.endDate
        ? dayjs(migrationWave.endDate).format("MM/DD/YYYY")
        : "",
      stakeholders: migrationWave?.stakeholders || [],
      stakeholderGroups: migrationWave?.stakeholderGroups || [],
    },
    resolver: yupResolver(validationSchema),
  });

  const startDateStr = watch("startDateStr");
  const startDate = dateStrFormatValidator(startDateStr)
    ? dayjs(startDateStr).toDate()
    : null;

  const onSubmit = (formValues: WaveFormValues) => {
    const stakeholders =
      stakeholdersToRefs(
        formValues.stakeholders.map((stakeholder) => stakeholder.name)
      ) ?? [];

    const stakeholderGroups =
      stakeholderGroupsToRefs(
        formValues.stakeholderGroups.map(
          (stakeholderGroup) => stakeholderGroup.name
        )
      ) ?? [];

    const payload: New<MigrationWave> = {
      applications: migrationWave?.applications || [],
      name: formValues.name?.trim() || "",
      startDate: dayjs(formValues.startDateStr).format(),
      endDate: dayjs(formValues.endDateStr).format(),
      stakeholders: stakeholders,
      stakeholderGroups: stakeholderGroups,
    };
    if (migrationWave)
      updateMigrationWave({
        id: migrationWave.id,
        ...payload,
      });
    else createMigrationWave(payload);

    onClose();
  };

  const startDateRangeValidator = (date: Date) => {
    const selectedDate = dayjs(date);
    const currentDate = dayjs();

    if (selectedDate.isBefore(currentDate, "day")) {
      return "Start date cannot be in the past.";
    }

    return "";
  };

  const endDateRangeValidator = (date: Date) => {
    const selectedEndDate = dayjs(date);
    const selectedStartDate = startDate ? dayjs(startDate) : null;

    if (
      !selectedStartDate ||
      selectedEndDate.isSameOrBefore(selectedStartDate, "day")
    ) {
      return "End date must be at least one day after the start date.";
    }

    return "";
  };

  const stakeholdersToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholders, (i) => i.name, names);

  const stakeholderGroupsToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholderGroups, (i) => i.name, names);

  const startDateRef = useRef<HTMLDivElement | null>(null);
  const endDateRef = useRef<HTMLDivElement | null>(null);

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
        <GridItem span={3}>
          <div ref={startDateRef}>
            <HookFormPFGroupController
              control={control}
              name="startDateStr"
              label="Potential Start Date"
              fieldId="startDateStr"
              isRequired
              renderInput={({ field: { value, name, onChange } }) => (
                <DatePicker
                  aria-label={name}
                  onChange={(e, val) => {
                    onChange(val);
                    trigger("endDateStr");
                  }}
                  placeholder="MM/DD/YYYY"
                  value={value}
                  dateFormat={(val) => dayjs(val).format("MM/DD/YYYY")}
                  dateParse={(val) => dayjs(val).toDate()}
                  validators={[startDateRangeValidator]}
                  appendTo={() => startDateRef.current || document.body}
                />
              )}
            />
          </div>
        </GridItem>
        <GridItem
          span={1}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          to
        </GridItem>
        <GridItem span={8}>
          <div ref={endDateRef}>
            <HookFormPFGroupController
              control={control}
              name="endDateStr"
              label="Potential End Date"
              fieldId="endDateStr"
              isRequired
              renderInput={({ field: { value, name, onChange } }) => (
                <DatePicker
                  isDisabled={!startDate}
                  aria-label={name}
                  onChange={(e, val) => onChange(val)}
                  placeholder="MM/DD/YYYY"
                  value={value && startDate ? value : ""}
                  dateFormat={(val) => dayjs(val).format("MM/DD/YYYY")}
                  dateParse={(val) => dayjs(val).toDate()}
                  validators={[endDateRangeValidator]}
                  appendTo={() => endDateRef.current || document.body}
                />
              )}
            />
          </div>
        </GridItem>

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
          id="submit"
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
