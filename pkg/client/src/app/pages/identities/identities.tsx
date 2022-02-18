import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  PageSection,
  PageSectionVariants,
  Pagination,
  Text,
  TextContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  expandable,
  ICell,
  IRow,
  sortable,
  Table,
  TableBody,
  TableHeader,
} from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  FilterToolbar,
  FilterType,
  FilterCategory,
} from "@app/shared/components/FilterToolbar";
import { NoDataEmptyState } from "@app/shared/components";
import { Identity } from "@app/api/models";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";

export const Identities: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const filterCategories: FilterCategory<Identity>[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item.name;
      },
    },
    {
      key: "type",
      title: "Type",
      type: FilterType.select,
      placeholderText: "Filter by type...",
      selectOptions: [
        { key: "scm", value: "Source Control" },
        { key: "mvn", value: "Maven Settings File" },
      ],
      getItemValue: (item) => {
        return item.kind ? "Warm" : "Cold";
      },
    },
  ];
  const identities: Identity[] = [];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    identities,
    filterCategories
  );
  const getSortValues = (identity: Identity) => [
    "", // Expand/collapse column
    identity.name,
    identity.kind,
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );
  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [cellWidth(25)] },
    { title: t("terms.type"), transforms: [sortable, cellWidth(20)] },
    { title: t("terms.createdBy"), transforms: [sortable, cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

  const rows: IRow[] = [];
  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.credentials")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <FilterToolbar<Identity>
          filterCategories={filterCategories}
          filterValues={filterValues}
          setFilterValues={setFilterValues}
          endToolbarItems={
            <>
              <ToolbarItem>
                <Button
                  isSmall
                  // onClick={() => history.push("/credentials/create")}
                  variant="primary"
                  id="create-credential-button"
                >
                  Create new
                </Button>
              </ToolbarItem>
            </>
          }
          pagination={
            <Pagination
              className={spacing.mtMd}
              {...paginationProps}
              widgetId="plans-table-pagination-top"
            />
          }
        />

        {identities.length > 0 ? (
          <Table
            aria-label="Credentials table"
            // className="credential-table"
            cells={columns}
            rows={rows}
            sortBy={sortBy}
            onSort={onSort}
          >
            <TableHeader />
            <TableBody />
          </Table>
        ) : (
          <NoDataEmptyState
            title={t("composed.noDataStateTitle", {
              what: t("terms.credentials").toLowerCase(),
            })}
            description={
              t("composed.noDataStateBody", {
                what: t("terms.credential").toLowerCase(),
              }) + "."
            }
          />
        )}
        <Pagination
          {...paginationProps}
          widgetId="plans-table-pagination-bottom"
          variant="bottom"
        />
      </PageSection>
    </>
  );
};
