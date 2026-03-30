import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Content,
  ContentVariants,
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
} from "@patternfly/react-core";

import { FormValues } from "./retrieve-config-wizard";

export const Review: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<FormValues>();
  const ready = watch("ready", []);

  return (
    <>
      <Content>
        <Content component={ContentVariants.h3}>
          {t("retrieveConfigWizard.review.selectedApplications", {
            count: ready.length,
          })}
        </Content>
        <Content component={ContentVariants.p}>
          {t("retrieveConfigWizard.review.description", {
            count: ready.length,
          })}
        </Content>
      </Content>

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
                              <Content component={ContentVariants.small}>
                                {application.description}
                              </Content>
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
