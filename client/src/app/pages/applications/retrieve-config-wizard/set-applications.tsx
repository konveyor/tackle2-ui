import * as React from "react";
import {
  Checkbox,
  Text,
  TextContent,
  TextVariants,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Application } from "@app/api/models";
import { RetrieveConfigWizardFormValues } from "./schema";

interface ISetApplications {
  applications: Application[];
  isFetching: boolean;
}

export const SetApplications: React.FC<ISetApplications> = ({
  applications,
  isFetching,
}) => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext<RetrieveConfigWizardFormValues>();

  const selectedApplications = watch("selectedApplications", []);

  const handleApplicationToggle = (
    application: Application,
    isSelected: boolean
  ) => {
    if (isSelected) {
      setValue("selectedApplications", [...selectedApplications, application]);
    } else {
      setValue(
        "selectedApplications",
        selectedApplications.filter((app) => app.id !== application.id)
      );
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setValue("selectedApplications", applications);
    } else {
      setValue("selectedApplications", []);
    }
  };

  const isApplicationSelected = (application: Application) =>
    selectedApplications.some((app) => app.id === application.id);

  const allSelected =
    applications.length > 0 &&
    selectedApplications.length === applications.length;

  return (
    <div>
      <TextContent>
        <Text component={TextVariants.h3}>
          {t("wizard.retrieveConfigurations.selectApplications.title")}
        </Text>
        <Text component={TextVariants.p}>
          {t("wizard.retrieveConfigurations.selectApplications.description")}
        </Text>
      </TextContent>

      <Table aria-label="Applications selection table">
        <Thead>
          <Tr>
            <Th>
              <Checkbox
                id="select-all-applications"
                isChecked={allSelected}
                onChange={(event, checked) => handleSelectAll(checked)}
                label={t("actions.selectAll")}
              />
            </Th>
            <Th>{t("terms.application")}</Th>
            <Th>{t("terms.description")}</Th>
            <Th>{t("terms.sourcePlatforms")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {applications.map((application) => (
            <Tr key={application.id}>
              <Td>
                <Checkbox
                  id={`application-${application.id}`}
                  isChecked={isApplicationSelected(application)}
                  onChange={(_event, checked) =>
                    handleApplicationToggle(application, checked)
                  }
                  aria-label={`Select ${application.name}`}
                />
              </Td>
              <Td>
                <strong>{application.name}</strong>
              </Td>
              <Td>
                {application.description || (
                  <Text
                    component={TextVariants.small}
                    style={{ color: "#6a6e73" }}
                  >
                    {t("terms.noDescription")}
                  </Text>
                )}
              </Td>
              <Td>
                {application.platform ? (
                  <Text
                    component={TextVariants.small}
                    style={{ color: "#0066cc" }}
                  >
                    {application.platform.name}
                  </Text>
                ) : (
                  <Text
                    component={TextVariants.small}
                    style={{ color: "#6a6e73" }}
                  >
                    {t("terms.none")}
                  </Text>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {selectedApplications.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <Text component={TextVariants.small}>
            {t("wizard.retrieveConfigurations.selectedCount", {
              count: selectedApplications.length,
              total: applications.length,
            })}
          </Text>
        </div>
      )}
    </div>
  );
};
