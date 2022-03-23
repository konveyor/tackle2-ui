import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OkIcon } from "@patternfly/react-icons";
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";
import { Application, Task } from "@app/api/models";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { ApplicationTags } from "../application-tags";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import { getKindIDByRef } from "@app/utils/model-utils";
import { Link } from "react-router-dom";

export interface IApplicationListExpandedAreaProps {
  application: Application;
  task: Task | undefined;
}

export const ApplicationListExpandedAreaAnalysis: React.FC<
  IApplicationListExpandedAreaProps
> = ({ application, task }) => {
  const { t } = useTranslation();

  const [isReport, setIsReport] = React.useState(false);

  const { identities, fetchIdentities } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  useEffect(() => {
    if (task?.state === "Succeeded") setIsReport(true);
  }, [task]);

  let matchingSourceCredsRef;
  if (identities) {
    matchingSourceCredsRef = getKindIDByRef(identities, application, "source");
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
          {matchingSourceCredsRef ? (
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
          {isReport ? (
            <Button variant="link" isInline>
              <Link
                to={`/api/applications/${application.id}/bucket/`}
                target="_blank"
              >
                Report
              </Link>
            </Button>
          ) : (
            "Not available"
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
