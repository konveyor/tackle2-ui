import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Modal,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { JobFunction } from "@app/api/models";
import { JobFunctionForm } from "./components/job-function-form";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useDeleteJobFunctionMutation,
  useFetchJobFunctions,
} from "@app/queries/jobfunctions";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { CubesIcon } from "@patternfly/react-icons";
import { RBAC, RBAC_TYPE, controlsWriteScopes } from "@app/rbac";

export const JobFunctions: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [jobFunctionToDelete, setJobFunctionToDelete] =
    React.useState<JobFunction>();

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | JobFunction | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const jobFunctionToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

  const { jobFunctions, isFetching, fetchError, refetch } =
    useFetchJobFunctions();

  const tableControls = useLocalTableControls({
    tableName: "job-functions-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: jobFunctions || [],
    columnNames: {
      name: t("terms.name"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
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
    initialItemsPerPage: 10,
    sortableColumns: ["name"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item?.name || "",
    }),
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
  } = tableControls;

  const onDeleteJobFunctionSuccess = () => {
    pushNotification({
      title: t("terms.jobFunctionDeleted"),
      variant: "success",
    });
  };

  const onDeleteJobFunctionError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteJobFunction } = useDeleteJobFunctionMutation(
    onDeleteJobFunctionSuccess,
    onDeleteJobFunctionError
  );

  const deleteRow = (row: JobFunction) => {
    setJobFunctionToDelete(row);
  };

  const closeCreateUpdateModal = () => {
    setCreateUpdateModalState(null);
    refetch();
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(jobFunctions || fetchError)}
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
              <RBAC
                allowedPermissions={controlsWriteScopes}
                rbacType={RBAC_TYPE.Scope}
              >
                <Button
                  type="button"
                  id="create-job-function"
                  aria-label="Create job function"
                  variant={ButtonVariant.primary}
                  onClick={() => setCreateUpdateModalState("create")}
                >
                  {t("actions.createNew")}
                </Button>
              </RBAC>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="job-function-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table {...tableProps} aria-label="Job function table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} width={90} />
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
                      what: t("terms.jobFunction").toLowerCase(),
                    })}
                  </Title>
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("terms.create"),
                      what: t("terms.jobFunction").toLowerCase(),
                    })}
                  </EmptyStateBody>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems?.map((jobFunction, rowIndex) => {
                  return (
                    <Tr
                      key={jobFunction.name}
                      {...getTrProps({ item: jobFunction })}
                    >
                      <TableRowContentWithControls
                        {...tableControls}
                        item={jobFunction}
                        rowIndex={rowIndex}
                      >
                        <Td width={90} {...getTdProps({ columnKey: "name" })}>
                          {jobFunction.name}
                        </Td>
                        <AppTableActionButtons
                          isDeleteEnabled={!!jobFunction.stakeholders}
                          tooltipMessage="Cannot remove a Job function associated with stakeholder(s)"
                          onEdit={() => setCreateUpdateModalState(jobFunction)}
                          onDelete={() => deleteRow(jobFunction)}
                        />
                      </TableRowContentWithControls>
                    </Tr>
                  );
                })}
              </Tbody>
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="job-function-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </ConditionalRender>

      <Modal
        id="create-edit-stakeholder-modal"
        title={t(
          jobFunctionToUpdate ? "dialog.title.update" : "dialog.title.new",
          {
            what: t("terms.jobFunction").toLowerCase(),
          }
        )}
        variant="medium"
        isOpen={isCreateUpdateModalOpen}
        onClose={closeCreateUpdateModal}
      >
        <JobFunctionForm
          jobFunction={jobFunctionToUpdate}
          onClose={closeCreateUpdateModal}
        />
      </Modal>

      {!!jobFunctionToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: t("terms.jobFunction").toLowerCase(),
            name: jobFunctionToDelete.name,
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setJobFunctionToDelete(undefined)}
          onClose={() => setJobFunctionToDelete(undefined)}
          onConfirm={() => {
            if (jobFunctionToDelete) {
              deleteJobFunction(jobFunctionToDelete.id);
              setJobFunctionToDelete(undefined);
            }
          }}
        />
      )}
    </>
  );
};
