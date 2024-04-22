import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";

import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { ImportSummaryRoute, Paths } from "@app/Paths";
import { getApplicationSummaryCSV } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import {
  useFetchImports,
  useFetchImportSummaryById,
} from "@app/queries/imports";
import {
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { PageHeader } from "@app/components/PageHeader";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { CubesIcon } from "@patternfly/react-icons";

export const ManageImportsDetails: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Router
  const { importId } = useParams<ImportSummaryRoute>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const { imports, isFetching, fetchError } = useFetchImports(
    parseInt(importId),
    false
  );

  const { importSummary } = useFetchImportSummaryById(importId);

  const exportCSV = () => {
    getApplicationSummaryCSV(importId)
      .then((response) => {
        const fileName = importSummary?.filename || "file.csv";
        saveAs(new Blob([response.data]), fileName);
      })
      .catch((error) => {
        pushNotification({
          title: getAxiosErrorMessage(error),
          variant: "danger",
        });
      });
  };
  const tableControls = useLocalTableControls({
    tableName: "manage-imports-details",
    idProperty: "Application Name",
    items: imports || [],
    columnNames: {
      name: t("terms.name"),
      message: t("terms.message"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: "Application Name",
        type: FilterType.search,
        placeholderText: "Filter by application name...",
        getItemValue: (item) => {
          return item["Application Name"] || "";
        },
      },
    ],
    initialItemsPerPage: 10,
    sortableColumns: ["name", "message"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item["Application Name"],
      message: item.errorMessage,
    }),
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={t("terms.errorReport")}
          breadcrumbs={[
            {
              title: t("terms.applications"),
              path: Paths.applications,
            },
            {
              title: t("terms.imports"),
              path: Paths.applicationsImports,
            },
            {
              title: importSummary?.filename || "",
              path: "",
            },
          ]}
        />
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(imports || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="export-csv"
                      aria-label="Export csv"
                      variant={ButtonVariant.primary}
                      onClick={exportCSV}
                    >
                      {t("actions.export")}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>
            <Table {...tableProps} aria-label="Business service table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "message" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateIcon icon={CubesIcon} />
                    <Title headingLevel="h2" size="lg">
                      {t("composed.noDataStateTitle", {
                        what: t("terms.imports").toLowerCase(),
                      })}
                    </Title>
                    <EmptyStateBody>
                      {t("composed.noDataStateBody", {
                        how: t("terms.create"),
                        what: t("terms.imports").toLowerCase(),
                      })}
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((appImport, rowIndex) => {
                    return (
                      <Tr
                        key={appImport["Application Name"]}
                        {...getTrProps({ item: appImport })}
                      >
                        <TableRowContentWithControls
                          {...tableControls}
                          item={appImport}
                          rowIndex={rowIndex}
                        >
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {appImport["Application Name"]}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "message" })}
                          >
                            {appImport.errorMessage}
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                    );
                  })}
                </Tbody>
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="business-service-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
