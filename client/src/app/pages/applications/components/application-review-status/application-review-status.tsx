import React from "react";
import { Application } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useTranslation } from "react-i18next";
import { useFetchArchetypes } from "@app/queries/archetypes";

export interface ApplicationReviewStatusProps {
  application: Application;
  isLoading?: boolean;
}

export const ApplicationReviewStatus: React.FC<
  ApplicationReviewStatusProps
> = ({ application }) => {
  const { t } = useTranslation();

  const { archetypes, isFetching, error } = useFetchArchetypes();
  const isAppReviewed = !!application.review;

  const applicationArchetypes = application.archetypes?.map((archetypeRef) => {
    return archetypes?.find((archetype) => archetype.id === archetypeRef.id);
  });

  const reviewedArchetypeCount =
    applicationArchetypes?.filter((archetype) => !!archetype?.review).length ||
    0;

  if (error) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }

  if (isFetching) {
    return <Spinner size="md" />;
  }

  let statusPreset: IconedStatusPreset;
  let tooltipCount = 0;

  if (isAppReviewed) {
    statusPreset = "Completed";
  } else if (reviewedArchetypeCount > 0) {
    statusPreset = "InheritedReviews";
    tooltipCount = reviewedArchetypeCount;
  } else {
    statusPreset = "NotStarted";
  }

  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
