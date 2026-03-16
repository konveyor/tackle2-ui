import { useEffect, useState } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { Application, ApplicationDependency } from "@app/api/models";
import { OptionWithValue } from "@app/components/SimpleSelect";
import {
  useFetchApplicationDependencies,
  useFetchApplications,
} from "@app/queries/applications";
import { toRef } from "@app/utils/model-utils";

import { SelectDependency } from "./SelectDependency";

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
  const { t } = useTranslation();
  const { northboundDependencies, southboundDependencies, isFetching } =
    useFetchApplicationDependencies(application?.id);
  const [southSaveError, setSouthSaveError] = useState<null | string>(null);
  const [northSaveError, setNorthSaveError] = useState<null | string>(null);

  const [northboundDependenciesOptions, setNorthboundDependenciesOptions] =
    useState<OptionWithValue<ApplicationDependency>[]>([]);
  const [southboundDependenciesOptions, setSouthboundDependenciesOptions] =
    useState<OptionWithValue<ApplicationDependency>[]>([]);

  const { data: applications, isFetching: isFetchingApplications } =
    useFetchApplications();

  useEffect(() => {
    if (northboundDependencies) {
      const north = northboundDependencies
        .filter((f) => f.to.id === application.id)
        .map((f) => dependencyToOption(f, northToStringFn));
      setNorthboundDependenciesOptions(north);
    }
  }, [application, northboundDependencies]);

  useEffect(() => {
    if (southboundDependencies) {
      const south = southboundDependencies
        .filter((f) => f.from.id === application.id)
        .map((f) => dependencyToOption(f, southToStringFn));
      setSouthboundDependenciesOptions(south);
    }
  }, [application, southboundDependencies]);

  const existingDependencyMappings = southboundDependenciesOptions
    .map((sbd) => sbd.value.to.id)
    .concat(northboundDependenciesOptions.map((nbd) => nbd.value.from.id));

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
      >
        <SelectDependency
          toggleAriaLabel="northbound-dependencies-toggle"
          toggleId="northbound-dependencies-toggle"
          fieldId="northbound-dependencies"
          toStringFn={northToStringFn}
          value={northboundDependenciesOptions}
          setValue={setNorthboundDependenciesOptions}
          options={(applications || [])
            .filter((f) => f.id !== application.id)
            .filter((app) => {
              return !existingDependencyMappings?.includes(app.id);
            })
            .map((f) =>
              dependencyToOption({ from: f, to: application }, northToStringFn)
            )}
          isFetching={isFetchingApplications || isFetching}
          isSaving={isFetching}
          setErrorMsg={setNorthSaveError}
        />
        {northSaveError && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{northSaveError}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      <FormGroup
        label={t("composed.add", {
          what: t("terms.southboundDependencies").toLowerCase(),
        })}
        fieldId="southbound-dependencies"
        isRequired={false}
      >
        <SelectDependency
          toggleAriaLabel="southbound-dependencies-toggle"
          fieldId="southbound-dependencies"
          toggleId="southbound-dependencies-toggle"
          toStringFn={southToStringFn}
          value={southboundDependenciesOptions}
          setValue={setSouthboundDependenciesOptions}
          options={(applications || [])
            .filter(
              (app) =>
                app.id !== application.id &&
                !existingDependencyMappings?.includes(app.id)
            )
            .map((app) => {
              const fromApplicationRef = toRef(application);
              const toApplicationRef = toRef(app);

              if (fromApplicationRef && toApplicationRef) {
                return dependencyToOption(
                  { from: fromApplicationRef, to: toApplicationRef },
                  southToStringFn
                );
              } else {
                return null;
              }
            })
            .filter(Boolean)}
          isFetching={isFetchingApplications || isFetching}
          isSaving={isFetching}
          setErrorMsg={setSouthSaveError}
        />
        {southSaveError && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{southSaveError}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>

      <ActionGroup>
        <Button
          type="button"
          id="application-dependencies-close"
          aria-label="close"
          variant={ButtonVariant.primary}
          onClick={onCancel}
          isDisabled={isFetching}
        >
          {t("actions.close")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
