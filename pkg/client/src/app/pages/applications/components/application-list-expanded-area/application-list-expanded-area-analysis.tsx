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
import { stringify } from "yaml";
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

  const [isReport, setIsReport] = React.useState(false);
  const [isFailedTask, setIsFailedTask] = React.useState(false);

  const { identities, fetchIdentities } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  useEffect(() => {
    if (task?.state === "Succeeded") setIsReport(true);
    else if (task?.state === "Failed") setIsFailedTask(true);
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
            <Tooltip content="Click to view Analysis report">
              <Button variant="link" isInline>
                <Link
                  to={`/hub/applications/${application.id}/bucket/${task?.data?.output}/`}
                  target="_blank"
                >
                  Report
                </Link>
              </Button>
            </Tooltip>
          ) : isFailedTask ? (
            <Tooltip content="Click to dump task data to console log">
              <Button
                variant="link"
                isInline
                onClick={() => {
                  console.log(stringify(task));
                }}
              >
                Error
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
