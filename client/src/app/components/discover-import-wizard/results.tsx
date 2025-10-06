import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Grid,
  GridItem,
  Icon,
  Text,
  TextContent,
  TextVariants,
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
        <TextContent>
          <Text component={TextVariants.h3}>
            {t("platformDiscoverWizard.results.title")}
          </Text>
          <Text component={TextVariants.p}>
            {t("platformDiscoverWizard.results.noResults")}
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
          {t("platformDiscoverWizard.results.title")}
        </Text>
        <Text component={TextVariants.p}>
          {t("platformDiscoverWizard.results.summary")}
        </Text>
      </TextContent>

      <Grid>
        {success.length === 0 && failure.length === 0 && (
          <GridItem span={12}>
            <Card>
              <CardBody>
                <Text>
                  {t("platformDiscoverWizard.results.noTasksSubmitted")}
                </Text>
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
