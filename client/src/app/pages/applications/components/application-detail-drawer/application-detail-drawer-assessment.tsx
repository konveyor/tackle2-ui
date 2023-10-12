import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  TextContent,
  Text,
  Title,
  Label,
  LabelGroup,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { EFFORT_ESTIMATE_LIST, PROPOSED_ACTION_LIST } from "@app/Constants";
import { Ref, Task } from "@app/api/models";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";
import { useFetchReviewById } from "@app/queries/reviews";
import { ReviewedArchetypeItem } from "./reviewed-archetype-item";

export interface IApplicationDetailDrawerAssessmentProps
  extends Pick<IApplicationDetailDrawerProps, "application" | "onCloseClick"> {
  task: Task | undefined | null;
}

export const ApplicationDetailDrawerAssessment: React.FC<
  IApplicationDetailDrawerAssessmentProps
> = ({ application, onCloseClick, task }) => {
  const { t } = useTranslation();

  const { review: appReview } = useFetchReviewById(application?.review?.id);
  const notYetReviewed = (
    <EmptyTextMessage message={t("terms.notYetReviewed")} />
  );

  return (
    <ApplicationDetailDrawer
      application={application}
      task={task}
      onCloseClick={onCloseClick}
      detailsTabMainContent={
        <>
          <Title headingLevel="h3" size="md">
            {t("terms.archetypes")}
          </Title>
          <DescriptionList
            isHorizontal
            isCompact
            columnModifier={{ default: "1Col" }}
            horizontalTermWidthModifier={{
              default: "14ch",
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.associatedArchetypes")}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {application?.archetypes?.length ?? 0 > 0 ? (
                  <ArchetypeLabels
                    archetypeRefs={application?.archetypes as Ref[]}
                  />
                ) : (
                  <EmptyTextMessage message={t("terms.none")} />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.archetypesReviewed")}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {application?.archetypes?.length ?? 0 > 0 ? (
                  application?.archetypes?.map((archetypeRef) => (
                    <ReviewedArchetypeItem
                      key={archetypeRef.id}
                      id={archetypeRef.id}
                    />
                  ))
                ) : (
                  <EmptyTextMessage message={t("terms.none")} />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <TextContent className={spacing.mtLg}>
              <Title headingLevel="h3" size="md">
                {t("terms.applicationReview")}
              </Title>
            </TextContent>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.proposedAction")}
              </DescriptionListTerm>
              <DescriptionListDescription cy-data="proposed-action">
                {appReview ? (
                  <Label>
                    {PROPOSED_ACTION_LIST[appReview.proposedAction]
                      ? t(PROPOSED_ACTION_LIST[appReview.proposedAction].i18Key)
                      : appReview.proposedAction}
                  </Label>
                ) : (
                  notYetReviewed
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.effortEstimate")}
              </DescriptionListTerm>
              <DescriptionListDescription cy-data="effort-estimate">
                {appReview
                  ? EFFORT_ESTIMATE_LIST[appReview.effortEstimate]
                    ? t(EFFORT_ESTIMATE_LIST[appReview.effortEstimate].i18Key)
                    : appReview.effortEstimate
                  : notYetReviewed}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.businessCriticality")}
              </DescriptionListTerm>
              <DescriptionListDescription cy-data="business-criticality">
                {appReview?.businessCriticality || notYetReviewed}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.workPriority")}
              </DescriptionListTerm>
              <DescriptionListDescription cy-data="work-priority">
                {appReview?.workPriority || notYetReviewed}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {/* <DescriptionListGroup>
              <DescriptionListTerm>{t("terms.risk")}</DescriptionListTerm>
              <DescriptionListDescription cy-data="risk">
                {application && <ApplicationRisk application={application} />}
              </DescriptionListDescription>
            </DescriptionListGroup> */}
          </DescriptionList>
          <TextContent className={spacing.mtLg}>
            <Title headingLevel="h3" size="md">
              {t("terms.reviewComments")}
            </Title>
            <Text component="small" cy-data="review-comments">
              {appReview?.comments || notYetReviewed}
            </Text>
            <Title headingLevel="h3" size="md">
              {t("terms.comments")}
            </Title>
            <Text component="small" cy-data="comments">
              {application?.comments || (
                <EmptyTextMessage message={t("terms.notAvailable")} />
              )}
            </Text>
          </TextContent>
        </>
      }
    />
  );
};
const ArchetypeLabels: React.FC<{ archetypeRefs?: Ref[] }> = ({
  archetypeRefs,
}) =>
  (archetypeRefs?.length ?? 0) === 0 ? null : (
    <LabelGroup>
      {(archetypeRefs as Ref[])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ref) => (
          <Label color="grey" key={ref.id}>
            {ref.name}
          </Label>
        ))}
    </LabelGroup>
  );
