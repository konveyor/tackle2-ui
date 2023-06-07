import React, { useState } from "react";
import { StatusIcon } from "@migtools/lib-ui";

import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  Modal,
} from "@patternfly/react-core";

interface ITrackerStatusProps {
  connected: boolean;
  message: string;
}
const TrackerStatus = ({ connected, message }: ITrackerStatusProps) => {
  const { t } = useTranslation();
  const [codeModalState, setCodeModalState] = useState<string | null>(null);
  return (
    <>
      <StatusIcon
        status={connected ? "Ok" : "Error"}
        className={spacing.mlSm}
        label={
          connected ? (
            "Connected"
          ) : (
            <Button
              isInline
              variant="link"
              onClick={() => setCodeModalState(message)}
            >
              Not connected
            </Button>
          )
        }
      />
      <Modal
        title={t("composed.error", {
          what: t("terms.instance"),
        })}
        width="50%"
        isOpen={!!codeModalState}
        onClose={() => setCodeModalState(null)}
      >
        <CodeBlock>
          <CodeBlockCode id="code-content">{codeModalState}</CodeBlockCode>
        </CodeBlock>
      </Modal>
    </>
  );
};

export default TrackerStatus;
