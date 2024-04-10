import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Modal,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  DropdownItem,
  Popover,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import CubesIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";

import { useLocalTableControls } from "@app/hooks/table-controls";
import { Paths } from "@app/Paths";
import { ApplicationImportSummary } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterType, FilterToolbar } from "@app/components/FilterToolbar";
import { IconedStatus } from "@app/components/IconedStatus";
import { KebabDropdown } from "@app/components/KebabDropdown";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
} from "@app/components/TableControls";
import {
  useFetchImportSummaries,
  useDeleteImportSummaryMutation,
} from "@app/queries/imports";
import { formatDate, formatPath } from "@app/utils/utils";
import { ImportApplicationsForm } from "../components/import-applications-form";
import { PageHeader } from "@app/components/PageHeader";

export const ManageImports: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { importSummaries, isFetching, fetchError, refetch } =
    useFetchImportSummaries();

  const [importSummaryToDelete, setImportSummaryToDelete] =
    useState<ApplicationImportSummary>();

  const [isApplicationImportModalOpen, setIsApplicationImportModalOpen] =
    useState(false);

  const onDeleteImportSummarySuccess = () => {
    pushNotification({
      title: t("terms.importSummaryDeleted"),
      variant: "success",
    });
  };

  const onDeleteImportSummaryError = (error: Error | null) => {
    if (error)
      pushNotification({
        title: error.message,
        variant: "danger",
      });
  };

  const { mutate: deleteImportSummary } = useDeleteImportSummaryMutation(
    onDeleteImportSummarySuccess,
    onDeleteImportSummaryError
  );

  const tableControls = useLocalTableControls({
    tableName: "manage-imports",
    idProperty: "id",
    items: importSummaries,
    columnNames: {
      importTime: "Import Time",
      createUser: "User",
      filename: "Filename",
      importStatus: "Status",
      validCount: "Accepted",
      invalidCount: "Rejected",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: false,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "filename",
        title: t("terms.filename"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.filename").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.filename || "";
        },
      },
    ],
    sortableColumns: ["importTime", "createUser", "filename", "importStatus"],
    getSortValues: (item) => ({
      importTime: item.importTime ? new Date(item.importTime).getTime() : 0, // Assuming importTime is a date, convert it to a timestamp
      createUser: item.createUser.toLowerCase(),
      filename: item.filename?.toLowerCase() || "",
      importStatus: item.importStatus.toLowerCase(),
    }),
    initialSort: { columnKey: "importTime", direction: "desc" },
    isLoading: isFetching,
  });
  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  const deleteRow = (row: ApplicationImportSummary) => {
    setImportSummaryToDelete(row);
  };

  const viewRowDetails = (row: ApplicationImportSummary) => {
    history.push(
      formatPath(Paths.applicationsImportsDetails, {
        importId: row.id,
      })
    );
  };

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={t("terms.applicationImports")}
          breadcrumbs={[
            {
              title: t("terms.applications"),
              path: Paths.applications,
            },
            {
              title: t("terms.applicationImports"),
              path: "",
            },
          ]}
        />
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(importSummaries || fetchError)}
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
                      id="import-applications"
                      aria-label="Import Applications"
                      variant={ButtonVariant.primary}
                      onClick={() => setIsApplicationImportModalOpen(true)}
                    >
                      {t("actions.import")}
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <KebabDropdown
                      dropdownItems={[
                        <DropdownItem
                          key="download-csv-template"
                          component={(props) => (
                            <a
                              {...props}
                              download
                              href="/templates/template_application_import.csv"
                            />
                          )}
                        >
                          {t("actions.downloadCsvTemplate")}
                        </DropdownItem>,
                      ]}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="manage-imports"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <Table {...tableProps} aria-label="Manage imports table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "importTime" })} />
                    <Th {...getThProps({ columnKey: "createUser" })} />
                    <Th {...getThProps({ columnKey: "filename" })} />
                    <Th {...getThProps({ columnKey: "importStatus" })} />
                    <Th {...getThProps({ columnKey: "validCount" })} />
                    <Th {...getThProps({ columnKey: "invalidCount" })} />
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
                        what: t("terms.importSummary").toLowerCase(),
                      })}
                    </Title>
                    <EmptyStateBody>
                      {t("composed.noDataStateBody", {
                        how: t("actions.import"),
                        what: t("terms.applicationFile").toLowerCase(),
                      })}
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((importSummary, rowIndex) => {
                  return (
                    <Tbody
                      key={importSummary.id}
                      isExpanded={isCellExpanded(importSummary)}
                    >
                      <Tr {...getTrProps({ item: importSummary })}>
                        <Td
                          width={25}
                          {...getTdProps({ columnKey: "importTime" })}
                        >
                          {importSummary.importTime
                            ? formatDate(new Date(importSummary.importTime))
                            : ""}
                        </Td>
                        <Td
                          width={15}
                          {...getTdProps({ columnKey: "createUser" })}
                        >
                          {importSummary.createUser}
                        </Td>
                        <Td
                          width={30}
                          {...getTdProps({ columnKey: "filename" })}
                        >
                          {importSummary.filename}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "importStatus" })}
                        >
                          {importSummary.importStatus === "Completed" ? (
                            <IconedStatus preset="Completed" />
                          ) : importSummary.importStatus === "In Progress" ? (
                            <IconedStatus preset="InProgress" />
                          ) : (
                            <IconedStatus
                              preset="Error"
                              label={
                                <Popover
                                  position="right"
                                  bodyContent={
                                    <div>
                                      {t(
                                        "message.importErrorCheckDocumentation"
                                      )}
                                    </div>
                                  }
                                  footerContent={
                                    <div>
                                      <a
                                        href="https://tackle-docs.konveyor.io/documentation/doc-installing-and-using-tackle/master/index.html#importing-applications_tackle"
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {t("actions.checkDocumentation")}
                                      </a>
                                    </div>
                                  }
                                >
                                  <Button variant={ButtonVariant.link} isInline>
                                    {t("terms.error")}
                                  </Button>
                                </Popover>
                              }
                            />
                          )}
                        </Td>
                        <Td width={10}>{importSummary.validCount}</Td>
                        <Td width={10}>
                          {importSummary.invalidCount > 0 ? (
                            <span>{importSummary.invalidCount}</span>
                          ) : (
                            <span>-</span>
                          )}
                        </Td>
                        <Td width={10}>
                          <KebabDropdown
                            dropdownItems={[
                              <DropdownItem
                                key="delete-import-summary"
                                component="button"
                                onClick={() => deleteRow(importSummary)}
                              >
                                {t("actions.delete")}
                              </DropdownItem>,
                              importSummary.importStatus === "Completed" &&
                                importSummary.invalidCount > 0 && (
                                  <DropdownItem
                                    key="view-error-report"
                                    onClick={() =>
                                      viewRowDetails(importSummary)
                                    }
                                  >
                                    {t("actions.viewErrorReport")}
                                  </DropdownItem>
                                ),
                            ]}
                          />
                        </Td>
                      </Tr>
                    </Tbody>
                  );
                })}
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="manage-imports"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        isOpen={isApplicationImportModalOpen}
        variant="medium"
        title={t("dialog.title.importApplicationFile")}
        onClose={() => setIsApplicationImportModalOpen((current) => !current)}
      >
        <ImportApplicationsForm
          onSaved={() => {
            setIsApplicationImportModalOpen(false);
            refetch();
          }}
        />
      </Modal>
      {!!importSummaryToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: "import summary",
            name: importSummaryToDelete.filename,
          })}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setImportSummaryToDelete(undefined)}
          onClose={() => setImportSummaryToDelete(undefined)}
          onConfirm={() => {
            if (importSummaryToDelete) {
              deleteImportSummary(importSummaryToDelete.id);
              setImportSummaryToDelete(undefined);
            }
          }}
        />
      )}
    </>
  );
};
