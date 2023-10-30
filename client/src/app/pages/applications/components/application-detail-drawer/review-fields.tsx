import React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  TextContent,
} from "@patternfly/react-core";
import { Application, Review } from "@app/api/models";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useFetchReviewById, useFetchReviews } from "@app/queries/reviews";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PROPOSED_ACTION_LIST, EFFORT_ESTIMATE_LIST } from "@app/Constants";
import { ReviewLabel } from "./review-label";

export type ReviewDrawerLabelItem = {
  review?: Review | null;
  name?: string | null;
  isArchetype?: boolean;
};

export const ReviewFields: React.FC<{ application: Application | null }> = ({
  application,
}) => {
  const { archetypes } = useFetchArchetypes();
  const { reviews } = useFetchReviews();
  const { t } = useTranslation();

  const { review: appReview } = useFetchReviewById(application?.review?.id);

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
      return reviews.find((review) => review.id === archetype?.review?.id);
    })
    .filter(Boolean);

  const groupedReviewList: ReviewDrawerLabelItem[] = [
    {
      review: appReview,
      name: appReview?.application?.name,
      isArchetype: false,
    },
    ...matchedArchetypeReviews.map((archetypeReview) => ({
      review: archetypeReview,
      name: archetypeReview?.archetype?.name,
      isArchetype: true,
    })),
  ].filter((item) => item.review?.proposedAction);

  return (
    <>
      <TextContent className={spacing.mtLg}>
        <Title headingLevel="h3" size="md">
          {t("terms.review")}
        </Title>
      </TextContent>
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
                const labelText = item?.review?.comments;
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
    </>
  );
};
