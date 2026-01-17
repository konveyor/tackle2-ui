import { sift, unique } from "radash";

import {
  AnalysisProfile,
  HubFile,
  Identity,
  New,
  Ref,
  TargetLabel,
} from "@app/api/models";
import { AnalysisScopeState } from "@app/components/analysis/steps/analysis-scope";
import { AnalysisModeState } from "@app/components/analysis/steps/analysis-source";
import { CustomRulesStepState } from "@app/components/analysis/steps/custom-rules";
import { SetTargetsState } from "@app/components/analysis/steps/set-targets";
import type { WizardState as ProfileWizardState } from "@app/pages/analysis-profiles/profile-wizard/useWizardReducer";
import type { WizardState as AnalysisWizardState } from "@app/pages/applications/analysis-wizard/useWizardReducer";
import { toRef, toRefs } from "@app/utils/model-utils";

/**
 * Common input type for building an AnalysisProfile.
 * This interface abstracts the differences between the analysis wizard and
 * profile wizard state structures.
 */
export interface AnalysisProfileBuildInput {
  mode: AnalysisModeState;
  targets: SetTargetsState;
  scope: AnalysisScopeState;
  customRules: CustomRulesStepState;

  // Profile metadata
  name: string;
  description?: string;

  // Labels (flattened from options or labels step)
  additionalTargetLabels: TargetLabel[];
  additionalSourceLabels: TargetLabel[];
  excludedLabels: string[];
}

/**
 * Maps an AnalysisWizard state to the common AnalysisProfileBuildInput.
 */
export const fromAnalysisWizardState = (
  state: AnalysisWizardState
): AnalysisProfileBuildInput => ({
  mode: state.mode,
  targets: state.targets,
  scope: state.scope,
  customRules: state.customRules,
  name: state.options.profileName ?? "",
  description: "",
  additionalTargetLabels: state.options.additionalTargetLabels,
  additionalSourceLabels: state.options.additionalSourceLabels,
  excludedLabels: state.options.excludedLabels,
});

/**
 * Maps a ProfileWizard state to the common AnalysisProfileBuildInput.
 */
export const fromProfileWizardState = (
  state: ProfileWizardState
): AnalysisProfileBuildInput => ({
  mode: state.mode,
  targets: state.targets,
  scope: state.scope,
  customRules: state.customRules,
  name: state.profileDetails.name,
  description: state.profileDetails.description ?? "",
  additionalTargetLabels: state.labels.additionalTargetLabels,
  additionalSourceLabels: state.labels.additionalSourceLabels,
  excludedLabels: state.labels.excludedLabels,
});

/**
 * Builds a new AnalysisProfile from the common input.
 */
export const buildAnalysisProfile = (
  input: AnalysisProfileBuildInput,
  hubFiles: HubFile[] | Ref[] = [],
  identities: Identity[]
): New<AnalysisProfile> => {
  const customRulesIdentity =
    input.customRules.rulesKind === "repository"
      ? toRef(
          identities.find(
            (identity) =>
              identity.name === input.customRules.associatedCredentials
          )
        )
      : undefined;

  const nonTargetRuleLabels = unique(
    sift([
      ...input.customRules.customLabels.map(({ label }) => label),
      ...input.additionalTargetLabels.map(({ label }) => label),
      ...input.additionalSourceLabels.map(({ label }) => label),
    ])
  );

  const newProfile: New<AnalysisProfile> = {
    name: input.name,
    description: input.description ?? "",

    mode: {
      withDeps: input.mode.mode === "source-code-deps",
    },
    scope: {
      withKnownLibs: input.scope.withKnownLibs.includes("oss"),
      packages: {
        included: input.scope.withKnownLibs.includes("select")
          ? input.scope.includedPackages
          : [],
        excluded: input.scope.hasExcludedPackages
          ? input.scope.excludedPackages
          : [],
      },
    },
    rules: {
      // Manually added labels
      labels: {
        included: nonTargetRuleLabels,
        excluded: input.excludedLabels,
      },

      targets: input.targets.selectedTargets.map(
        ([{ id, name }, selection]) => ({
          id,
          name,
          ...(selection ? { selection: selection.label } : {}),
        })
      ),

      // Custom rules repository and associated identity
      repository:
        input.customRules.rulesKind === "repository"
          ? {
              kind: input.customRules.repositoryType,
              url: input.customRules.sourceRepository?.trim(),
              branch: input.customRules.branch?.trim(),
              path: input.customRules.rootPath?.trim(),
            }
          : undefined,
      identity: customRulesIdentity,

      // Custom rules files
      files: toRefs(hubFiles),
    },
  };

  return newProfile;
};
