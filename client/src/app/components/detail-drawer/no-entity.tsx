import "./drawer-tabs-container.css";

import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";

export interface NoEntitySelectedProps {
  entityName?: string;
  title?: string;
  description?: string;
}

export const NoEntitySelected: React.FC<NoEntitySelectedProps> = ({
  entityName = "entity",
  title = "No {{entity}} selected",
  description = "Please select an {{entity}} in the table to view its details.",
}) => {
  const { t } = useTranslation();

  return (
    <div className="drawer-tabs-container">
      <EmptyState
        headingLevel="h4"
        icon={CubesIcon}
        titleText={t(title, { entity: entityName })}
        variant={EmptyStateVariant.sm}
      >
        <EmptyStateBody>
          {t(description, { entity: entityName })}
        </EmptyStateBody>
      </EmptyState>
    </div>
  );
};
