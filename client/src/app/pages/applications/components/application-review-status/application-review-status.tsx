import React from "react";
import { Application, Archetype } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useTranslation } from "react-i18next";

export interface ApplicationReviewStatusProps {
  application: Application;
  archetypes?: Archetype[];
  isLoading?: boolean;
}

export const ApplicationReviewStatus: React.FC<
  ApplicationReviewStatusProps
> = ({ application, archetypes, isLoading = false }) => {
  const { t } = useTranslation();
  const isAppReviewed = !!application.review;

  const applicationArchetypes = application.archetypes?.map((archetypeRef) => {
    return archetypes?.find((archetype) => archetype.id === archetypeRef.id);
  });

  const reviewedArchetypeCount =
    applicationArchetypes?.filter((archetype) => !!archetype?.review).length ||
    0;

  let statusPreset: IconedStatusPreset;
  let tooltipCount = 0;

  if (isAppReviewed) {
    statusPreset = "Completed";
  } else if (reviewedArchetypeCount > 0) {
    statusPreset = "Inherited";
    tooltipCount = reviewedArchetypeCount;
  } else {
    statusPreset = "NotStarted";
  }

  if (isLoading) {
    return <Spinner size="md" />;
  }

  if (!applicationArchetypes || applicationArchetypes.length === 0) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }

  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
