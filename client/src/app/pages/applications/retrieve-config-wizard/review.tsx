import * as React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  List,
  ListItem,
  Text,
  TextContent,
  TextVariants,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { RetrieveConfigWizardFormValues } from "./schema";

export const Review: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<RetrieveConfigWizardFormValues>();

  const selectedApplications = watch("selectedApplications", []);

  return (
    <div>
      <TextContent>
        <Text component={TextVariants.h3}>
          {t("wizard.retrieveConfigurations.review.title")}
        </Text>
        <Text component={TextVariants.p}>
          {t("wizard.retrieveConfigurations.review.description")}
        </Text>
      </TextContent>

      <Grid hasGutter>
        <GridItem span={12}>
          <Card>
            <CardHeader>
              <CardTitle>
                {t("wizard.retrieveConfigurations.review.selectedApplications")}{" "}
                ({selectedApplications.length})
              </CardTitle>
            </CardHeader>
            <CardBody>
              <List>
                {selectedApplications.map((application) => (
                  <ListItem key={application.id}>
                    <div>
                      <strong>{application.name}</strong>
                      {application.description && (
                        <div className="pf-u-font-size-sm pf-u-color-400">
                          {application.description}
                        </div>
                      )}
                      {application.platform && (
                        <div className="pf-u-font-size-xs pf-u-color-link">
                          Source Platform: {application.platform.name}
                        </div>
                      )}
                    </div>
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <TextContent style={{ marginTop: "1rem" }}>
        <Text component={TextVariants.small}>
          {t("wizard.retrieveConfigurations.review.warning")}
        </Text>
      </TextContent>
    </div>
  );
};
