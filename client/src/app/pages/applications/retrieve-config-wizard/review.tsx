import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
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

import { FormValues } from "./retrieve-config-wizard";

export const Review: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<FormValues>();
  const ready = watch("ready", []);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>
          {t("retrieveConfigWizard.review.selectedApplications", {
            count: ready.length,
          })}
        </Text>
        <Text component={TextVariants.p}>
          {t("retrieveConfigWizard.review.description", {
            count: ready.length,
          })}
        </Text>
      </TextContent>

      <Panel isScrollable>
        <PanelMain>
          <PanelMainBody>
            <DataList aria-label="applications to retrieve configurations">
              {ready.map((application) => (
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
                        <DataListCell key="3" wrapModifier="breakWord">
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

      {/* TODO: Add a view of the applications that are not ready for retrieve configurations. */}
    </>
  );
};
