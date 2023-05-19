import { Location } from "history";
import { AnalysisCompositeIssue } from "@app/api/models";
import { FilterValue } from "@app/shared/components/FilterToolbar";
import {
  deserializeFilterUrlParams,
  serializeFilterUrlParams,
} from "@app/shared/hooks/table-controls";
import { trimAndStringifyUrlParams } from "@app/shared/hooks/useUrlParams";

// Certain filters are shared between the Issues page and the Affected Applications Page.
// We carry these filter values between the two pages when determining the URLs to navigate between them.
// It is also important to restore any unrelated params when returning to the Issues page.

const filterKeysToCarry = ["application.name"] as const;
type FilterValuesToCarry = Partial<
  Record<(typeof filterKeysToCarry)[number], FilterValue>
>;

// URL for Affected Apps page that includes carried filters and a snapshot of original URL params from the Issues page
export const getAffectedAppsUrl = ({
  compositeIssue,
  fromFilterValues,
  fromLocation,
}: {
  compositeIssue: AnalysisCompositeIssue;
  fromFilterValues: FilterValuesToCarry;
  fromLocation: Location;
}) => {
  // The raw location.search string (already encoded) from the issues page is used as the fromIssuesParams param
  const fromIssuesParams = fromLocation.search;
  const toFilterValues: FilterValuesToCarry = {};
  filterKeysToCarry.forEach((key) => {
    if (fromFilterValues[key]) toFilterValues[key] = fromFilterValues[key];
  });
  return `/issues/${compositeIssue.ruleSet}/${
    compositeIssue.rule
  }?${trimAndStringifyUrlParams({
    params: {
      ...serializeFilterUrlParams(toFilterValues),
      fromIssuesParams,
      compositeIssueName: compositeIssue.name,
    },
  })}`;
};

// URL for Issues page that restores original URL params and overrides them with any changes to the carried filters.
export const getBackToIssuesUrl = ({
  fromFilterValues,
  fromLocation,
}: {
  fromFilterValues: FilterValuesToCarry;
  fromLocation: Location;
}) => {
  // Pull the fromIssuesParams param out of the current location's URLSearchParams
  const fromIssuesParams =
    new URLSearchParams(fromLocation.search).get("fromIssuesParams") || "";
  // Pull the params themselves out of fromIssuesParams
  const paramsToRestore = Object.fromEntries(
    new URLSearchParams(fromIssuesParams)
  );
  // Pull the filters param out of that
  const filterValuesToRestore = deserializeFilterUrlParams(
    paramsToRestore || {}
  );
  // For each of the filters we care about, override the original value with the one from the affected apps page.
  // This will carry over changes including the filter having been cleared.
  filterKeysToCarry.forEach((key) => {
    filterValuesToRestore[key] = fromFilterValues[key] || null;
  });
  // Put it all back together
  return `/composite/issues?${trimAndStringifyUrlParams({
    params: {
      ...paramsToRestore,
      ...serializeFilterUrlParams(filterValuesToRestore),
    },
  })}`;
};
