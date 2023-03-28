import * as React from "react";
import {
  Button,
  ButtonVariant,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { ComposableAppTable } from "@app/shared/components/composable-app-table";
import { AppPlaceholder, ConditionalRender } from "@app/shared/components";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { JiraTracker } from "@app/api/models";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { IComposableRow } from "@app/shared/components/composable-app-table/composable-app-table";
import { useFetchJiraTrackers } from "@app/queries/jiratrackers";

export const JiraTrackers: React.FC = () => {
  const { t } = useTranslation();

  const { jiraTrackers, isFetching, fetchError } = useFetchJiraTrackers();

  const filterCategories: FilterCategory<JiraTracker>[] = [
    {
      key: "name",
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
  ];

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    jiraTrackers || [],
    filterCategories
  );
  const getSortValues = (item: JiraTracker) => [
    "",
    item?.name || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const columnNames = {
    name: "Name",
    url: "Start date",
    type: "Type",
    actions: "",
  };

  const rows: IComposableRow[] = [];
  currentPageItems?.forEach((item, index) => {
    rows.push({
      name: item.name,
      cells: [
        {
          title: item.name,
          width: 25,
        },
        {
          title: "url",
          width: 10,
        },
      ],
    });
  });

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.jira")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(jiraTrackers || fetchError)}
          then={<AppPlaceholder />}
        >
          <ComposableAppTable
            isSelectable={true}
            toolbarActions={
              <>
                <ToolbarGroup variant="button-group">
                  {/* <RBAC
                  allowedPermissions={[]}
                  rbacType={RBAC_TYPE.Scope}
                > */}
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-wave"
                      aria-label="Create new tracker"
                      variant={ButtonVariant.primary}
                      // onClick={openCreateTrackerModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                  {/* </RBAC> */}
                  {/* {jiraDropdownItems.length ? (
                    <ToolbarItem>
                      <KebabDropdown
                        dropdownItems={waveDropdownItems}
                      ></KebabDropdown>
                    </ToolbarItem>
                  ) : (
                    <></>
                  )} */}
                </ToolbarGroup>
              </>
            }
            rowItems={rows}
            columnNames={columnNames}
            isLoading={isFetching}
            fetchError={fetchError}
            paginationProps={paginationProps}
            toolbarToggle={
              <FilterToolbar<JiraTracker>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            }
            toolbarClearAllFilters={handleOnClearAllFilters}
          ></ComposableAppTable>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
