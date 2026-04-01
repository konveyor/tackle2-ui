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

import { PlatformApplicationImportTask, SourcePlatform } from "@app/api/models";

export interface ResultsData {
  success: Array<{
    task: PlatformApplicationImportTask;
    platform: SourcePlatform;
  }>;
  failure: Array<{
    message: string;
    cause: Error;
    platform: SourcePlatform;
  }>;
}

interface IResultsProps {
  results?: ResultsData;
}

export const Results: React.FC<IResultsProps> = ({ results }) => {
  const { t } = useTranslation();

  if (!results) {
    return (
      <div>
        <Content>
          <Content component={ContentVariants.h3}>
            {t("platformDiscoverWizard.results.title")}
          </Content>
          <Content component={ContentVariants.p}>
            {t("platformDiscoverWizard.results.noResults")}
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
          {t("platformDiscoverWizard.results.title")}
        </Content>
        <Content component={ContentVariants.p}>
          {t("platformDiscoverWizard.results.summary")}
        </Content>
      </Content>

      <Grid>
        {success.length === 0 && failure.length === 0 && (
          <GridItem span={12}>
            <Card>
              <CardBody>
                <Content component={ContentVariants.p}>
                  {t("platformDiscoverWizard.results.noTasksSubmitted")}
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
                  {t("platformDiscoverWizard.results.successSubmissions", {
                    count: success.length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Successful task submissions">
                  <Thead>
                    <Tr>
                      <Th>{t("terms.sourcePlatform")}</Th>
                      <Th>{t("terms.task")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {success.map((result) => (
                      <Tr key={result.platform.id}>
                        <Td>
                          <div>
                            <strong>{result.platform.name}</strong>
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
                  {t("platformDiscoverWizard.results.failedSubmissions", {
                    count: failure.length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Failed task submissions">
                  <Thead>
                    <Tr>
                      <Th>{t("terms.sourcePlatform")}</Th>
                      <Th>{t("terms.error")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {failure.map((result) => (
                      <Tr key={result.platform.id}>
                        <Td>
                          <div>
                            <strong>{result.platform.name}</strong>
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
