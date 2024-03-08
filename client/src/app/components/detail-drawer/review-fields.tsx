import React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Application, Archetype, Review } from "@app/api/models";
import { useFetchReviewById } from "@app/queries/reviews";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchReviews } from "@app/queries/reviews";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PROPOSED_ACTION_LIST, EFFORT_ESTIMATE_LIST } from "@app/Constants";
import { ReviewLabel } from "./review-label";

export type ReviewDrawerLabelItem = {
  review?: Review | null;
  name?: string | null;
  isArchetype?: boolean;
};

export const ReviewFields: React.FC<{
  application?: Application | null;
  archetype?: Archetype | null;
  reviews?: Review[];
}> = ({ application, archetype }) => {
  const { archetypes } = useFetchArchetypes();
  const { t } = useTranslation();

  const { reviews } = useFetchReviews();
  const { review: appReview } = useFetchReviewById(application?.review?.id);
  const { review: archetypeReview } = useFetchReviewById(archetype?.review?.id);

  const notYetReviewed = (
    <EmptyTextMessage message={t("terms.notYetReviewed")} />
  );

  const applicationArchetypes = application?.archetypes
    ?.map((archetypeRef) => {
      return archetypes.find((archetype) => archetype.id === archetypeRef.id);
    })
    .filter(Boolean);

  const matchedArchetypeReviews: Review[] = (applicationArchetypes || [])
    .map((archetype) => {
      return reviews?.find((review) => review.id === archetype?.review?.id);
    })
    .filter(Boolean);

  const groupedReviewList: ReviewDrawerLabelItem[] = [
    ...(archetypeReview && !appReview
      ? [
          {
            review: archetypeReview,
            name: archetypeReview?.archetype?.name,
            isArchetype: true,
          },
        ]
      : []),
    ...(appReview
      ? [
          {
            review: appReview,
            name: appReview?.application?.name,
            isArchetype: false,
          },
        ]
      : matchedArchetypeReviews.map((archetypeReview) => ({
          review: archetypeReview,
          name: archetypeReview?.archetype?.name,
          isArchetype: true,
        }))),
  ].filter((item) => item.review?.proposedAction);

  return (
    <div className={spacing.mtMd}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.proposedAction")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="proposed-action">
          {groupedReviewList.length === 0
            ? notYetReviewed
            : groupedReviewList.map((item, index) => {
                const labelText =
                  item.review?.proposedAction &&
                  PROPOSED_ACTION_LIST[item.review?.proposedAction]
                    ? t(PROPOSED_ACTION_LIST[item.review.proposedAction].i18Key)
                    : "Unknown";
                return (
                  <ReviewLabel key={index} item={item} labelText={labelText} />
                );
              })}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.effortEstimate")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="effort-estimate">
          {groupedReviewList.length === 0
            ? notYetReviewed
            : groupedReviewList.map((item, index) => {
                const labelText =
                  item.review?.effortEstimate &&
                  EFFORT_ESTIMATE_LIST[item.review?.effortEstimate]
                    ? t(EFFORT_ESTIMATE_LIST[item.review.effortEstimate].i18Key)
                    : "Unknown";
                return (
                  <ReviewLabel key={index} item={item} labelText={labelText} />
                );
              })}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("terms.businessCriticality")}
        </DescriptionListTerm>
        <DescriptionListDescription cy-data="business-criticality">
          {groupedReviewList.length === 0
            ? notYetReviewed
            : groupedReviewList.map((item, index) => {
                const labelText = item?.review?.businessCriticality;
                return (
                  <ReviewLabel key={index} item={item} labelText={labelText} />
                );
              })}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.workPriority")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="work-priority">
          {groupedReviewList.length === 0
            ? notYetReviewed
            : groupedReviewList.map((item, index) => {
                const labelText = item?.review?.workPriority;
                return (
                  <ReviewLabel key={index} item={item} labelText={labelText} />
                );
              })}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.comments")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="comments">
          {groupedReviewList.length === 0
            ? notYetReviewed
            : groupedReviewList.map((item, index) => {
                return (
                  <ReviewLabel
                    key={index}
                    item={item}
                    labelText={item.review?.comments}
                  />
                );
              })}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </div>
  );
};
