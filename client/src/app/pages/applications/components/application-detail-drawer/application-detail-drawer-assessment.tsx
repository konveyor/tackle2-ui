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
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { EmptyTextMessage } from "@app/shared/components";
import { EFFORT_ESTIMATE_LIST, PROPOSED_ACTION_LIST } from "@app/Constants";
import { Assessment, Review, Task } from "@app/api/models";
import { ApplicationRisk } from "./application-risk";
import {
  ApplicationDetailDrawer,
  IApplicationDetailDrawerProps,
} from "./application-detail-drawer";

export interface IApplicationDetailDrawerAssessmentProps
  extends Pick<IApplicationDetailDrawerProps, "application" | "onCloseClick"> {
  reviews: Review[];
  assessment: Assessment | null;
  task: Task | undefined | null;
}

export const ApplicationDetailDrawerAssessment: React.FC<
  IApplicationDetailDrawerAssessmentProps
> = ({ application, onCloseClick, reviews, assessment, task }) => {
  const { t } = useTranslation();

  const appReview = reviews?.find(
    (review) => review.id === application?.review?.id
  );

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
            <DescriptionListGroup>
              <DescriptionListTerm>{t("terms.risk")}</DescriptionListTerm>
              <DescriptionListDescription cy-data="risk">
                {application && assessment && (
                  <ApplicationRisk
                    application={application}
                    assessment={assessment}
                  />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t("terms.migrationWave")}
              </DescriptionListTerm>
              <DescriptionListDescription cy-data="migration-wave">
                {application?.migrationWave
                  ? application.migrationWave.name
                  : t("terms.unassigned")}
              </DescriptionListDescription>
            </DescriptionListGroup>
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
