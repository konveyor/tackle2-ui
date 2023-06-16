import React, { useState } from "react";
import { StatusIcon } from "@migtools/lib-ui";

import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  Popover,
  Text,
  TextContent,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

interface ITrackerStatusProps {
  name: string;
  connected: boolean;
  message: string;
}
const TrackerStatus = ({ name, connected, message }: ITrackerStatusProps) => {
  const { t } = useTranslation();
  return (
    <>
      <StatusIcon
        status={connected ? "Ok" : "Error"}
        className={spacing.mlSm}
        label={
          connected ? (
            "Connected"
          ) : (
            <Popover
              aria-label="More information about no connection"
              alertSeverityVariant="danger"
              headerIcon={<ExclamationCircleIcon />}
              headerContent={t("composed.error", { what: t("terms.instance") })}
              bodyContent={
                <TextContent>
                  <Text>Jira instance {name} is not connected.</Text>
                  <Text>The reported reason for the error:</Text>
                  <CodeBlock>
                    <CodeBlockCode id="code-content">{message}</CodeBlockCode>
                  </CodeBlock>
                </TextContent>
              }
            >
              <Button isInline variant="link">
                Not connected
              </Button>
            </Popover>
          )
        }
      />
    </>
  );
};

export default TrackerStatus;
