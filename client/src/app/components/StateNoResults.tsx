import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";

export const StateNoResults: React.FC = () => {
  const { t } = useTranslation();

  return (
    <EmptyState  headingLevel="h2" icon={SearchIcon}  titleText={t("message.noResultsFoundTitle")} variant={EmptyStateVariant.sm}>
      <EmptyStateBody>{t("message.noResultsFoundBody")}</EmptyStateBody>
    </EmptyState>
  );
};
