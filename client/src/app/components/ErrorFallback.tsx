import { useContext, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { UserNinjaIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { NotificationsContext } from "@app/components/NotificationsContext";

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
  const { pushNotification } = useContext(NotificationsContext);
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
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader
          titleText={<>{t("dialog.message.pageError")}</>}
          icon={<EmptyStateIcon icon={UserNinjaIcon} />}
          headingLevel="h2"
        />
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
