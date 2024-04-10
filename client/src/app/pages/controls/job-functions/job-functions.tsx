import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Modal,
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

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import { AppTableWithControls } from "@app/components/AppTableWithControls";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { JobFunction } from "@app/api/models";
import { JobFunctionForm } from "./components/job-function-form";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useLegacySortState } from "@app/hooks/useLegacySortState";
import { useLegacyPaginationState } from "@app/hooks/useLegacyPaginationState";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import {
  useDeleteJobFunctionMutation,
  useFetchJobFunctions,
} from "@app/queries/jobfunctions";
import { NotificationsContext } from "@app/components/NotificationsContext";

const ENTITY_FIELD = "entity";

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

  const filterCategories: FilterCategory<JobFunction, "name">[] = [
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
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    jobFunctions || [],
    filterCategories
  );
  const getSortValues = (jobFunction: JobFunction) => [
    jobFunction.name || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useLegacySortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    useLegacyPaginationState(sortedItems, 10);

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
        className: "pf-v5-u-text-align-right",
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
              isDeleteEnabled={!!item.stakeholders}
              tooltipMessage="Cannot remove a Job function associated with stakeholder(s)"
              onEdit={() => setCreateUpdateModalState(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });
  });

  // Rows

  const deleteRow = (row: JobFunction) => {
    setJobFunctionToDelete(row);
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const closeCreateUpdateModal = () => {
    setCreateUpdateModalState(null);
    refetch;
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
            <FilterToolbar
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
                    onClick={() => setCreateUpdateModalState("create")}
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
              description={t("composed.noDataStateBody", {
                how: t("terms.create"),
                what: t("terms.jobFunction").toLowerCase(),
              })}
            />
          }
        />
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
