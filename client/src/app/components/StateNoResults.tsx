import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";

export const StateNoResults: React.FC = () => {
  const { t } = useTranslation();

  return (
    <EmptyState
      variant={EmptyStateVariant.sm}
      titleText={t("message.noResultsFoundTitle")}
      icon={SearchIcon}
      headingLevel="h2"
    >
      <EmptyStateBody>{t("message.noResultsFoundBody")}</EmptyStateBody>
    </EmptyState>
  );
};
