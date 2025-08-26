import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

import type { Archetype, TargetProfile } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  ARCHETYPES_QUERY_KEY,
  ARCHETYPE_QUERY_KEY,
  useCreateArchetypeMutation,
  useUpdateArchetypeMutation,
  useDeleteArchetypeMutation,
} from "@app/queries/archetypes";
import { useDeleteAssessmentMutation } from "@app/queries/assessments";
import { useDeleteReviewMutation } from "@app/queries/reviews";
import { getAxiosErrorMessage } from "@app/utils/utils";

export interface UseArchetypeMutationsOptions {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
}

export const useArchetypeMutations = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: UseArchetypeMutationsOptions = {}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const queryClient = useQueryClient();

  // Common error handler
  const onError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail();
  };

  // Create archetype success handler
  const onCreateSuccess = (archetype: Archetype) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.archetype"),
        what: archetype.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  // Update archetype success handler
  const onUpdateSuccess = (_id: number) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.archetype"),
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  // Delete archetype success handler
  const onDeleteSuccess = (archetypeDeleted: Archetype) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: archetypeDeleted.name,
        type: t("terms.archetype"),
      }),
      variant: "success",
    });
  };

  // Delete review success handler
  const onDeleteReviewSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.reviewDiscarded", {
        application: name,
      }),
      variant: "success",
    });
  };

  // Mutations
  const { mutate: createArchetype } = useCreateArchetypeMutation(
    onCreateSuccess,
    onError
  );

  const { mutate: updateArchetype } = useUpdateArchetypeMutation(
    onUpdateSuccess,
    onError
  );

  const { mutate: deleteArchetype } = useDeleteArchetypeMutation(
    onDeleteSuccess,
    onError
  );

  const { mutateAsync: deleteAssessment } = useDeleteAssessmentMutation();
  const { mutateAsync: deleteReview } = useDeleteReviewMutation(
    onDeleteReviewSuccess,
    onError
  );

  // Discard assessment function
  const discardAssessment = (archetype: Archetype) => {
    if (!archetype.assessments) {
      return;
    }
    Promise.all(
      archetype.assessments.map((assessment) =>
        deleteAssessment({
          assessmentId: assessment.id,
          archetypeId: archetype.id,
        })
      )
    )
      .then(() => {
        pushNotification({
          title: t("toastr.success.assessmentDiscarded", {
            application: archetype.name,
          }),
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [ARCHETYPE_QUERY_KEY, String(archetype.id)],
        });
      })
      .catch((error) => {
        console.error("Error while deleting assessments:", error);
        pushNotification({
          title: getAxiosErrorMessage(error as AxiosError),
          variant: "danger",
        });
      });
  };

  // Discard review function
  const discardReview = (archetype: Archetype) => {
    if (!archetype.review?.id) {
      return;
    }
    deleteReview({
      id: archetype.review.id,
      name: archetype.name,
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [ARCHETYPE_QUERY_KEY, String(archetype.id)],
        });
      })
      .catch((error) => {
        console.error("Error while deleting review:", error);
        pushNotification({
          title: getAxiosErrorMessage(error as AxiosError),
          variant: "danger",
        });
      });
  };

  // Target profile function
  const addTargetProfile = (archetype: Archetype, profile: TargetProfile) => {
    const updatedProfiles = archetype.profiles
      ? [...archetype.profiles, profile]
      : [profile];
    updateArchetype({ ...archetype, profiles: updatedProfiles });
  };

  const updateTargetProfile = (
    archetype: Archetype,
    profile: TargetProfile
  ) => {
    const updatedProfiles = archetype.profiles?.map((p) =>
      p.id === profile.id ? profile : p
    );
    updateArchetype({ ...archetype, profiles: updatedProfiles });
  };

  const deleteTargetProfile = (
    archetype: Archetype,
    profile: TargetProfile
  ) => {
    const updatedProfiles = archetype.profiles?.filter(
      (p) => p.id !== profile.id
    );
    updateArchetype({ ...archetype, profiles: updatedProfiles });
  };

  return {
    createArchetype,
    updateArchetype,
    deleteArchetype,
    discardAssessment,
    discardReview,
    addTargetProfile,
    updateTargetProfile,
    deleteTargetProfile,
  };
};
