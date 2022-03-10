import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OkIcon } from "@patternfly/react-icons";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import { Application } from "@app/api/models";

import { ApplicationTags } from "../application-tags";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import { getKindIDByRef } from "@app/utils/model-utils";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export interface IApplicationListExpandedAreaProps {
  application: Application;
}

export const ApplicationListExpandedAreaAnalysis: React.FC<
  IApplicationListExpandedAreaProps
> = ({ application }) => {
  const { t } = useTranslation();
  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
    fetchIdentities,
  } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

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
            <>N/A</>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
