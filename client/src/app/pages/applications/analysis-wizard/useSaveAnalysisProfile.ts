import { useCallback, useContext } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { AnalysisProfile, New } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateAnalysisProfileMutation } from "@app/queries/analysis-profiles";
import { useFetchIdentities } from "@app/queries/identities";
import { useCreateFileMutation } from "@app/queries/targets";
import {
  buildAnalysisProfile,
  fromAnalysisWizardState,
} from "@app/utils/analysis-profiles";
import { getAxiosErrorMessage, isNotEmptyString } from "@app/utils/utils";

import { WizardState } from "./useWizardReducer";

const isSaveAsProfile = (wizardState: WizardState) => {
  return (
    wizardState.options.saveAsProfile &&
    isNotEmptyString(wizardState.options.profileName)
  );
};

export const useSaveAnalysisProfile = () => {
  const { t } = useTranslation();
  const { pushNotification } = useContext(NotificationsContext);
  const { identities } = useFetchIdentities();

  const { mutate: createProfile } = useCreateAnalysisProfileMutation(
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

  const { mutateAsync: createRuleFile } = useCreateFileMutation();

  const uploadCustomRulesFiles = useCallback(
    async (wizardState: WizardState) => {
      if (wizardState.customRules.customRulesFiles.length === 0) {
        return;
      }

      const results = await Promise.allSettled(
        wizardState.customRules.customRulesFiles.map(({ fullFile }) =>
          createRuleFile({ file: fullFile })
        )
      );

      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        throw new Error("Failed to upload custom rules files");
      }

      const successful = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      successful.forEach((hubFile) => {
        console.log(
          "Uploaded custom rules file %d: %s",
          hubFile.id,
          hubFile.name
        );
      });

      return successful;
    },
    [createRuleFile]
  );

  const createAnalysisProfile = useCallback(
    (wizardState: WizardState) => {
      if (!isSaveAsProfile(wizardState)) {
        return;
      }

      uploadCustomRulesFiles(wizardState).then((hubFiles) => {
        const newProfile = buildAnalysisProfile(
          fromAnalysisWizardState(wizardState),
          hubFiles,
          identities
        );
        createProfile(newProfile);
      });
    },
    [createProfile, uploadCustomRulesFiles, identities]
  );

  return { createAnalysisProfile };
};
