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

import { Application } from "@app/api/models";
import { useFetchApplications } from "@app/queries/applications";

import { MultiSelect } from "../FilterToolbar/components/MultiSelect";

import { useApplicationDependencies } from "./useApplicationDependencies";

export interface ApplicationDependenciesFormProps {
  application: Application;
  onCancel: () => void;
}

export const ApplicationDependenciesForm: React.FC<
  ApplicationDependenciesFormProps
> = ({ application, onCancel }) => {
  const { t } = useTranslation();

  const {
    northboundDependenciesOptions,
    southboundDependenciesOptions,
    createDependency,
    deleteDependency,
    saveError,
    isFetching,
    clearSouthboundDependencies,
    clearNorthboundDependencies,
  } = useApplicationDependencies(application);

  const { data: applications, isFetching: isFetchingApplications } =
    useFetchApplications();

  return (
    <Form>
      <TextContent>
        <Text component="p">{t("message.manageDependenciesInstructions")}</Text>
      </TextContent>

      <FormGroup
        label={t("composed.add", {
          what: t("terms.northboundDependencies").toLowerCase(),
        })}
        fieldId="northbound-dependencies"
        isRequired={false}
      >
        <MultiSelect
          toggleAriaLabel="Northbound dependencies"
          toggleId="northbound-dependencies-toggle"
          hasChips={true}
          values={northboundDependenciesOptions}
          placeholderText={t("composed.selectMany", {
            what: t("terms.applications").toLowerCase(),
          })}
          onClear={clearNorthboundDependencies}
          options={(applications || [])
            .filter((app) => app.id !== application.id)
            .map((app) => ({ value: String(app.id), label: app.name }))}
          isDisabled={isFetchingApplications || isFetching}
          onSelect={(fromId) => {
            if (!fromId) {
              return;
            }
            if (northboundDependenciesOptions.includes(fromId)) {
              deleteDependency(fromId, application.id);
              return;
            }

            createDependency(
              applications?.find((app) => app.id === Number(fromId)),
              application
            );
          }}
        />
        {saveError.northSaveError && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{saveError.northSaveError}</HelperTextItem>
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
        <MultiSelect
          toggleAriaLabel="Southbound dependencies"
          toggleId="southbound-dependencies-toggle"
          values={southboundDependenciesOptions}
          hasChips={true}
          onClear={clearSouthboundDependencies}
          placeholderText={t("composed.selectMany", {
            what: t("terms.applications").toLowerCase(),
          })}
          options={(applications || [])
            .filter((app) => app.id !== application.id)
            .map((app) => ({ value: String(app.id), label: app.name }))}
          isDisabled={isFetchingApplications || isFetching}
          onSelect={(toId) => {
            if (!toId) {
              return;
            }
            if (southboundDependenciesOptions.includes(toId)) {
              deleteDependency(application.id, toId);
              return;
            }
            createDependency(
              application,
              applications?.find((app) => app.id === Number(toId))
            );
          }}
        />
        {saveError.southSaveError && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{saveError.southSaveError}</HelperTextItem>
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
