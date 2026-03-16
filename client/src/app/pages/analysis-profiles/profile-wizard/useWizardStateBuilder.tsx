import { useMemo } from "react";
import { diff } from "radash";

import { AnalysisProfile, TargetLabel } from "@app/api/models";
import { useSourceLabels } from "@app/components/analysis/hooks/useSourceLabels";
import { useTargetLabels } from "@app/components/analysis/hooks/useTargetLabels";
import { useFetchCustomRulesFiles } from "@app/queries/analysis-profiles";
import { useFetchTargets } from "@app/queries/targets";
import { parseAndGroupLabels } from "@app/utils/rules-utils";
import { buildSetOfTargetLabels } from "@app/utils/upload-file-utils";

import { InitialStateRecipe } from "./useWizardReducer";

interface WizardStateBuilderResult {
  recipe: InitialStateRecipe;
  isLoading: boolean;
}

export const useWizardStateBuilder = (
  analysisProfile: AnalysisProfile | null | undefined
): WizardStateBuilderResult => {
  const { targets, isFetching: isFetchingTargets } = useFetchTargets();
  const sourceLabels = useSourceLabels();
  const targetLabels = useTargetLabels();
  const allLabels = useMemo(
    () => [...targetLabels, ...sourceLabels],
    [targetLabels, sourceLabels]
  );
  const { customRulesFiles, isLoading: isLoadingFiles } =
    useFetchCustomRulesFiles(analysisProfile);

  const isLoading = isFetchingTargets || isLoadingFiles;

  if (!analysisProfile) {
    return { recipe: () => {}, isLoading: false };
  }

  const { name, description, mode, rules, scope } = analysisProfile;

  const recipe: InitialStateRecipe = (draft) => {
    // profile details
    draft.profileDetails.name = name;
    draft.profileDetails.description = description;
    draft.profileDetails.isValid = true;

    // mode
    draft.mode.mode = mode.withDeps ? "source-code-deps" : "source-code";

    // targets
    if (rules?.targets) {
      draft.targets.selectedTargets = rules.targets
        .map((apt) => {
          const target = targets.find((t) => t.id === apt.id);
          return (
            target && [
              target,
              apt.selection
                ? target?.labels?.find((l) => l.label === apt.selection)
                : null,
            ]
          );
        })
        .filter(Boolean);

      draft.targets.targetStatus = Object.fromEntries(
        draft.targets.selectedTargets.map(([target, selection]) => [
          String(target.id),
          {
            target,
            isSelected: true,
            choiceTargetLabel: selection ?? undefined,
          },
        ])
      );
    }

    // scope
    draft.scope.includedPackages = scope.packages.included ?? [];
    draft.scope.excludedPackages = scope.packages.excluded ?? [];
    draft.scope.hasExcludedPackages = draft.scope.excludedPackages.length > 0;
    draft.scope.withKnownLibs =
      draft.scope.includedPackages.length > 0
        ? "app,oss,select"
        : scope.withKnownLibs
          ? "app,oss"
          : "app";

    // custom rules
    draft.customRules.rulesKind = rules.repository ? "repository" : "manual";

    if (rules.repository) {
      draft.customRules.repositoryType = rules.repository.kind;
      draft.customRules.sourceRepository = rules.repository.url;
      draft.customRules.branch = rules.repository.branch;
      draft.customRules.rootPath = rules.repository.path;
    }
    if (rules.identity) {
      draft.customRules.associatedCredentials = rules.identity.name;
    }

    draft.customRules.customRulesFiles = customRulesFiles;
    draft.customRules.customLabels = buildSetOfTargetLabels(customRulesFiles);
    draft.customRules.isValid = true;

    // labels
    draft.labels.excludedLabels = rules.labels.excluded ?? [];

    const groupedTargetLabels = labelsToGroupedTargetLabels(
      rules.labels.included ?? [],
      diff(allLabels, draft.customRules.customLabels, (label) => label.label)
    );
    draft.labels.additionalTargetLabels = groupedTargetLabels.target;
    draft.labels.additionalSourceLabels = groupedTargetLabels.source;
    draft.labels.isValid = true;
  };

  return { recipe, isLoading };
};

const labelToTargetLabel = (label: string, availableLabels: TargetLabel[]) => {
  const targetLabel = availableLabels.find((l) => l.label === label);
  return targetLabel ?? { name: label, label };
};

const labelsToTargetLabels = (
  strings: string[],
  availableLabels: TargetLabel[]
) => {
  return strings.map((string) => labelToTargetLabel(string, availableLabels));
};

const labelsToGroupedTargetLabels = (
  strings: string[],
  availableLabels: TargetLabel[]
) => {
  const targetLabels = labelsToTargetLabels(strings, availableLabels);
  const parsedLabels = parseAndGroupLabels(targetLabels);
  return {
    target: parsedLabels.target.map((l) => l.targetLabel),
    source: parsedLabels.source.map((l) => l.targetLabel),
  };
};
