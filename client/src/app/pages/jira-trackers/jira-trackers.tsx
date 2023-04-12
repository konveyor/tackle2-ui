import * as React from "react";
import {
  Button,
  ButtonVariant,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import {
  AppPlaceholder,
  ConditionalRender,
  ToolbarBulkSelector,
} from "@app/shared/components";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFetchJiraTrackers } from "@app/queries/jiratrackers";
import {
  Tbody,
  Tr,
  Td,
  Thead,
  Th,
  TableComposable,
} from "@patternfly/react-table";
import { useTableControls } from "@app/shared/hooks/use-table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";

export const JiraTrackers: React.FC = () => {
  const { t } = useTranslation();

  const { jiraTrackers, isFetching, fetchError } = useFetchJiraTrackers();

  const tableControls = useTableControls({
    items: jiraTrackers,
    columnNames: {
      name: "Name",
      url: "URL",
    },
    isSelectable: true,
    filterCategories: [
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
    ],
    getSortValues: (jiraTracker) => ({
      name: jiraTracker.name || "",
      url: "", // TODO
    }),
    sortableColumns: ["name", "url"],
    hasPagination: true,
  });
  const {
    numRenderedColumns,
    selectionState: { selectedItems },
    paginationState: {
      paginationProps, // TODO maybe paginationProps should be in propHelpers and not part of the responsibility of usePaginationState
      currentPageItems,
    },
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      tableProps,
      getThProps,
      getTdProps,
      getSelectCheckboxTdProps,
    },
  } = tableControls;

  console.log({ selectedItems });

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
          <div
            style={{
              backgroundColor: "var(--pf-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
                <FilterToolbar {...filterToolbarProps} />
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
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="migration-waves-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <TableComposable {...tableProps} aria-label="Jira trackers table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "url" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={jiraTrackers.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((jiraTracker, rowIndex) => (
                    <Tr key={jiraTracker.name}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={jiraTracker}
                        rowIndex={rowIndex}
                      >
                        <Td width={25} {...getTdProps({ columnKey: "name" })}>
                          {jiraTracker.name}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "url" })}>
                          TODO: URL
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </TableComposable>
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
