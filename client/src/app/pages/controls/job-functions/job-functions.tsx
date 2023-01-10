import React, { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  ConfirmDialog,
  NoDataEmptyState,
} from "@app/shared/components";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { JobFunction } from "@app/api/models";

import { NewJobFunctionModal } from "./components/new-job-function-modal";
import { UpdateJobFunctionModal } from "./components/update-job-function-modal";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import {
  useDeleteJobFunctionMutation,
  useFetchJobFunctions,
} from "@app/queries/jobfunctions";
import { NotificationsContext } from "@app/shared/notifications-context";

const ENTITY_FIELD = "entity";

export const JobFunctions: React.FC = () => {
  const { t } = useTranslation();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [
    jobFunctionstakeholderIdToDelete,
    setJobFunctionStakeholderIdToDelete,
  ] = React.useState<number>();

  const { pushNotification } = React.useContext(NotificationsContext);

  const { jobFunctions, isFetching, fetchError, refetch } =
    useFetchJobFunctions();

  const filterCategories: FilterCategory<JobFunction>[] = [
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

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    jobFunctions || [],
    filterCategories
  );
  const getSortValues = (jobFunction: JobFunction) => [
    jobFunction.name || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<JobFunction>();

  const onDeleteJobFunctionSuccess = (response: any) => {
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

  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(70)],
      cellFormatters: [],
    },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    rows.push({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <AppTableActionButtons
              onEdit={() => setRowToUpdate(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });
  });

  // Rows

  const deleteRow = (row: JobFunction) => {
    setJobFunctionStakeholderIdToDelete(row.id);
    setIsConfirmDialogOpen(true);
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const handleOnOpenCreateModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnCreatedNew = (response: AxiosResponse<JobFunction>) => {
    setIsNewModalOpen(false);
    refetch();

    pushNotification({
      title: t("toastr.success.added", {
        what: response.data.name,
        type: "job function",
      }),
      variant: "success",
    });
  };

  const handleOnCreateNewCancel = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnJobFunctionUpdated = () => {
    setRowToUpdate(undefined);
    refetch();
  };

  const handleOnUpdatedCancel = () => {
    setRowToUpdate(undefined);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(jobFunctions || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={jobFunctions ? jobFunctions.length : 0}
          sortBy={sortBy}
          onSort={onSort}
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          paginationProps={paginationProps}
          paginationIdPrefix="job-functions"
          toolbarToggle={
            <FilterToolbar<JobFunction>
              filterCategories={filterCategories}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />
          }
          toolbarActions={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <RBAC
                  allowedPermissions={controlsWriteScopes}
                  rbacType={RBAC_TYPE.Scope}
                >
                  <Button
                    type="button"
                    id="create-job-function"
                    aria-label="Create job function"
                    variant={ButtonVariant.primary}
                    onClick={handleOnOpenCreateModal}
                  >
                    {t("actions.createNew")}
                  </Button>
                </RBAC>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.jobFunctions')
              title={t("composed.noDataStateTitle", {
                what: t("terms.jobFunctions").toLowerCase(),
              })}
              // t('terms.jobFunction')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.jobFunction").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <NewJobFunctionModal
        isOpen={isNewModalOpen}
        onSaved={handleOnCreatedNew}
        onCancel={handleOnCreateNewCancel}
      />
      <UpdateJobFunctionModal
        jobFunction={rowToUpdate}
        onSaved={handleOnJobFunctionUpdated}
        onCancel={handleOnUpdatedCancel}
      />
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.delete", {
            what: t("terms.jobFunction").toLowerCase(),
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() => {
            if (jobFunctionstakeholderIdToDelete) {
              deleteJobFunction(jobFunctionstakeholderIdToDelete);
              setJobFunctionStakeholderIdToDelete(undefined);
            }
            setIsConfirmDialogOpen(false);
          }}
        />
      )}
    </>
  );
};
