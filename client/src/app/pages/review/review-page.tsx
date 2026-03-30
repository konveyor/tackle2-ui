import * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  FormSection,
  Grid,
  GridItem,
  PageSection,
} from "@patternfly/react-core";
import { BanIcon } from "@patternfly/react-icons";

import { Paths, ReviewRoute } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { PageHeader } from "@app/components/PageHeader";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { useFetchApplicationById } from "@app/queries/applications";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import { useFetchReviewById } from "@app/queries/reviews";

import { ApplicationAssessmentDonutChart } from "../../components/application-assessment-donut-chart/application-assessment-donut-chart";
import { IdentifiedRisksTable } from "../reports/components/identified-risks-table";

import { ReviewForm } from "./components/review-form";

const ReviewPage: React.FC = () => {
  const { t } = useTranslation();

  const { applicationId, archetypeId } = useParams<ReviewRoute>();
  const isArchetype = useIsArchetype();

  const { archetype } = useFetchArchetypeById(archetypeId);
  const { application } = useFetchApplicationById(applicationId);

  const { review, fetchError, isFetching } = useFetchReviewById(
    isArchetype ? archetype?.review?.id : application?.review?.id
  );
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
    {
      title: t("terms.review"),
      path: Paths.applicationsReview,
    },
  ];

  if (fetchError) {
    return (
      <>
        <PageSection variant="default">
          <PageHeader
            title={t("terms.review")}
            description={
              <Content component={ContentVariants.p}>
                {t("message.reviewInstructions")}
              </Content>
            }
            breadcrumbs={breadcrumbs}
          />
        </PageSection>
        <PageSection variant="default">
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
      <PageSection variant="default">
        <PageHeader
          title={t("terms.review")}
          description={
            <Content component={ContentVariants.p}>
              {t("message.reviewInstructions")}
            </Content>
          }
          breadcrumbs={breadcrumbs}
        />
      </PageSection>
      <PageSection>
        <Card>
          <CardBody>
            <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
              <Grid hasGutter>
                <GridItem md={5}>
                  <div className="pf-v6-c-form">
                    <FormSection>
                      <ReviewForm
                        review={review}
                        application={application}
                        archetype={archetype}
                      />
                    </FormSection>
                  </div>
                </GridItem>
                {application?.assessments?.length ||
                archetype?.assessments?.length ? (
                  <GridItem md={6}>
                    <ApplicationAssessmentDonutChart
                      assessmentRefs={
                        application?.assessments || archetype?.assessments
                      }
                    />
                  </GridItem>
                ) : null}
              </Grid>
            </ConditionalRender>
          </CardBody>
        </Card>
      </PageSection>
      {application?.assessments?.length || archetype?.assessments?.length ? (
        <PageSection>
          <Card>
            <CardHeader>
              <CardTitle>
                <Content component="h3">{t("terms.assessmentSummary")}</Content>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <IdentifiedRisksTable
                assessmentRefs={
                  application?.assessments || archetype?.assessments
                }
                isReviewPage
              />
            </CardBody>
          </Card>
        </PageSection>
      ) : null}
    </>
  );
};
export default ReviewPage;
