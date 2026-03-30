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

import { ApplicationAssetGenerationTask } from "@app/api/models";

import { DecoratedApplication } from "../useDecoratedApplications";

export interface ResultsData {
  success: {
    task: ApplicationAssetGenerationTask;
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
            {t("generateAssetsWizard.results.title")}
          </Content>
          <Content component={ContentVariants.p}>
            {t("generateAssetsWizard.results.noResults")}
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
          {t("generateAssetsWizard.results.title")}
        </Content>
        <Content component={ContentVariants.p}>
          {t("generateAssetsWizard.results.summary")}
        </Content>
      </Content>

      <Grid hasGutter>
        {success.length === 0 && failure.length === 0 && (
          <GridItem span={12}>
            <Card>
              <CardBody>
                <Content>{t("generateAssetsWizard.noTasksSubmitted")}</Content>
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
                  {t("generateAssetsWizard.results.successSubmissions", {
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
                    {success.map(({ application, task }) => (
                      <Tr key={application.id}>
                        <Td>
                          <div>
                            <strong>{application.name}</strong>
                            {application.description && (
                              <div
                                style={{ fontSize: "0.9em", color: "#6a6e73" }}
                              >
                                {application.description}
                              </div>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <Link to={`/tasks/${task.id}`}>{task.id}</Link>
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
                  {t("generateAssetsWizard.results.failedSubmissions", {
                    count: failure.length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Failed asset generation task submissions">
                  <Thead>
                    <Tr>
                      <Th>{t("terms.application")}</Th>
                      <Th>{t("terms.error")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {failure.map(({ application, message, cause }) => (
                      <Tr key={application.id}>
                        <Td>
                          <div>
                            <strong>{application.name}</strong>
                            {application.description && (
                              <div
                                style={{ fontSize: "0.9em", color: "#6a6e73" }}
                              >
                                {application.description}
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
                            {message}
                          </div>
                          {cause?.message && (
                            <div
                              style={{
                                fontSize: "0.8em",
                                color: "#6a6e73",
                                marginTop: "4px",
                              }}
                            >
                              {cause.message}
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
