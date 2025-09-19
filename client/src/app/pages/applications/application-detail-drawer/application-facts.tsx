import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarToggleGroup,
} from "@patternfly/react-core";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Fact } from "@app/api/models";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";

import { FactDetailModal } from "./fact-detail-modal/fact-detail-modal";

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

  const filterCategories: FilterCategory<Fact, "source">[] = [
    {
      categoryKey: "source",
      title: t("terms.source"),
      type: FilterType.multiselect,
      placeholderText: t("terms.source"),
      //   getItemValue: (fact) => fact.source || "Source default name",
      selectOptions: Array.from(sources)
        //TODO: Custom sorting for facts may be required
        // .sort(compareSources)
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

  const [selectedFactForDetailModal, setSelectedFactForDetailModal] =
    React.useState<Fact | null>(null);

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
        return (
          <div key={fact.name}>
            <Button
              variant="link"
              isInline
              onClick={() => setSelectedFactForDetailModal(fact)}
            >
              {fact.name}
            </Button>
          </div>
        );
      })}
      {selectedFactForDetailModal ? (
        <FactDetailModal
          fact={selectedFactForDetailModal}
          onClose={() => setSelectedFactForDetailModal(null)}
        />
      ) : null}
    </>
  );
};
