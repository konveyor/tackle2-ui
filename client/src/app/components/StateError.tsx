import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";

export const StateError: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      variant={EmptyStateVariant.sm}
      headingLevel="h2"
      titleText={t("message.unableToConnect")}
      icon={ExclamationCircleIcon}
    >
      <EmptyStateBody>
        There was an error retrieving data. Check your connection and try again.
      </EmptyStateBody>
    </EmptyState>
  );
};
