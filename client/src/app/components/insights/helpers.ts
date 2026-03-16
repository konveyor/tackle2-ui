import { Location } from "history";

import { TablePersistenceKeyPrefix } from "@app/Constants";
import { Paths } from "@app/Paths";
import {
  AnalysisInsight,
  UiAnalysisReportApplicationInsight,
  UiAnalysisReportInsight,
} from "@app/api/models";
import { FilterValue } from "@app/components/FilterToolbar";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";
import { trimAndStringifyUrlParams } from "@app/hooks/useUrlParams";

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

/**
 * URL for Affected Apps page that includes carried filters and a snapshot of
 * original URL params from the Insights page
 */
export const getAffectedAppsUrl = ({
  ruleReport,
  fromFilterValues,
  fromLocation,
  toPath = Paths.insightsAllAffectedApplications,
}: {
  ruleReport: UiAnalysisReportInsight;
  fromFilterValues: InsightsFilterValuesToCarry;
  fromLocation: Location;
  toPath?: string;
}) => {
  // The raw location.search string (already encoded) from the insights page is used as the fromInsightsParams param
  const fromInsightsParams = fromLocation.search;
  const toFilterValues: InsightsFilterValuesToCarry = {};
  filterKeysToCarry.forEach((key) => {
    if (fromFilterValues[key]) toFilterValues[key] = fromFilterValues[key];
  });
  const processedUrl = toPath
    .replace("/:ruleset/", `/${encodeURIComponent(ruleReport.ruleset)}/`)
    .replace("/:rule/", `/${encodeURIComponent(ruleReport.rule)}/`);
  const prefix = (key: string) =>
    `${TablePersistenceKeyPrefix.insightsAffectedApps}:${key}`;

  return `${processedUrl}?${trimAndStringifyUrlParams({
    newPrefixedSerializedParams: {
      [prefix("filters")]: serializeFilterUrlParams(toFilterValues).filters,
      [FROM_INSIGHTS_PARAMS_KEY]: fromInsightsParams,
      insightTitle: getInsightTitle(ruleReport),
    },
  })}`;
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
