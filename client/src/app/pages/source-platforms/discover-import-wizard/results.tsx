import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  List,
  ListItem,
  TextContent,
  Text,
} from "@patternfly/react-core";

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
  results: ResultsData;
}

export const Results: React.FC<IResultsProps> = ({ results }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showErrorDetails, setShowErrorDetails] = React.useState<{
    [key: number]: boolean;
  }>({});

  const { success, failure } = results;

  const toggleErrorDetails = (index: number) => {
    setShowErrorDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">{t("platformDiscoverWizard.results.title")}</Text>
        <Text component="p">{t("platformDiscoverWizard.results.summary")}</Text>
      </TextContent>

      {success.length === 0 && failure.length === 0 && (
        <Alert
          variant="info"
          title={t("platformDiscoverWizard.results.noResults")}
        />
      )}

      {success.length > 0 && (
        <Alert
          variant="success"
          title={t("platformDiscoverWizard.results.successSubmissions", {
            count: success.length,
          })}
          style={{ marginBottom: "var(--pf-v5-global--spacer--md)" }}
        >
          <ExpandableSection
            toggleText={
              isExpanded ? t("actions.showLess") : t("actions.showMore")
            }
            onToggle={(_event, expanded) => setIsExpanded(expanded)}
            isExpanded={isExpanded}
          >
            <List>
              {success.map((result, index) => (
                <ListItem key={index}>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        {t("terms.platform")}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {result.platform.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        {t("terms.taskId")}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {result.task.id}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </ListItem>
              ))}
            </List>
          </ExpandableSection>
        </Alert>
      )}

      {failure.length > 0 && (
        <Alert
          variant="danger"
          title={t("platformDiscoverWizard.results.failedSubmissions", {
            count: failure.length,
          })}
        >
          <List>
            {failure.map((result, index) => (
              <ListItem key={index}>
                <div>
                  <strong>{result.platform.name}:</strong> {result.message}
                  <br />
                  <Button
                    variant="link"
                    isInline
                    onClick={() => toggleErrorDetails(index)}
                  >
                    {showErrorDetails[index]
                      ? t("actions.hideDetails")
                      : t("actions.showDetails")}
                  </Button>
                  {showErrorDetails[index] && (
                    <div
                      style={{ marginTop: "var(--pf-v5-global--spacer--sm)" }}
                    >
                      <pre
                        style={{
                          fontSize: "var(--pf-v5-global--FontSize--sm)",
                        }}
                      >
                        {result.cause.message}
                      </pre>
                    </div>
                  )}
                </div>
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </div>
  );
};
