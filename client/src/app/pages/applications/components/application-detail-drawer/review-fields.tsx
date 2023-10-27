import React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Title,
  TextContent,
} from "@patternfly/react-core";
import { Application, Review } from "@app/api/models";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useFetchReviewById, useFetchReviews } from "@app/queries/reviews";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PROPOSED_ACTION_LIST, EFFORT_ESTIMATE_LIST } from "@app/Constants";

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

  const reviewedArchetypes = application?.archetypes
    ?.map((archetypeRef) => {
      return archetypes.find((archetype) => archetype.id === archetypeRef.id);
    })
    .filter(Boolean);

  const hasReviewedArchetype = reviewedArchetypes?.some(
    (archetype) => !!archetype?.review
  );

  const matchedArchetypeReviews: Review[] = (reviewedArchetypes || [])
    .map((reviewedArchetype) => {
      return reviews.find(
        (review) => review.id === reviewedArchetype?.review?.id
      );
    })
    .filter(Boolean);

  const groupedReviewList = [
    {
      review: appReview,
      name: appReview?.application?.name,
      type: "App",
    },
    ...matchedArchetypeReviews.map((archetypeReview) => ({
      review: archetypeReview,
      name: archetypeReview?.archetype?.name,
      type: "Archetype",
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
          {groupedReviewList.length > 0
            ? groupedReviewList.map((item, index) => (
                <Label key={index} className={spacing.mbSm}>
                  {item.type === "App"
                    ? `App - ${item.name}`
                    : item.type === "Archetype"
                    ? `Archetype - ${item.name}`
                    : "Unknown"}
                  -{" "}
                  {item.review?.proposedAction &&
                  PROPOSED_ACTION_LIST[item.review?.proposedAction]
                    ? t(PROPOSED_ACTION_LIST[item.review.proposedAction].i18Key)
                    : "Unknown"}
                </Label>
              ))
            : notYetReviewed}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.effortEstimate")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="effort-estimate">
          {groupedReviewList.length > 0
            ? groupedReviewList.map((item, index) => (
                <Label key={index} className={spacing.mbSm}>
                  {item.type === "App"
                    ? `App - ${item.name}`
                    : item.type === "Archetype"
                    ? `Archetype - ${item.name}`
                    : "Unknown"}
                  -{"  "}{" "}
                  {item.review?.effortEstimate &&
                  EFFORT_ESTIMATE_LIST[item.review?.effortEstimate]
                    ? t(EFFORT_ESTIMATE_LIST[item.review.effortEstimate].i18Key)
                    : "Unknown"}
                </Label>
              ))
            : notYetReviewed}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("terms.businessCriticality")}
        </DescriptionListTerm>
        <DescriptionListDescription cy-data="business-criticality">
          {groupedReviewList.length > 0
            ? groupedReviewList.map((item, index) => (
                <Label key={index} className={spacing.mbSm}>
                  {item.type === "App"
                    ? `App - ${item.name}`
                    : item.type === "Archetype"
                    ? `Archetype - ${item.name}`
                    : "Unknown"}
                  -{"  "} {item?.review?.businessCriticality || notYetReviewed}
                </Label>
              ))
            : notYetReviewed}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.workPriority")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="work-priority">
          {groupedReviewList.length > 0
            ? groupedReviewList.map((item, index) => (
                <Label key={index} className={spacing.mbSm}>
                  {item.type === "App"
                    ? `App - ${item.name}`
                    : item.type === "Archetype"
                    ? `Archetype - ${item.name}`
                    : "Unknown"}
                  -{"  "}
                  {item?.review?.workPriority || notYetReviewed}
                </Label>
              ))
            : notYetReviewed}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.comments")}</DescriptionListTerm>
        <DescriptionListDescription cy-data="comments">
          {groupedReviewList.length > 0
            ? groupedReviewList.map((item, index) => (
                <>
                  {item?.review?.comments ? (
                    <Label key={index} className={spacing.mbSm}>
                      {item.type === "App"
                        ? `App - ${item.name}`
                        : item.type === "Archetype"
                        ? `Archetype - ${item.name}`
                        : "Unknown"}
                      -{"  "}
                      {item?.review?.comments || " - "}
                    </Label>
                  ) : (
                    "-"
                  )}
                </>
              ))
            : notYetReviewed}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};
