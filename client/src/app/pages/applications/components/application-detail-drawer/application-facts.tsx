import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarToggleGroup,
} from "@patternfly/react-core";
import React from "react";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";
import { useLegacyFilterState } from "@app/shared/hooks/useLegacyFilterState";
import { Fact } from "@app/api/models";

export interface IApplicationRiskProps {
  facts: Fact[];
}

export const ApplicationFacts: React.FC<IApplicationRiskProps> = ({
  facts,
}) => {
  const { t } = useTranslation();
  const sources = new Set<string>();
  // TODO: work through how to store sources for facts in the ui for sorting
  //   facts.forEach((fact) => sources.add(fact.source || ""));
  const compareSources = (a: string, b: string) => {
    // Always put user selected (source === "") first
    if (a === "") return -1;
    if (b === "") return 1;
    return a.localeCompare(b);
  };

  const filterCategories: FilterCategory<Fact, "source">[] = [
    {
      key: "source",
      title: t("terms.source"),
      type: FilterType.multiselect,
      placeholderText: t("terms.source"),
      //   getItemValue: (fact) => fact.source || "Source default name",
      selectOptions: Array.from(sources)
        .sort(compareSources)
        .map((source) => source || "Source default name")
        .map((source) => ({ key: source, value: source })),
      logicOperator: "OR",
    },
  ];

  const {
    filterValues,
    setFilterValues,
    filteredItems: filteredFacts,
  } = useLegacyFilterState(facts, filterCategories);

  console.log("facts", facts);
  return (
    <>
      <Toolbar
        clearAllFilters={() => setFilterValues({})}
        clearFiltersButtonText={t("actions.clearAllFilters")}
      >
        <ToolbarContent className={spacing.p_0}>
          <ToolbarItem>Filter by:</ToolbarItem>
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
            <FilterToolbar
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              showFiltersSideBySide
            />
          </ToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
      {filteredFacts.map((fact) => {
        console.log("fact", fact);
        return <div>{fact.name}</div>;
      })}
    </>
  );
};
