import { useCallback, useContext } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { AnalysisProfile, New, Ref, UploadFile } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateAnalysisProfileMutation,
  useUpdateAnalysisProfileMutation,
} from "@app/queries/analysis-profiles";
import { useFetchIdentities } from "@app/queries/identities";
import {
  buildAnalysisProfile,
  fromProfileWizardState,
} from "@app/utils/analysis-profiles";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { WizardState } from "./useWizardReducer";

const uploadFilesToRefs = (files: UploadFile[]): Ref[] => {
  return files
    .map(
      ({ fileId, fileName }) =>
        fileId && {
          id: fileId,
          name: fileName,
        }
    )
    .filter(Boolean);
};

export const useAnalysisProfileMutations = () => {
  const { t } = useTranslation();
  const { pushNotification } = useContext(NotificationsContext);
  const { identities } = useFetchIdentities();

  const { mutateAsync: create } = useCreateAnalysisProfileMutation(
    (profile: AnalysisProfile) => {
      pushNotification({
        title: t("toastr.success.analysisProfileCreated", {
          name: profile.name,
        }),
        variant: "success",
      });
    },
    (error: AxiosError, errorPayload: New<AnalysisProfile>) => {
      if (error.response?.status === 409) {
        pushNotification({
          title: t("toastr.fail.duplicateAnalysisProfileName", {
            name: errorPayload.name,
          }),
          variant: "danger",
        });
      } else {
        pushNotification({
          title: t("toastr.fail.createAnalysisProfile"),
          message: getAxiosErrorMessage(error),
          variant: "danger",
        });
      }
    }
  );

  const createAnalysisProfile = useCallback(
    async (wizardState: WizardState) => {
      const newProfile = buildAnalysisProfile(
        fromProfileWizardState(wizardState),
        uploadFilesToRefs(wizardState.customRules.customRulesFiles),
        identities
      );
      return create(newProfile);
    },
    [create, identities]
  );

  const { mutateAsync: update } = useUpdateAnalysisProfileMutation(
    (profile: AnalysisProfile) => {
      pushNotification({
        title: t("toastr.success.analysisProfileUpdated", {
          name: profile.name,
        }),
        variant: "success",
      });
    },
    (error: AxiosError, errorPayload: AnalysisProfile) => {
      if (error.response?.status === 409) {
        pushNotification({
          title: t("toastr.fail.duplicateAnalysisProfileName", {
            name: errorPayload.name,
          }),
          variant: "danger",
        });
      } else {
        pushNotification({
          title: t("toastr.fail.updateAnalysisProfile"),
          message: getAxiosErrorMessage(error),
          variant: "danger",
        });
      }
    }
  );

  const updateAnalysisProfile = useCallback(
    async (analysisProfile: AnalysisProfile, wizardState: WizardState) => {
      const newProfile = buildAnalysisProfile(
        fromProfileWizardState(wizardState),
        uploadFilesToRefs(wizardState.customRules.customRulesFiles),
        identities
      );
      return update({ ...newProfile, id: analysisProfile.id });
    },
    [update, identities]
  );

  return { createAnalysisProfile, updateAnalysisProfile };
};
