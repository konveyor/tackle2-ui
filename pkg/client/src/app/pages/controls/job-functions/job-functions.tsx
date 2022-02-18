import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
  ToolbarChip,
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

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
  SearchFilter,
} from "@app/shared/components";
import {
  useTableControls,
  useDelete,
  useFetchJobFunctions,
} from "@app/shared/hooks";

import { getAxiosErrorMessage } from "@app/utils/utils";
import {
  deleteJobFunction,
  JobFunctionSortBy,
  JobFunctionSortByQuery,
} from "@app/api/rest";
import { SortByQuery, JobFunction } from "@app/api/models";

import { NewJobFunctionModal } from "./components/new-job-function-modal";
import { UpdateJobFunctionModal } from "./components/update-job-function-modal";

enum FilterKey {
  NAME = "name",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): JobFunctionSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: JobFunctionSortBy;
  switch (sortBy.index) {
    case 0:
      field = JobFunctionSortBy.ROLE;
      break;
    default:
      throw new Error("Invalid column index=" + sortBy.index);
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

export const JobFunctions: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
    {
      key: FilterKey.NAME,
      name: t("terms.name"),
    },
  ];
  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [rowToUpdate, setRowToUpdate] = useState<JobFunction>();

  const { requestDelete: requestDeleteJobFunction } = useDelete<JobFunction>({
    onDelete: (t: JobFunction) => deleteJobFunction(t.id!),
  });

  const { jobFunctions, isFetching, fetchError, fetchJobFunctions } =
    useFetchJobFunctions(true);

  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 0 },
  });

  const refreshTable = useCallback(() => {
    fetchJobFunctions(
      {
        role: filtersValue.get(FilterKey.NAME),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchJobFunctions]);

  useEffect(() => {
    fetchJobFunctions(
      {
        role: filtersValue.get(FilterKey.NAME),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchJobFunctions]);

  //

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
  jobFunctions?.data.forEach((item) => {
    rows.push({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.role}</TableText>,
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
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.jobFunction")
        title: t("dialog.title.delete", {
          what: t("terms.jobFunction").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteJobFunction(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              if (jobFunctions?.data.length === 1) {
                handlePaginationChange({ page: paginationQuery.page - 1 });
              } else {
                refreshTable();
              }
            },
            (error) => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
        },
      })
    );
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFiltersValue((current) => {
      const newVal = new Map(current);
      Array.from(newVal.keys()).forEach((key) => {
        newVal.set(key, []);
      });
      return newVal;
    });
  };

  const handleOnAddFilter = (key: string, filterText: string) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) => {
      const values: string[] = current.get(filterKey) || [];
      return new Map(current).set(filterKey, [...values, filterText]);
    });

    handlePaginationChange({ page: 1 });
  };

  const handleOnDeleteFilter = (
    key: string,
    value: (string | ToolbarChip)[]
  ) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) =>
      new Map(current).set(filterKey, value as string[])
    );
  };

  // Create Modal

  const handleOnOpenCreateModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnCreatedNew = (response: AxiosResponse<JobFunction>) => {
    setIsNewModalOpen(false);
    refreshTable();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.role,
          type: "job function",
        })
      )
    );
  };

  const handleOnCreateNewCancel = () => {
    setIsNewModalOpen(false);
  };

  // Update Modal

  const handleOnJobFunctionUpdated = () => {
    setRowToUpdate(undefined);
    refreshTable();
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
          count={jobFunctions ? jobFunctions.meta.count : 0}
          pagination={paginationQuery}
          sortBy={sortByQuery}
          onPaginationChange={handlePaginationChange}
          onSort={handleSortChange}
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          filtersApplied={
            Array.from(filtersValue.values()).reduce(
              (previous, current) => [...previous, ...current],
              []
            ).length > 0
          }
          toolbarToggle={
            <AppTableToolbarToggleGroup
              categories={filters}
              chips={filtersValue}
              onChange={handleOnDeleteFilter}
            >
              <SearchFilter
                options={filters}
                onApplyFilter={handleOnAddFilter}
              />
            </AppTableToolbarToggleGroup>
          }
          toolbarActions={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <Button
                  type="button"
                  aria-label="create-job-function"
                  variant={ButtonVariant.primary}
                  onClick={handleOnOpenCreateModal}
                >
                  {t("actions.createNew")}
                </Button>
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
    </>
  );
};
