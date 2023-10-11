import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  FormSection,
  Grid,
  GridItem,
  PageSection,
  Text,
} from "@patternfly/react-core";
import BanIcon from "@patternfly/react-icons/dist/esm/icons/ban-icon";

import { Paths, ReviewRoute } from "@app/Paths";
import { ReviewForm } from "./components/review-form";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ApplicationAssessmentDonutChart } from "./components/application-assessment-donut-chart/application-assessment-donut-chart";
import QuestionnaireSummary, {
  SummaryType,
} from "@app/components/questionnaire-summary/questionnaire-summary";
import { PageHeader } from "@app/components/PageHeader";
import { useFetchReviewById } from "@app/queries/reviews";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { useFetchApplicationById } from "@app/queries/applications";
import { useFetchArchetypeById } from "@app/queries/archetypes";

const ReviewPage: React.FC = () => {
  const { t } = useTranslation();

  const { applicationId, archetypeId } = useParams<ReviewRoute>();
  const isArchetype = useIsArchetype();

  const { archetype } = useFetchArchetypeById(archetypeId);
  const { application } = useFetchApplicationById(applicationId);

  const { review, fetchError, isFetching } = useFetchReviewById(
    isArchetype ? archetype?.review?.id : application?.review?.id
  );
  const assessment = undefined;
  const breadcrumbs = [
    ...(isArchetype
      ? [
          {
            title: t("terms.archetypes"),
            path: Paths.archetypes,
          },
        ]
      : [
          {
            title: t("terms.applications"),
            path: Paths.applications,
          },
        ]),
    // {
    //   title: t("terms.review"),
    //   path: Paths.applicationsReview,
    // },
  ];

  if (fetchError) {
    return (
      <>
        <PageSection variant="light">
          <PageHeader
            title={t("terms.review")}
            description={
              <Text component="p">{t("message.reviewInstructions")}</Text>
            }
            breadcrumbs={breadcrumbs}
          />
        </PageSection>
        <PageSection variant="light">
          <Bullseye>
            <SimpleEmptyState
              icon={BanIcon}
              title={t("message.couldNotFetchTitle")}
              description={t("message.couldNotFetchBody") + "."}
            />
          </Bullseye>
        </PageSection>
      </>
    );
  }
  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={t("terms.review")}
          description={
            <Text component="p">{t("message.reviewInstructions")}</Text>
          }
          breadcrumbs={breadcrumbs}
        />
      </PageSection>
      <PageSection variant="light">
        <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
          <Grid hasGutter>
            <GridItem md={5}>
              <div className="pf-v5-c-form">
                {/* <FormSection>
                  <ApplicationDetails
                    application={application}
                    assessment={assessment}
                  />
                </FormSection> */}
                <FormSection>
                  <ReviewForm
                    review={review}
                    application={application}
                    archetype={archetype}
                  />
                </FormSection>
              </div>
            </GridItem>
            {assessment && (
              <GridItem md={6}>
                <ApplicationAssessmentDonutChart assessment={assessment} />
              </GridItem>
            )}
          </Grid>
        </ConditionalRender>
        {assessment && (
          <QuestionnaireSummary
            summaryData={assessment}
            summaryType={SummaryType.Assessment}
          />
        )}
      </PageSection>
    </>
  );
};
export default ReviewPage;
