import { useCallback, useContext } from "react";
import { AxiosError } from "axios";
import { sift, unique } from "radash";
import { useTranslation } from "react-i18next";

import { AnalysisProfile, HubFile, Identity, New } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateAnalysisProfileMutation } from "@app/queries/analysis-profiles";
import { useFetchIdentities } from "@app/queries/identities";
import { useCreateFileMutation } from "@app/queries/targets";
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
  hubFiles: HubFile[] = [],
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

  const nonTargetRuleLabels = unique(
    sift([
      ...wizardState.customRules.customLabels.map(({ label }) => label),
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
        included: nonTargetRuleLabels,
        excluded: wizardState.options.excludedLabels,
      },

      targets: wizardState.targets.selectedTargets.map(
        ([{ id, name }, selection]) => ({
          id,
          name,
          ...(selection ? { selection: selection.label } : {}),
        })
      ),

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
      files: toRefs(hubFiles),
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
          wizardState,
          hubFiles,
          identities
        );
        mutate(newProfile);
      });
    },
    [mutate, uploadCustomRulesFiles, identities]
  );

  const createAnalysisProfileAsync = useCallback(
    async (wizardState: WizardState) => {
      if (!isSaveAsProfile(wizardState)) {
        return;
      }

      const hubFiles = await uploadCustomRulesFiles(wizardState);
      const newProfile = buildAnalysisProfile(
        wizardState,
        hubFiles,
        identities
      );
      return mutateAsync(newProfile);
    },
    [mutateAsync, uploadCustomRulesFiles, identities]
  );

  return { createAnalysisProfile, createAnalysisProfileAsync };
};
