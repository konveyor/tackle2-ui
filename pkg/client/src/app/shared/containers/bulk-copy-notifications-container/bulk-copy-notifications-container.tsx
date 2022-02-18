import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import { alertActions } from "@app/store/alert";
import { RootState } from "@app/store/rootReducer";
import { bulkCopySelectors, bulkCopyActions } from "@app/store/bulkCopy";

import { useFetch } from "@app/shared/hooks";

import { BulkCopyAssessment, BulkCopyReview } from "@app/api/models";
import { getBulkCopyAssessment, getBulkCopyReview } from "@app/api/rest";

export const BulkCopyNotificationsContainer: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  const isWatching = useSelector((state: RootState) =>
    bulkCopySelectors.isWatching(state)
  );
  const assessmentBulkCopyId = useSelector((state: RootState) =>
    bulkCopySelectors.assessmentBulk(state)
  );
  const reviewBulkCopyId = useSelector((state: RootState) =>
    bulkCopySelectors.reviewBulk(state)
  );

  // Assessment
  const fetchAssessmentBulkCopy = useCallback(() => {
    return getBulkCopyAssessment(assessmentBulkCopyId!);
  }, [assessmentBulkCopyId]);

  const {
    data: assessmentBulkCopy,
    requestFetch: requestFetchAssessmentBulkCopy,
  } = useFetch<BulkCopyAssessment>({
    onFetch: fetchAssessmentBulkCopy,
  });

  // Review
  const fetchReviewBulkCopy = useCallback(() => {
    return getBulkCopyReview(reviewBulkCopyId!);
  }, [reviewBulkCopyId]);

  const { data: reviewBulkCopy, requestFetch: requestFetchReviewBulkCopy } =
    useFetch<BulkCopyReview>({
      onFetch: fetchReviewBulkCopy,
    });

  // Start watch
  useEffect(() => {
    if (isWatching === true && assessmentBulkCopyId) {
      requestFetchAssessmentBulkCopy({
        continueIf: (e: BulkCopyAssessment) => !e.completed,
      });
    }
  }, [isWatching, assessmentBulkCopyId, requestFetchAssessmentBulkCopy]);

  useEffect(() => {
    if (isWatching === true && reviewBulkCopyId) {
      requestFetchReviewBulkCopy({
        continueIf: (e: BulkCopyReview) => !e.completed,
      });
    }
  }, [isWatching, reviewBulkCopyId, requestFetchReviewBulkCopy]);

  // Complete watchs
  useEffect(() => {
    if (assessmentBulkCopy && assessmentBulkCopy.completed === true) {
      dispatch(bulkCopyActions.assessmentBulkCompleted({}));
    }
  }, [assessmentBulkCopy, dispatch]);

  useEffect(() => {
    if (reviewBulkCopy && reviewBulkCopy.completed === true) {
      dispatch(bulkCopyActions.reviewBulkCompleted({}));
    }
  }, [reviewBulkCopy, dispatch]);

  // Notification
  useEffect(() => {
    if (
      !isWatching &&
      assessmentBulkCopy?.completed === true &&
      (reviewBulkCopyId ? reviewBulkCopy?.completed === true : true)
    ) {
      dispatch(
        alertActions.addSuccess(
          reviewBulkCopyId
            ? t("toastr.success.assessmentAndReviewCopied")
            : t("toastr.success.assessmentCopied")
        )
      );
    }
  }, [
    isWatching,
    assessmentBulkCopy,
    reviewBulkCopy,
    reviewBulkCopyId,
    dispatch,
    t,
  ]);

  return <></>;
};
