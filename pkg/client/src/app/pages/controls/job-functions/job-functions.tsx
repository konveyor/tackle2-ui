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

const ENTITY_FIELD = "entity";

export const JobFunctions: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

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

  useEffect(() => {
    fetchJobFunctions();
  }, [fetchJobFunctions]);

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
  jobFunctions?.forEach((item: JobFunction) => {
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
              if (jobFunctions?.length === 1) {
                handlePaginationChange({ page: paginationQuery.page - 1 });
              } else {
                fetchJobFunctions();
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

  // Create Modal

  const handleOnOpenCreateModal = () => {
    setIsNewModalOpen(true);
  };

  const handleOnCreatedNew = (response: AxiosResponse<JobFunction>) => {
    setIsNewModalOpen(false);
    fetchJobFunctions();

    dispatch(
      alertActions.addSuccess(
        t("toastr.success.added", {
          what: response.data.name,
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
    fetchJobFunctions();
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
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
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
