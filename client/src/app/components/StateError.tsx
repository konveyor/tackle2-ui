import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { global_danger_color_200 as globalDangerColor200 } from "@patternfly/react-tokens";

export const StateError: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.sm}>
      <EmptyStateHeader
        titleText={t("message.unableToConnect")}
        icon={
          <EmptyStateIcon
            icon={ExclamationCircleIcon}
            color={globalDangerColor200.value}
          />
        }
        headingLevel="h2"
      />
      <EmptyStateBody>
        There was an error retrieving data. Check your connection and try again.
      </EmptyStateBody>
    </EmptyState>
  );
};
