import { Location } from "history";
import {
  AnalysisInsight,
  UiAnalysisReportInsight,
  UiAnalysisReportApplicationInsight,
} from "@app/api/models";
import { FilterValue } from "@app/components/FilterToolbar";
import {
  deserializeFilterUrlParams,
  serializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { trimAndStringifyUrlParams } from "@app/hooks/useUrlParams";
import { Paths } from "@app/Paths";
import { TablePersistenceKeyPrefix } from "@app/Constants";

// Certain filters are shared between the Insights page and the Affected Applications Page.
// We carry these filter values between the two pages when determining the URLs to navigate between them.
// It is also important to restore any unrelated params when returning to the Insights page.

const filterKeysToCarry = [
  "application.name",
  "businessService.name",
  "tag.id",
] as const;
export type InsightsFilterValuesToCarry = Partial<Record<string, FilterValue>>;

const FROM_INSIGHTS_PARAMS_KEY = "~fromInsightsParams"; // ~ prefix sorts it at the end of the URL for readability

// URL for Affected Apps page that includes carried filters and a snapshot of original URL params from the Insights page
export const getAffectedAppsUrl = ({
  ruleReport,
  fromFilterValues,
  fromLocation,
}: {
  ruleReport: UiAnalysisReportInsight;
  fromFilterValues: InsightsFilterValuesToCarry;
  fromLocation: Location;
}) => {
  // The raw location.search string (already encoded) from the insights page is used as the fromInsightsParams param
  const fromInsightsParams = fromLocation.search;
  const toFilterValues: InsightsFilterValuesToCarry = {};
  filterKeysToCarry.forEach((key) => {
    if (fromFilterValues[key]) toFilterValues[key] = fromFilterValues[key];
  });
  const baseUrl = Paths.insightsAllAffectedApplications
    .replace("/:ruleset/", `/${encodeURIComponent(ruleReport.ruleset)}/`)
    .replace("/:rule/", `/${encodeURIComponent(ruleReport.rule)}/`);
  const prefix = (key: string) =>
    `${TablePersistenceKeyPrefix.insightsAffectedApps}:${key}`;

  return `${baseUrl}?${trimAndStringifyUrlParams({
    newPrefixedSerializedParams: {
      [prefix("filters")]: serializeFilterUrlParams(toFilterValues).filters,
      [FROM_INSIGHTS_PARAMS_KEY]: fromInsightsParams,
      insightTitle: getInsightTitle(ruleReport),
    },
  })}`;
};

// URL for Insights page that restores original URL params and overrides them with any changes to the carried filters.
export const getBackToAllInsightsUrl = ({
  fromFilterValues,
  fromLocation,
}: {
  fromFilterValues: InsightsFilterValuesToCarry;
  fromLocation: Location;
}) => {
  // Pull the fromInsightsParams param out of the current location's URLSearchParams
  const fromInsightsParams =
    new URLSearchParams(fromLocation.search).get(FROM_INSIGHTS_PARAMS_KEY) ||
    "";
  // Pull the params themselves out of fromInsightsParams
  const prefixedParamsToRestore = Object.fromEntries(
    new URLSearchParams(fromInsightsParams)
  );
  // Pull the filters param out of that
  const prefix = (key: string) =>
    `${TablePersistenceKeyPrefix.insights}:${key}`;
  const filterValuesToRestore = deserializeFilterUrlParams({
    filters: prefixedParamsToRestore[prefix("filters")],
  });
  // For each of the filters we care about, override the original value with the one from the affected apps page.
  // This will carry over changes including the filter having been cleared.
  filterKeysToCarry.forEach((key) => {
    filterValuesToRestore[key] = fromFilterValues[key] || null;
  });
  // Put it all back together
  return `${Paths.insightsAllTab}?${trimAndStringifyUrlParams({
    newPrefixedSerializedParams: {
      ...prefixedParamsToRestore,
      [prefix("filters")]: serializeFilterUrlParams(filterValuesToRestore)
        .filters,
    },
  })}`;
};

export const getDependenciesUrlFilteredByAppName = (appName: string) => {
  const baseUrl = Paths.dependencies;
  const filterParams = serializeFilterUrlParams({
    "application.name": [appName],
  });
  const urlParams = trimAndStringifyUrlParams({
    newPrefixedSerializedParams: {
      filters: filterParams.filters,
    },
  });
  return `${baseUrl}?${urlParams}`;
};

export const parseReportLabels = (
  ruleReport: UiAnalysisReportInsight | UiAnalysisReportApplicationInsight
) => {
  const sources: string[] = [];
  const targets: string[] = [];
  const otherLabels: string[] = [];
  ruleReport.labels.forEach((label) => {
    if (label.startsWith("konveyor.io/source=")) {
      sources.push(label.split("konveyor.io/source=")[1]);
    } else if (label.startsWith("konveyor.io/target=")) {
      targets.push(label.split("konveyor.io/target=")[1]);
    } else {
      otherLabels.push(label);
    }
  });
  return { sources, targets, otherLabels };
};

export const getInsightTitle = (
  insightReport:
    | UiAnalysisReportInsight
    | AnalysisInsight
    | UiAnalysisReportApplicationInsight
) =>
  insightReport?.description ||
  insightReport?.name?.split("\n")[0] ||
  "*Unnamed*";
