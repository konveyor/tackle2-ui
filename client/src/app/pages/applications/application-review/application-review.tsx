import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import {
  Bullseye,
  Card,
  CardHeader,
  FormSection,
  Grid,
  GridItem,
  PageSection,
  Text,
  TextContent,
} from "@patternfly/react-core";
import BanIcon from "@patternfly/react-icons/dist/esm/icons/ban-icon";

import { Paths, ReviewRoute } from "@app/Paths";
import {
  getApplicationById,
  getAssessmentById,
  getAssessmentsByItemId,
  getReviewId,
} from "@app/api/rest";
import { Application, Assessment, Review } from "@app/api/models";
import { ApplicationReviewPage } from "./components/application-review-page";
import { ApplicationDetails } from "./components/application-details";
import { ReviewForm } from "./components/review-form";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useSetting } from "@app/queries/settings";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ApplicationAssessmentDonutChart } from "./components/application-assessment-donut-chart/application-assessment-donut-chart";

export const ApplicationReview: React.FC = () => {
  const { t } = useTranslation();

  const { pushNotification } = React.useContext(NotificationsContext);

  const history = useHistory();
  const { applicationId } = useParams<ReviewRoute>();

  // const { assessApplication, inProgress: isApplicationAssessInProgress } =
  //   useAssessApplication();

  const { data: reviewAssessmentSetting } = useSetting(
    "review.assessment.required"
  );

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
        getAssessmentsByItemId(false, applicationId),
        // getAssessmentsPromise({ applicationId: applicationId }),
        // getApplicationByIdPromise(applicationId),
        getApplicationById(applicationId),
      ])
        .then(([assessmentData, applicationData]) => {
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
            setAssessment(assessmentResponse);
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

  return (
    <>
      <ApplicationReviewPage>
        <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
          <Grid hasGutter>
            {application && (
              <GridItem md={5}>
                <div className="pf-v5-c-form">
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
          </Card>
        </PageSection>
      )}
    </>
  );
};
