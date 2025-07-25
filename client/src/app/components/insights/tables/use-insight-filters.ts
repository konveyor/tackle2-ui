import { useTranslation } from "react-i18next";

import { Archetype } from "@app/api/models";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTagsWithTagItems } from "@app/queries/tags";
import { universalComparator } from "@app/utils/utils";
import { FilterCategory, FilterType } from "../../FilterToolbar";

export const enum InsightFilterGroups {
  ApplicationInventory = "Application inventory",
  Insights = "Insights",
}

export const useInsightsTableFilters = <T>(
  groups: InsightFilterGroups[]
): FilterCategory<T, string>[] => {
  const { t } = useTranslation();

  const applicationFilters = useApplicationInventoryFilters(
    t("sidebar.applicationInventory")
  );

  const insightsFilters = useInsightsFilters(t("terms.insights"));

  const filters = groups.map((group) => {
    switch (group) {
      case InsightFilterGroups.ApplicationInventory:
        return applicationFilters;

      case InsightFilterGroups.Insights:
        return insightsFilters;
    }
  });
  return filters.flat(1);
};

const asSelectOptions = <E extends { id: number; name: string }>(items: E[]) =>
  items
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => universalComparator(a.name, b.name))
    .map(({ name }) => ({ key: name, value: name }));

const useApplicationInventoryFilters = <T>(
  filterGroupLabel: string
): FilterCategory<T, string>[] => {
  const { t } = useTranslation();

  const { data: applications } = useFetchApplications();
  const { archetypes } = useFetchArchetypes();
  const { businessServices } = useFetchBusinessServices();
  const { tagItems } = useFetchTagsWithTagItems();

  return [
    {
      categoryKey: "application.name",
      title: t("terms.applicationName"),
      filterGroup: filterGroupLabel,
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.applicationName").toLowerCase(),
        }) + "...",
      selectOptions: asSelectOptions(applications),
      getServerFilterValue: (selectedOptions) =>
        selectedOptions?.filter(Boolean) ?? [],
    },

    {
      categoryKey: "application.id",
      title: t("terms.archetypes"),
      filterGroup: filterGroupLabel,
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.archetype").toLowerCase(),
        }) + "...",
      selectOptions: asSelectOptions(archetypes),

      // TODO: Would be better if hub supported filtering by archetype id
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
      filterGroup: filterGroupLabel,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.businessService").toLowerCase(),
        }) + "...",
      type: FilterType.multiselect,
      selectOptions: asSelectOptions(businessServices),
    },

    {
      categoryKey: "tag.id",
      title: t("terms.tags"),
      filterGroup: filterGroupLabel,
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

const useInsightsFilters = <T>(
  filterGroupLabel: string
): FilterCategory<T, string>[] => {
  const { t } = useTranslation();

  return [
    {
      categoryKey: "category",
      title: t("terms.category"),
      filterGroup: filterGroupLabel,
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.category").toLowerCase(),
        }) + "...",

      serverFilterField: "category",
      getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
    },

    {
      categoryKey: "source",
      title: t("terms.source"),
      filterGroup: filterGroupLabel,
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.source").toLowerCase(),
        }) + "...",

      serverFilterField: "labels",
      getServerFilterValue: (value) => {
        if (value?.[0] === "None" || value?.[0] === "none") {
          return [`konveyor.io/source`];
        } else if ((value?.length ?? 0) > 0) {
          return [`konveyor.io/source=*${value}*`];
        } else {
          return undefined;
        }
      },
    },

    {
      categoryKey: "target",
      title: t("terms.target"),
      filterGroup: filterGroupLabel,
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.target").toLowerCase(),
        }) + "...",

      serverFilterField: "labels",
      getServerFilterValue: (value) =>
        value?.length === 1 ? [`konveyor.io/target=*${value}*`] : undefined,
    },
  ];
};
