import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { t_global_color_status_danger_200 as globalDangerColor200 } from "@patternfly/react-tokens";

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
