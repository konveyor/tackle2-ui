import { useCallback, useContext } from "react";
import { AxiosError } from "axios";
import { sift, unique } from "radash";
import { useTranslation } from "react-i18next";

import { AnalysisProfile, Identity, New } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateAnalysisProfileMutation } from "@app/queries/analysis-profiles";
import { useFetchIdentities } from "@app/queries/identities";
import { toRef, toRefs } from "@app/utils/model-utils";
import { getAxiosErrorMessage, isNotEmptyString } from "@app/utils/utils";

import { WizardState } from "./useWizardReducer";

const isSaveAsProfile = (wizardState: WizardState) => {
  return (
    wizardState.options.saveAsProfile &&
    isNotEmptyString(wizardState.options.profileName)
  );
};

const buildAnalysisProfile = (
  wizardState: WizardState,
  identities: Identity[]
) => {
  const customRulesIdentity =
    wizardState.customRules.rulesKind === "repository"
      ? toRef(
          identities.find(
            (identity) =>
              identity.name === wizardState.customRules.associatedCredentials
          )
        )
      : undefined;

  const ruleLabels = unique(
    sift([
      // TODO: Do the uploaded custom rule file labels need to be included here?
      ...wizardState.options.additionalTargetLabels.map(({ label }) => label),
      ...wizardState.options.additionalSourceLabels.map(({ label }) => label),
    ])
  );

  const newProfile: New<AnalysisProfile> = {
    name: wizardState.options.profileName ?? "",
    description: "",

    mode: {
      withDeps: wizardState.mode.mode === "source-code-deps",
    },
    scope: {
      withKnownLibs: wizardState.scope.withKnownLibs.includes("oss"),
      packages: {
        included: wizardState.scope.withKnownLibs.includes("select")
          ? wizardState.scope.includedPackages
          : [],
        excluded: wizardState.scope.hasExcludedPackages
          ? wizardState.scope.excludedPackages
          : [],
      },
    },
    rules: {
      // Manually added labels
      labels: {
        included: ruleLabels,
        excluded: wizardState.options.excludedLabels,
      },

      // TODO: Need to be able to indicate the "choice" target label
      targets: toRefs(wizardState.targets.selectedTargets.map(([t]) => t)),

      // Custom rules repository and associated identity
      repository:
        wizardState.customRules.rulesKind === "repository"
          ? {
              kind: wizardState.customRules.repositoryType,
              url: wizardState.customRules.sourceRepository?.trim(),
              branch: wizardState.customRules.branch?.trim(),
              path: wizardState.customRules.rootPath?.trim(),
            }
          : undefined,
      identity: customRulesIdentity,

      // Custom rules files
      // TODO: Do I need to reupload the files in a bucket to "normal" files?
      files: wizardState.customRules.customRulesFiles
        .filter((file) => file.fileId !== undefined)
        .map((file) => ({ id: file.fileId!, name: file.fileName })),
    },
  };

  return newProfile;
};

export const useSaveAnalysisProfile = () => {
  const { t } = useTranslation();
  const { pushNotification } = useContext(NotificationsContext);
  const { identities } = useFetchIdentities();

  const { mutate, mutateAsync } = useCreateAnalysisProfileMutation(
    (profile: AnalysisProfile) => {
      pushNotification({
        title: t("terms.analysisProfiles"),
        message: t("toastr.success.analysisProfileCreated", {
          name: profile.name,
        }),
        variant: "success",
      });
    },
    (error: AxiosError, errorPayload: New<AnalysisProfile>) => {
      if (error.response?.status === 409) {
        pushNotification({
          title: t("terms.analysisProfiles"),
          message: t("toastr.fail.duplicateAnalysisProfileName", {
            name: errorPayload.name,
          }),
          variant: "danger",
        });
      } else {
        pushNotification({
          title: getAxiosErrorMessage(error),
          variant: "danger",
        });
      }
    }
  );

  const createAnalysisProfile = useCallback(
    (wizardState: WizardState) => {
      if (!isSaveAsProfile(wizardState)) {
        return;
      }

      const newProfile = buildAnalysisProfile(wizardState, identities);
      mutate(newProfile);
    },
    [mutate, identities]
  );

  const createAnalysisProfileAsync = useCallback(
    async (wizardState: WizardState) => {
      if (!isSaveAsProfile(wizardState)) {
        return;
      }

      const newProfile = buildAnalysisProfile(wizardState, identities);
      return mutateAsync(newProfile);
    },
    [mutateAsync, identities]
  );

  return { createAnalysisProfile, createAnalysisProfileAsync };
};
