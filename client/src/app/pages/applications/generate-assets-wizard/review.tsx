import * as React from "react";
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
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

export const Review: React.FC<{
  applications: DecoratedApplication[];
  targetProfile: unknown; // TODO: Replace with TargetProfile after #2534
  inputParameters: unknown; // TODO: Replace with InputParameters after #2534
}> = ({ applications, targetProfile, inputParameters }) => {
  const { t } = useTranslation();

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

      {/* TODO: Show:
        (1) the application details
        (2) the selected target profile
        (3) the input parameters
      */}
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
                        <DataListCell key="2" wrapModifier="breakWord">
                          {t("terms.sourcePlatform")}:{" "}
                          {application.platform?.name}
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
