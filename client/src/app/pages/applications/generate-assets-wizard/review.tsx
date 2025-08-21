import * as React from "react";
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Panel,
  PanelMain,
  PanelMainBody,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import { DecoratedApplication } from "../useDecoratedApplications";
import { TargetProfile } from "@app/api/models";
import { ParameterState } from "./useWizardReducer";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { RepositoryDetails } from "@app/components/detail-drawer";

export const Review: React.FC<{
  applications: DecoratedApplication[];
  targetProfile: TargetProfile;
  parameters: ParameterState;
}> = ({ applications, targetProfile, parameters }) => {
  const { t } = useTranslation();
  const showParameters = parameters.parametersRequired && parameters.parameters;

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>
          {t("generateAssetsWizard.review.selectedApplications", {
            count: applications.length,
          })}
        </Text>
        <Text component={TextVariants.p}>
          {t("generateAssetsWizard.review.description", {
            count: applications.length,
          })}
        </Text>
      </TextContent>

      <Panel isScrollable>
        <PanelMain>
          <PanelMainBody>
            <DataList aria-label="applications to generate assets">
              {applications.map((application) => (
                <DataListItem
                  key={application.id}
                  aria-labelledby={`application-${application.id}`}
                >
                  <DataListItemRow>
                    <DataListItemCells
                      rowid={`application-${application.id}`}
                      dataListCells={[
                        <DataListCell key="1" wrapModifier="breakWord">
                          <Stack>
                            <StackItem>
                              <strong id={`application-${application.id}`}>
                                {application.name}
                              </strong>
                            </StackItem>
                            <StackItem>
                              <Text component={TextVariants.small}>
                                {application.description}
                              </Text>
                            </StackItem>
                          </Stack>
                        </DataListCell>,
                        <DataListCell key="2">
                          <DescriptionList isHorizontal>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                {t("terms.assetRepository")}
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {!application.assets ? (
                                  <EmptyTextMessage />
                                ) : (
                                  <RepositoryDetails
                                    repository={application.assets}
                                  />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>

                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                {t("terms.targetProfile")}
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {targetProfile.name}
                              </DescriptionListDescription>
                            </DescriptionListGroup>

                            {showParameters && (
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  {t("terms.inputParameters")}
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  <div
                                    style={{
                                      border:
                                        "1px solid var(--pf-v5-global--BorderColor--100)",
                                      borderRadius: "3px",
                                      padding: "16px",
                                    }}
                                  >
                                    <SchemaDefinedField
                                      id="generate-assets-parameters-review"
                                      jsonDocument={parameters.parameters ?? {}}
                                      jsonSchema={parameters.schema}
                                      isReadOnly={true}
                                    />
                                  </div>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            )}
                          </DescriptionList>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              ))}
            </DataList>
          </PanelMainBody>
        </PanelMain>
      </Panel>
    </>
  );
};
