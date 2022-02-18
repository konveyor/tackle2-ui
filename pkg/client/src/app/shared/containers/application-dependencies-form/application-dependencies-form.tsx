import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Spinner,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { OptionWithValue } from "@app/shared/components";
import {
  useFetchApplicationDependencies,
  useFetchApplications,
} from "@app/shared/hooks";

import { Application, ApplicationDependency } from "@app/api/models";

import { FormContext } from "./form-context";
import { SelectDependency } from "./select-dependency";
import { getAxiosErrorMessage } from "@app/utils/utils";

const northToStringFn = (value: ApplicationDependency) => value.from.name;
const southToStringFn = (value: ApplicationDependency) => value.to.name;

const dependencyToOption = (
  value: ApplicationDependency,
  toStringFn: (value: ApplicationDependency) => string
): OptionWithValue<ApplicationDependency> => ({
  value,
  toString: () => toStringFn(value),
});

export interface ApplicationDependenciesFormProps {
  application: Application;
  onCancel: () => void;
}

export const ApplicationDependenciesForm: React.FC<
  ApplicationDependenciesFormProps
> = ({ application, onCancel }) => {
  const {
    isNorthBeingSaved,
    isSouthBeingSaved,
    northSaveError,
    southSaveError,
    setIsNorthBeingSaved,
    setIsSouthBeingSaved,
    setNorthSaveError,
    setSouthSaveError,
  } = useContext(FormContext);

  const { t } = useTranslation();

  const [northboundDependencies, setNorthboundDependencies] = useState<
    OptionWithValue<ApplicationDependency>[]
  >([]);
  const [southboundDependencies, setSouthboundDependencies] = useState<
    OptionWithValue<ApplicationDependency>[]
  >([]);

  // Dependencies

  const {
    applicationDependencies: northDependencies,
    isFetching: isFetchingNorthDependencies,
    fetchError: fetchErrorNorthDependencies,
    fetchAllApplicationDependencies: fetchAllNorthDependencies,
  } = useFetchApplicationDependencies();

  const {
    applicationDependencies: southDependencies,
    isFetching: isFetchingSouthDependencies,
    fetchError: fetchErrorSouthDependencies,
    fetchAllApplicationDependencies: fetchAllSouthDependencies,
  } = useFetchApplicationDependencies();

  useEffect(() => {
    fetchAllNorthDependencies({
      to: [`${application.id}`],
    });
  }, [application, fetchAllNorthDependencies]);

  useEffect(() => {
    fetchAllSouthDependencies({
      from: [`${application.id}`],
    });
  }, [application, fetchAllSouthDependencies]);

  // Applications

  const {
    applications,
    isFetching: isFetchingApplications,
    fetchError: fetchErrorApplications,
    fetchAllApplications,
  } = useFetchApplications();

  useEffect(() => {
    fetchAllApplications();
  }, [fetchAllApplications]);

  // Initial value

  useEffect(() => {
    if (northDependencies) {
      const north = northDependencies.data
        .filter((f) => f.to.id === application.id)
        .map((f) => dependencyToOption(f, northToStringFn));
      setNorthboundDependencies(north);
    }
  }, [application, northDependencies]);

  useEffect(() => {
    if (southDependencies) {
      const south = southDependencies.data
        .filter((f) => f.from.id === application.id)
        .map((f) => dependencyToOption(f, southToStringFn));
      setSouthboundDependencies(south);
    }
  }, [application, southDependencies]);

  const savingMsg = (
    <div className="pf-u-font-size-sm">
      <Spinner isSVG size="sm" /> {`${t("message.savingSelection")}...`}
    </div>
  );

  return (
    <Form>
      <TextContent>
        <Text component="p">{t("message.manageDependenciesInstructions")}</Text>
      </TextContent>

      <FormGroup
        // t("terms.northboundDependencies")
        label={t("composed.add", {
          what: t("terms.northboundDependencies").toLowerCase(),
        })}
        fieldId="northbound-dependencies"
        isRequired={false}
        validated={northSaveError ? "error" : "default"}
        helperTextInvalid={
          northSaveError ? getAxiosErrorMessage(northSaveError) : ""
        }
        helperText={isNorthBeingSaved ? savingMsg : ""}
      >
        <SelectDependency
          fieldId="northbound-dependencies"
          toStringFn={northToStringFn}
          value={northboundDependencies}
          setValue={setNorthboundDependencies}
          options={(applications?.data || [])
            .filter((f) => f.id !== application.id)
            .map((f) =>
              dependencyToOption({ from: f, to: application }, northToStringFn)
            )}
          isFetching={isFetchingApplications || isFetchingNorthDependencies}
          fetchError={fetchErrorApplications || fetchErrorNorthDependencies}
          isSaving={isNorthBeingSaved}
          setIsSaving={setIsNorthBeingSaved}
          saveError={northSaveError}
          setSaveError={setNorthSaveError}
        />
      </FormGroup>
      <FormGroup
        // t("terms.southboundDependencies")
        label={t("composed.add", {
          what: t("terms.southboundDependencies").toLowerCase(),
        })}
        fieldId="southbound-dependencies"
        isRequired={false}
        validated={southSaveError ? "error" : "default"}
        helperTextInvalid={
          southSaveError ? getAxiosErrorMessage(southSaveError) : ""
        }
        helperText={isSouthBeingSaved ? savingMsg : ""}
      >
        <SelectDependency
          fieldId="southbound-dependencies"
          toStringFn={southToStringFn}
          value={southboundDependencies}
          setValue={setSouthboundDependencies}
          options={(applications?.data || [])
            .filter((f) => f.id !== application.id)
            .map((f) =>
              dependencyToOption({ from: application, to: f }, southToStringFn)
            )}
          isFetching={isFetchingApplications || isFetchingSouthDependencies}
          fetchError={fetchErrorApplications || fetchErrorSouthDependencies}
          isSaving={isSouthBeingSaved}
          setIsSaving={setIsSouthBeingSaved}
          saveError={southSaveError}
          setSaveError={setSouthSaveError}
        />
      </FormGroup>

      <ActionGroup>
        <Button
          type="button"
          aria-label="close"
          variant={ButtonVariant.primary}
          onClick={onCancel}
          isDisabled={isNorthBeingSaved || isSouthBeingSaved}
        >
          {t("actions.close")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
