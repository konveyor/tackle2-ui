import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OkIcon } from "@patternfly/react-icons";
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Tooltip,
} from "@patternfly/react-core";
import { Link } from "react-router-dom";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Application, Task } from "@app/api/models";
import { ApplicationTags } from "../application-tags";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import { getKindIDByRef } from "@app/utils/model-utils";

export interface IApplicationListExpandedAreaProps {
  application: Application;
  task: Task | undefined;
}

export const ApplicationListExpandedAreaAnalysis: React.FC<
  IApplicationListExpandedAreaProps
> = ({ application, task }) => {
  const { t } = useTranslation();

  const { identities, fetchIdentities } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  let matchingSourceCredsRef;
  let matchingMavenCredsRef;
  if (identities) {
    matchingSourceCredsRef = getKindIDByRef(identities, application, "source");
    matchingMavenCredsRef = getKindIDByRef(identities, application, "maven");
  }

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
          {matchingSourceCredsRef && matchingMavenCredsRef ? (
            <>
              <OkIcon color="green"></OkIcon>
              <span className={spacing.mlSm}>(Source and Maven)</span>
            </>
          ) : matchingMavenCredsRef ? (
            <>
              <OkIcon color="green"></OkIcon>
              <span className={spacing.mlSm}>(Maven)</span>
            </>
          ) : matchingSourceCredsRef ? (
            <>
              <OkIcon color="green"></OkIcon>
              <span className={spacing.mlSm}>(Source)</span>
            </>
          ) : (
            "Not available"
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.analysis")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="analysis">
          {task?.state === "Succeeded" ? (
            <Tooltip content="Click to view Analysis report">
              <Button variant="link" isInline>
                <Link
                  to={`/hub/applications/${application.id}/bucket${task?.data?.output}`}
                  target="_blank"
                >
                  Report
                </Link>
              </Button>
            </Tooltip>
          ) : (
            "Not available"
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
