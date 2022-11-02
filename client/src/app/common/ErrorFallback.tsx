import {
  Bullseye,
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  Title,
  EmptyStateBody,
  Button,
} from "@patternfly/react-core";
import React, { useEffect, useRef } from "react";
import UserNinjaIcon from "@patternfly/react-icons/dist/esm/icons/user-ninja-icon";
import { NotificationsContext } from "@app/shared/notifications-context";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

const usePrevious = <T,>(value: T) => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: (...args: Array<unknown>) => void;
}) => {
  const { t } = useTranslation();

  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);
  const prevError = usePrevious(error);

  if (error.message !== prevError?.message) {
    pushNotification({
      title: "Failed",
      message: error.message,
      variant: "danger",
      timeout: 30000,
    });
  }

  return (
    <Bullseye>
      <EmptyState variant={EmptyStateVariant.small}>
        <EmptyStateIcon icon={UserNinjaIcon} />
        <Title headingLevel="h2" size="lg">
          {t("dialog.message.pageError")}
        </Title>
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
