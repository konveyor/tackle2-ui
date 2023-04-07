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
import { ComposableTableWithControls } from "@app/shared/components/composable-table-with-controls";
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
import { useFetchJiraTrackers } from "@app/queries/jiratrackers";
import { Tbody, Tr, Td } from "@patternfly/react-table";

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
    url: "URL",
  } as const;

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
          <ComposableTableWithControls
            isSelectable
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
            columnNames={columnNames}
            isLoading={isFetching}
            fetchError={fetchError}
            isNoData={jiraTrackers.length === 0}
            paginationProps={paginationProps}
            toolbarToggle={
              <FilterToolbar<JiraTracker>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            }
            toolbarClearAllFilters={handleOnClearAllFilters}
            renderTableBody={() => (
              <Tbody>
                {currentPageItems?.map((jiraTracker) => (
                  <Tr key={jiraTracker.name}>
                    <Td width={25} dataLabel={columnNames.name}>
                      {jiraTracker.name}
                    </Td>
                    <Td width={10} dataLabel={columnNames.url}>
                      TODO: URL
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            )}
          />
        </ConditionalRender>
      </PageSection>
    </>
  );
};
