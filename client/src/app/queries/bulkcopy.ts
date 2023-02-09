import { useMutation, useQuery } from "@tanstack/react-query";
import { Application, Assessment, Review } from "@app/api/models";
import {
  createBulkCopyAssessment,
  createBulkCopyReview,
  getBulkCopyAssessment,
} from "@app/api/rest";
import React from "react";
import { NotificationsContext } from "@app/shared/notifications-context";
import { AxiosError } from "axios";

export const BulkCopyProgressQueryKey = "bulkcopyprogress";
export const useCreateBulkCopyMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess: (res: any) => void;
  onError: (err: AxiosError) => void;
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);
  const {
    data: mutationResult,
    mutate,
    isLoading: isBulkCopyLoading,
    reset,
  } = useMutation(
    ({
      assessment,
      selectedApps,
      review,
    }: {
      assessment: Assessment;
      selectedApps: Application[];
      review?: Review;
    }) =>
      createBulkCopyAssessment({
        fromAssessmentId: assessment.id || 0,
        applications:
          selectedApps?.map((f) => ({ applicationId: f.id! })) || [],
      })
        .then((bulkAssessment) => {
          const bulkReview = review
            ? createBulkCopyReview({
                sourceReview: review!.id!,
                targetApplications: selectedApps.map((f) => f.id!),
              })
            : undefined;
          return Promise.all([bulkAssessment, bulkReview]);
        })
        .then(([assessmentBulk, reviewBulk]) => {
          return {
            assessmentBulk,
            reviewBulk,
            hasReview: !!review,
          };
        }),
    {
      onError: (error: AxiosError) => {
        console.error(error);
        onError(error);
      },
    }
  );

  const assessmentBulkResult = mutationResult?.assessmentBulk.data || null;

  const reviewBulkResult = mutationResult?.reviewBulk || null;

  const hasReview = mutationResult?.hasReview;

  //Fetch until assessment bulk copy is complete
  const { data: assessmentData, isLoading: isBulkCopyAssessmentLoading } =
    useQuery(
      [BulkCopyProgressQueryKey, assessmentBulkResult?.bulkId],
      getBulkCopyAssessment,
      {
        onSuccess: (res) => {
          // Checks that both the
          // - bulk review request
          // and
          // - bulk assessment copy request
          // are successful. Bubbles a success event if so.

          const hasSuccessfulReviewCopy = reviewBulkResult?.status === 204;
          if (
            res?.data.completed &&
            (hasReview ? hasSuccessfulReviewCopy : true)
          ) {
            reset();
            onSuccess(hasSuccessfulReviewCopy);
          }
        },
        onError: (error: AxiosError) => {
          console.error(error);
          pushNotification({
            title: "Failed",
            message: "Copy assessment failed.",
            variant: "danger",
          });

          reset();
          onError(error);
        },
        enabled: assessmentBulkResult !== null,
        refetchInterval: isBulkCopyLoading ? false : 1000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: false,
      }
    );

  return {
    mutate,
    assessmentData,
    isCopying:
      isBulkCopyLoading ||
      isBulkCopyAssessmentLoading ||
      !!assessmentBulkResult?.bulkId,
  };
};
