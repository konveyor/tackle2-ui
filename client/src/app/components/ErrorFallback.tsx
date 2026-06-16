import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { UserNinjaIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { NotificationsContext } from "@app/components/NotificationsContext";

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: (...args: Array<unknown>) => void;
}) => {
  const { t } = useTranslation();

  const history = useHistory();
  const { pushNotification } = useContext(NotificationsContext);

  const errorMessage =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  useEffect(() => {
    pushNotification({
      title: "Failed",
      message: errorMessage,
      variant: "danger",
      timeout: 30000,
    });
  }, [errorMessage, pushNotification]);

  return (
    <Bullseye>
      <EmptyState
        headingLevel="h2"
        icon={UserNinjaIcon}
        titleText={<>{t("dialog.message.pageError")}</>}
        variant={EmptyStateVariant.sm}
      >
        <EmptyStateBody>
          {t("dialog.message.refreshPage")}
          <Button
            variant="primary"
            className={spacing.mtSm}
            onClick={() => {
              history.push("/");
              resetErrorBoundary(false);
            }}
          >
            {t("terms.refresh")}
          </Button>
        </EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );
};
