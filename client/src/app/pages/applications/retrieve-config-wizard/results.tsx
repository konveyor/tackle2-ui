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

import { ApplicationTask, EmptyTaskData } from "@app/api/models";
import { DecoratedApplication } from "../useDecoratedApplications";

export interface ResultsData {
  success: {
    task: ApplicationTask<EmptyTaskData>;
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
          <Text component={TextVariants.h3}>Results</Text>
          <Text component={TextVariants.p}>No results available.</Text>
        </TextContent>
      </div>
    );
  }

  const { success = [], failure = [] } = results;

  return (
    <div>
      <TextContent>
        <Text component={TextVariants.h3}>Configuration Retrieval Results</Text>
        <Text component={TextVariants.p}>
          Summary of configuration retrieval task submissions.
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
                  Successful Submissions ({success.length})
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Successful task submissions">
                  <Thead>
                    <Tr>
                      <Th>Application</Th>
                      <Th>Task ID</Th>
                      <Th>Actions</Th>
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
                  Failed Submissions ({failure.length})
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Table aria-label="Failed task submissions">
                  <Thead>
                    <Tr>
                      <Th>Application</Th>
                      <Th>Error</Th>
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
                <Text>No tasks were submitted.</Text>
              </CardBody>
            </Card>
          </GridItem>
        )}
      </Grid>
    </div>
  );
};
