import { AnalysisCompositeIssue } from "@app/api/models";
import { FilterValue } from "@app/shared/components/FilterToolbar";
import { serializeFilterUrlParams } from "@app/shared/hooks/table-controls";
import { trimAndStringifyUrlParams } from "@app/shared/hooks/useUrlParams";

const filterKeysToCarry = ["application.name"] as const;
type FilterValuesToCarry = Partial<
  Record<(typeof filterKeysToCarry)[number], FilterValue>
>;

export const getAffectedAppsUrl = (
  issue: AnalysisCompositeIssue,
  fromFilterValues: FilterValuesToCarry
) => {
  const toFilterValues: FilterValuesToCarry = {};
  filterKeysToCarry.forEach((key) => {
    if (fromFilterValues[key]) toFilterValues[key] = fromFilterValues[key];
  });
  return `/issues/${issue.ruleID}?${trimAndStringifyUrlParams({
    params: serializeFilterUrlParams(toFilterValues),
  })}`;
};
