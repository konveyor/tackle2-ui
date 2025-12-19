import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import { Repository } from "@app/api/models";

export const RepositoryDetails: React.FC<{ repository: Repository }> = ({
  repository,
}) => {
  const { t } = useTranslation();

  return (
    <DescriptionList isHorizontal isCompact>
      {repository.kind && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.repositoryType")}</DescriptionListTerm>
          <DescriptionListDescription>
            {repository.kind || ""}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {repository.url && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.url")}</DescriptionListTerm>
          <DescriptionListDescription>
            {repository.url || ""}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {repository.branch && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.branch")}</DescriptionListTerm>
          <DescriptionListDescription>
            {repository.branch || ""}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {repository.path && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.path")}</DescriptionListTerm>
          <DescriptionListDescription>
            {repository.path || ""}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {/* TODO: Add credentials, show the Identity name, the default, or "Not available" */}
    </DescriptionList>
  );
};
