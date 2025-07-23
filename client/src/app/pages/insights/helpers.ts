import { Location, LocationDescriptor } from "history";
import {
  AnalysisInsight,
  UiAnalysisReportInsight,
  UiAnalysisReportApplicationInsight,
  Archetype,
} from "@app/api/models";
import {
  FilterCategory,
  FilterType,
  FilterValue,
} from "@app/components/FilterToolbar";
import {
  deserializeFilterUrlParams,
  serializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { trimAndStringifyUrlParams } from "@app/hooks/useUrlParams";
import { Paths } from "@app/Paths";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { InsightFilterGroups } from "./insights-page";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTagsWithTagItems } from "@app/queries/tags";
import { useTranslation } from "react-i18next";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchApplications } from "@app/queries/applications";
import { universalComparator } from "@app/utils/utils";

// Certain filters are shared between the Insights page and the Affected Applications Page.
// We carry these filter values between the two pages when determining the URLs to navigate between them.
// It is also important to restore any unrelated params when returning to the Insights page.

const filterKeysToCarry = [
  "application.name",
  "businessService.name",
  "tag.id",
] as const;
export type InsightsFilterValuesToCarry = Partial<Record<string, FilterValue>>;

export const useSharedAffectedApplicationFilterCategories = <
  TItem,
>(): FilterCategory<TItem, string>[] => {
  const { t } = useTranslation();
  const { businessServices } = useFetchBusinessServices();
  const { tagItems } = useFetchTagsWithTagItems();
  const { archetypes } = useFetchArchetypes();
  const { data: applications } = useFetchApplications();

  return [
    {
      categoryKey: "application.name",
      title: t("terms.applicationName"),
      filterGroup: InsightFilterGroups.ApplicationInventory,
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.applicationName").toLowerCase(),
        }) + "...",
      selectOptions: applications
        .map(({ name }) => name)
        .sort(universalComparator)
        .map((name) => ({
          key: name,
          value: name,
        })),
      getServerFilterValue: (selectedOptions) =>
        selectedOptions?.filter(Boolean) ?? [],
    },
    {
      categoryKey: "application.id",
      title: t("terms.archetypes"),
      filterGroup: InsightFilterGroups.ApplicationInventory,
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.archetype").toLowerCase(),
        }) + "...",
      selectOptions: archetypes.map(({ name }) => ({
        key: name,
        value: name,
      })),

      getServerFilterValue: (selectedOptions) => {
        const findArchetypeByName = (name: string) => {
          return archetypes.find((item) => item.name === name);
        };

        const getApplicationIds = (archetype: Archetype) => {
          return archetype.applications?.map((app) => String(app.id));
        };

        if (!selectedOptions) return ["-1"];

        const archetypeIds = selectedOptions
          .map((option) => findArchetypeByName(option))
          .filter(Boolean)
          .flatMap((archetype) => getApplicationIds(archetype))
          .filter(Boolean);

        return archetypeIds.length === 0 ? ["-1"] : archetypeIds;
      },
    },
    {
      categoryKey: "businessService.name",
      title: t("terms.businessService"),
      filterGroup: InsightFilterGroups.ApplicationInventory,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.businessService").toLowerCase(),
        }) + "...",
      type: FilterType.multiselect,
      selectOptions: businessServices
        .map((businessService) => businessService.name)
        .map((name) => ({ key: name, value: name })),
    },
    {
      categoryKey: "tag.id",
      title: t("terms.tags"),
      filterGroup: InsightFilterGroups.ApplicationInventory,
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.tagName").toLowerCase(),
        }) + "...",
      selectOptions: tagItems.map(({ name, tagName, categoryName }) => ({
        value: name,
        label: name,
        chipLabel: tagName,
        groupLabel: categoryName,
      })),
      /**
       * Convert the selected `selectOptions` to an array of tag ids the server side
       * filtering will understand.
       */
      getServerFilterValue: (selectedOptions) =>
        selectedOptions
          ?.map((option) => tagItems.find((item) => option === item.name))
          .filter(Boolean)
          .map(({ id }) => String(id)) ?? [],
    },
  ];
};

const FROM_ISSUES_PARAMS_KEY = "~fromIssuesParams"; // ~ prefix sorts it at the end of the URL for readability

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
  const baseUrl = Paths.issuesAllAffectedApplications
    .replace("/:ruleset/", `/${encodeURIComponent(ruleReport.ruleset)}/`)
    .replace("/:rule/", `/${encodeURIComponent(ruleReport.rule)}/`);
  const prefix = (key: string) =>
    `${TablePersistenceKeyPrefix.issuesAffectedApps}:${key}`;

  return `${baseUrl}?${trimAndStringifyUrlParams({
    newPrefixedSerializedParams: {
      [prefix("filters")]: serializeFilterUrlParams(toFilterValues).filters,
      [FROM_ISSUES_PARAMS_KEY]: fromInsightsParams,
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
    new URLSearchParams(fromLocation.search).get(FROM_ISSUES_PARAMS_KEY) || "";
  // Pull the params themselves out of fromInsightsParams
  const prefixedParamsToRestore = Object.fromEntries(
    new URLSearchParams(fromInsightsParams)
  );
  // Pull the filters param out of that
  const prefix = (key: string) => `${TablePersistenceKeyPrefix.issues}:${key}`;
  const filterValuesToRestore = deserializeFilterUrlParams({
    filters: prefixedParamsToRestore[prefix("filters")],
  });
  // For each of the filters we care about, override the original value with the one from the affected apps page.
  // This will carry over changes including the filter having been cleared.
  filterKeysToCarry.forEach((key) => {
    filterValuesToRestore[key] = fromFilterValues[key] || null;
  });
  // Put it all back together
  return `${Paths.issuesAllTab}?${trimAndStringifyUrlParams({
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

// When selecting an application, we want to preserve any insight filters that might be present.
export const getInsightsSingleAppSelectedLocation = (
  applicationId: number,
  fromLocation?: Location
): LocationDescriptor => {
  const existingFiltersParam =
    fromLocation &&
    new URLSearchParams(fromLocation.search).get(
      `${TablePersistenceKeyPrefix.issues}:filters`
    );
  return {
    pathname: Paths.issuesSingleAppSelected.replace(
      ":applicationId",
      String(applicationId)
    ),
    search: existingFiltersParam
      ? new URLSearchParams({ filters: existingFiltersParam }).toString()
      : undefined,
  };
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
