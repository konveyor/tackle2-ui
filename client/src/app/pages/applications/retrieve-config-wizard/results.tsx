import * as React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Text,
  TextContent,
  TextVariants,
  Grid,
  GridItem,
  Button,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";

import { ApplicationManifestTask } from "@app/api/models";
import { DecoratedApplication } from "../useDecoratedApplications";

export interface ResultsData {
  success: {
    task: ApplicationManifestTask;
    application: DecoratedApplication;
  }[];
  failure: {
    message: string;
    cause: Error;
    application: DecoratedApplication;
  }[];
}

export interface ResultsProps {
  results: ResultsData | null;
}

export const Results: React.FC<ResultsProps> = ({ results }) => {
  const { t } = useTranslation();

  if (!results) {
    return (
      <div>
        <TextContent>
          <Text component={TextVariants.h3}>
            {t("retrieveConfigWizard.results.title")}
          </Text>
          <Text component={TextVariants.p}>
            {t("retrieveConfigWizard.results.noResults")}
          </Text>
        </TextContent>
      </div>
    );
  }

  const { success = [], failure = [] } = results;

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>
          {t("retrieveConfigWizard.results.title")}
        </Text>
        <Text component={TextVariants.p}>
          {t("retrieveConfigWizard.results.summary")}
        </Text>
      </TextContent>

      <Grid hasGutter>
        {success.length > 0 && (
          <GridItem span={12}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <CheckCircleIcon
                    color="var(--pf-global--success-color--100)"
                    style={{ marginRight: "8px" }}
                  />
                  {t("retrieveConfigWizard.results.successSubmissions", {
                    count: success.length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Successful task submissions">
                  <Thead>
                    <Tr>
                      <Th>{t("terms.application")}</Th>
                      <Th>{t("terms.task")}</Th>
                      <Th>{t("actions.actions")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {success.map((result) => (
                      <Tr key={result.application.id}>
                        <Td>
                          <div>
                            <strong>{result.application.name}</strong>
                            {result.application.description && (
                              <div
                                style={{ fontSize: "0.9em", color: "#6a6e73" }}
                              >
                                {result.application.description}
                              </div>
                            )}
                          </div>
                        </Td>
                        <Td>{result.task.id}</Td>
                        <Td>
                          <Button
                            variant="link"
                            component={(props) => (
                              <Link
                                {...props}
                                to={`/tasks/${result.task.id}`}
                              />
                            )}
                          >
                            View Task
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </GridItem>
        )}

        {failure.length > 0 && (
          <GridItem span={12}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <ExclamationTriangleIcon
                    color="var(--pf-global--danger-color--100)"
                    style={{ marginRight: "8px" }}
                  />
                  {t("retrieveConfigWizard.results.failedSubmissions", {
                    count: failure.length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Failed task submissions">
                  <Thead>
                    <Tr>
                      <Th>{t("terms.application")}</Th>
                      <Th>{t("terms.error")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {failure.map((result) => (
                      <Tr key={result.application.id}>
                        <Td>
                          <div>
                            <strong>{result.application.name}</strong>
                            {result.application.description && (
                              <div
                                style={{ fontSize: "0.9em", color: "#6a6e73" }}
                              >
                                {result.application.description}
                              </div>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div
                            style={{
                              color: "var(--pf-global--danger-color--100)",
                            }}
                          >
                            {result.message}
                          </div>
                          {result.cause?.message && (
                            <div
                              style={{
                                fontSize: "0.8em",
                                color: "#6a6e73",
                                marginTop: "4px",
                              }}
                            >
                              {result.cause.message}
                            </div>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </GridItem>
        )}

        {success.length === 0 && failure.length === 0 && (
          <GridItem span={12}>
            <Card>
              <CardBody>
                <Text>{t("retrieveConfigWizard.noTasksSubmitted")}</Text>
              </CardBody>
            </Card>
          </GridItem>
        )}
      </Grid>
    </>
  );
};
