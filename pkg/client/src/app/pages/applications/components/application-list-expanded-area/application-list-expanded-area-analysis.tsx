import React from "react";
import { useTranslation } from "react-i18next";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import { Application } from "@app/api/models";

import { ApplicationTags } from "../application-tags";

export interface IApplicationListExpandedAreaProps {
  application: Application;
}

export const ApplicationListExpandedAreaAnalysis: React.FC<
  IApplicationListExpandedAreaProps
> = ({ application }) => {
  const { t } = useTranslation();

  return (
    <DescriptionList isHorizontal>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.tags")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="tags">
          <ApplicationTags application={application} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.comments")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="comments">
          {application.comments}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.credentials")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="credentials">
          TODO: Show credentials
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
