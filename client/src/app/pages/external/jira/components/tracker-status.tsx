import "./tracker-status.css";
import React, { useState } from "react";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  ExpandableSectionToggle,
  Popover,
  Text,
  TextContent,
  Spinner,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import { IconedStatus } from "@app/components/IconedStatus";

interface ITrackerStatusProps {
  name: string;
  connected: boolean;
  message: string;
  isTrackerUpdating?: boolean;
}
const TrackerStatus = ({
  name,
  connected,
  message,
  isTrackerUpdating,
}: ITrackerStatusProps) => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const needsExpanding = message.length > 300;
  const messageFirst = message.slice(0, 300);
  const messageRest = message.slice(300);

  return isTrackerUpdating ? (
    <Spinner size="sm" />
  ) : (
    <>
      <IconedStatus
        preset={connected ? "Ok" : "Error"}
        className={spacing.mlSm}
        label={
          connected ? (
            t("terms.connected")
          ) : (
            <Popover
              aria-label="More information about no connection"
              alertSeverityVariant="danger"
              headerIcon={<ExclamationCircleIcon />}
              headerContent={t("composed.error", {
                what: t("terms.instance"),
              })}
              hasAutoWidth
              onHidden={() => setIsExpanded(false)}
              bodyContent={
                <TextContent>
                  <Text>{t("message.jiraInstanceNotConnected", { name })}</Text>
                  <Text>{t("message.reasonForError")}</Text>
                  <CodeBlock
                    className="tracker-status-code"
                    actions={[
                      needsExpanding && (
                        <ExpandableSectionToggle
                          disabled={!needsExpanding}
                          isExpanded={isExpanded}
                          onToggle={setIsExpanded}
                          contentId="code-block-expand"
                          direction="up"
                        >
                          {isExpanded
                            ? t("terms.showLess")
                            : t("terms.showMore")}
                        </ExpandableSectionToggle>
                      ),
                    ].filter(Boolean)}
                  >
                    <CodeBlockCode id="code-content">
                      {messageFirst}
                      {isExpanded ? messageRest : ""}
                    </CodeBlockCode>
                  </CodeBlock>
                </TextContent>
              }
            >
              <Button isInline variant="link">
                {t("terms.notConnected")}
              </Button>
            </Popover>
          )
        }
      />
    </>
  );
};

export default TrackerStatus;
