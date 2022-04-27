import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from "@patternfly/react-core";

import { EmptyTextMessage } from "@app/shared/components";

import { EFFORT_ESTIMATE_LIST, PROPOSED_ACTION_LIST } from "@app/Constants";
import { Application, Review } from "@app/api/models";

import { ApplicationTags } from "../application-tags";
import { ApplicationRisk } from "./application-risk";
import { useFetchReviews } from "@app/queries/reviews";

export interface IApplicationListExpandedAreaProps {
  application: Application;
  reviews: Review[];
}

export const ApplicationListExpandedArea: React.FC<
  IApplicationListExpandedAreaProps
> = ({ application, reviews }) => {
  const { t } = useTranslation();

  const notYetReviewed = (
    <EmptyTextMessage message={t("terms.notYetReviewed")} />
  );

  const [appReview, setAppReview] = useState<Review>();
  useEffect(() => {
    const appReview = reviews?.find(
      (review) => review.id === application?.review?.id
    );
    setAppReview(appReview);
  }, [reviews]);

  const reviewToShown = appReview
    ? {
        proposedAction: (
          <Label>
            {PROPOSED_ACTION_LIST[appReview.proposedAction]
              ? t(PROPOSED_ACTION_LIST[appReview.proposedAction].i18Key)
              : appReview.proposedAction}
          </Label>
        ),
        effortEstimate: EFFORT_ESTIMATE_LIST[appReview.effortEstimate]
          ? t(EFFORT_ESTIMATE_LIST[appReview.effortEstimate].i18Key)
          : appReview.effortEstimate,
        criticality: appReview.businessCriticality,
        workPriority: appReview.workPriority,
        comments: appReview.comments,
      }
    : {
        proposedAction: notYetReviewed,
        effortEstimate: notYetReviewed,
        criticality: notYetReviewed,
        workPriority: notYetReviewed,
        notYetReviewed: notYetReviewed,
        comments: notYetReviewed,
      };

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
        <DescriptionListTerm>{t("terms.proposedAction")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="proposed-action">
          {reviewToShown.proposedAction}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.effortEstimate")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="effort-estimate">
          {reviewToShown.effortEstimate}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("terms.businessCriticality")}
        </DescriptionListTerm>
        <DescriptionListDescription cy-data="business-criticality">
          {reviewToShown.criticality}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.workPriority")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="work-priority">
          {reviewToShown.workPriority}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.risk")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="risk">
          <ApplicationRisk application={application} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.reviewComments")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="review-comments">
          {reviewToShown.comments}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
