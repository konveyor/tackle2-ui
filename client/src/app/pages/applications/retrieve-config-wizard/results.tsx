import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  Grid,
  GridItem,
  Icon,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

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
        <Content>
          <Content component={ContentVariants.h3}>
            {t("retrieveConfigWizard.results.title")}
          </Content>
          <Content component={ContentVariants.p}>
            {t("retrieveConfigWizard.results.noResults")}
          </Content>
        </Content>
      </div>
    );
  }

  const { success = [], failure = [] } = results;

  return (
    <>
      <Content>
        <Content component={ContentVariants.h3}>
          {t("retrieveConfigWizard.results.title")}
        </Content>
        <Content component={ContentVariants.p}>
          {t("retrieveConfigWizard.results.summary")}
        </Content>
      </Content>

      <Grid hasGutter>
        {success.length === 0 && failure.length === 0 && (
          <GridItem span={12}>
            <Card>
              <CardBody>
                <Content>
                  {t("retrieveConfigWizard.results.noTasksSubmitted")}
                </Content>
              </CardBody>
            </Card>
          </GridItem>
        )}

        {success.length > 0 && (
          <GridItem span={12}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Icon
                    status="success"
                    isInline
                    style={{ marginRight: "8px" }}
                  >
                    <CheckCircleIcon />
                  </Icon>
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
                        <Td>
                          <Link to={`/tasks/${result.task.id}`}>
                            {result.task.id}
                          </Link>
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
                  <Icon status="danger" isInline style={{ marginRight: "8px" }}>
                    <ExclamationTriangleIcon />
                  </Icon>
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
      </Grid>
    </>
  );
};
