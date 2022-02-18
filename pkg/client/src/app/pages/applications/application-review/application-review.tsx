import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";

import {
  Bullseye,
  Button,
  Card,
  CardHeader,
  FormSection,
  Grid,
  GridItem,
  PageSection,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { BanIcon } from "@patternfly/react-icons/dist/esm/icons/ban-icon";
import { InfoCircleIcon } from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

import {
  AppPlaceholder,
  ConditionalRender,
  SimpleEmptyState,
} from "@app/shared/components";
import { useAssessApplication } from "@app/shared/hooks";

import { formatPath, Paths, ReviewRoute } from "@app/Paths";

import {
  getApplicationById,
  getAssessmentById,
  getAssessments,
  getReviewId,
} from "@app/api/rest";
import { Application, Assessment, Review } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationReviewPage } from "./components/application-review-page";
import { ApplicationDetails } from "./components/application-details";
import { ReviewForm } from "./components/review-form";
import { ApplicationAssessmentDonutChart } from "./components/application-assessment-donut-chart";
import { ApplicationAssessmentSummaryTable } from "./components/application-assessment-summary-table";

export const ApplicationReview: React.FC = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const history = useHistory();
  const { applicationId } = useParams<ReviewRoute>();

  const { assessApplication, inProgress: isApplicationAssessInProgress } =
    useAssessApplication();

  // Application and review

  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<AxiosError>();

  const [application, setApplication] = useState<Application>();
  const [review, setReview] = useState<Review>();
  const [assessment, setAssessment] = useState<Assessment>();

  // Start fetch

  useEffect(() => {
    if (applicationId) {
      setIsFetching(true);

      Promise.all([
        getAssessments({ applicationId: applicationId }),
        getApplicationById(applicationId),
      ])
        .then(([{ data: assessmentData }, { data: applicationData }]) => {
          setApplication(applicationData);

          const assessment = assessmentData[0]
            ? getAssessmentById(assessmentData[0].id!)
            : undefined;
          const review = applicationData.review
            ? getReviewId(applicationData.review.id!)
            : undefined;

          return Promise.all([assessment, review]);
        })
        .then(([assessmentResponse, reviewResponse]) => {
          if (assessmentResponse) {
            setAssessment(assessmentResponse.data);
          }
          if (reviewResponse) {
            setReview(reviewResponse.data);
          }

          setIsFetching(false);
          setFetchError(undefined);
        })
        .catch((error) => {
          setIsFetching(false);
          setFetchError(error);
        });
    }
  }, [applicationId]);

  const redirectToApplications = () => {
    history.push(Paths.applications);
  };

  const startApplicationAssessment = () => {
    if (!application) {
      console.log("Can not assess without an application");
      return;
    }

    assessApplication(
      application,
      (assessment: Assessment) => {
        history.push(
          formatPath(Paths.applicationsAssessment, {
            assessmentId: assessment.id,
          })
        );
      },
      (error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      }
    );
  };

  if (fetchError) {
    return (
      <ApplicationReviewPage>
        <Bullseye>
          <SimpleEmptyState
            icon={BanIcon}
            title={t("message.couldNotFetchTitle")}
            description={t("message.couldNotFetchBody") + "."}
          />
        </Bullseye>
      </ApplicationReviewPage>
    );
  }

  if (
    !isFetching &&
    (!assessment || (assessment && assessment.status !== "COMPLETE"))
  ) {
    return (
      <ApplicationReviewPage>
        <Bullseye>
          <SimpleEmptyState
            icon={InfoCircleIcon}
            title={t("message.appNotAssesedTitle")}
            description={t("message.appNotAssessedBody") + "."}
            primaryAction={
              <>
                {application && (
                  <Button
                    variant="primary"
                    isDisabled={isApplicationAssessInProgress}
                    isLoading={isApplicationAssessInProgress}
                    onClick={startApplicationAssessment}
                  >
                    {t("actions.assess")}
                  </Button>
                )}
              </>
            }
          />
        </Bullseye>
      </ApplicationReviewPage>
    );
  }

  return (
    <>
      <ApplicationReviewPage>
        <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
          <Grid hasGutter>
            {application && (
              <GridItem md={5}>
                <div className="pf-c-form">
                  <FormSection>
                    <ApplicationDetails
                      application={application}
                      assessment={assessment}
                    />
                  </FormSection>
                  <FormSection>
                    <ReviewForm
                      application={application}
                      review={review}
                      onSaved={redirectToApplications}
                      onCancel={redirectToApplications}
                    />
                  </FormSection>
                </div>
              </GridItem>
            )}
            {assessment && (
              <GridItem md={6}>
                <ApplicationAssessmentDonutChart assessment={assessment} />
              </GridItem>
            )}
          </Grid>
        </ConditionalRender>
      </ApplicationReviewPage>
      {assessment && (
        <PageSection>
          <Card>
            <CardHeader>
              <TextContent>
                <Text component="h3">{t("terms.assessmentSummary")}</Text>
              </TextContent>
            </CardHeader>
            <ApplicationAssessmentSummaryTable assessment={assessment} />
          </Card>
        </PageSection>
      )}
    </>
  );
};
