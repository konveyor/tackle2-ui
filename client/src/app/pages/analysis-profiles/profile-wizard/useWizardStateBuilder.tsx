import { AnalysisProfile } from "@app/api/models";
import { AnalysisScopeType } from "@app/components/analysis/steps/analysis-scope";
import { useFetchTargets } from "@app/queries/targets";

import { InitialStateRecipe } from "./useWizardReducer";

// TODO: Finish implementing this
export const useWizardStateBuilder = (
  analysisProfile: AnalysisProfile | null | undefined
): InitialStateRecipe => {
  const { targets } = useFetchTargets();

  if (!analysisProfile) {
    return () => {};
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
    draft.scope.withKnownLibs = [
      "app",
      scope.withKnownLibs && "oss",
      draft.scope.includedPackages.length > 0 && "select",
    ]
      .filter(Boolean)
      .join(",") as AnalysisScopeType;

    // custom rules
    draft.customRules.rulesKind = rules.repository ? "repository" : "manual";

    // labels
  };
  return recipe;
};
