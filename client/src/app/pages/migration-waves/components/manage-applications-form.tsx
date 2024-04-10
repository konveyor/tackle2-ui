import * as React from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import {
  ActionGroup,
  Button,
  Form,
  Text,
  TextContent,
  TextInput,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import dayjs from "dayjs";

import { Application, MigrationWave } from "@app/api/models";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { dedupeFunction } from "@app/utils/utils";
import { useUpdateMigrationWaveMutation } from "@app/queries/migration-waves";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";

export interface ManageApplicationsFormProps {
  applications: Application[];
  migrationWave: MigrationWave;
  migrationWaves: MigrationWave[];
  onClose: () => void;
}

export const ManageApplicationsForm: React.FC<ManageApplicationsFormProps> = ({
  applications,
  migrationWave,
  migrationWaves,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const applicationsUsedByOtherMigrationsIds = migrationWaves
    .filter((wave) => wave.id !== migrationWave.id)
    .map((wave) => wave.applications.map((application) => application.id))
    .flat();

  const initialApplicationUsedByMigrationIds = migrationWave.applications.map(
    (application) => application.id
  );

  const assignedApplications = applications.filter((application) =>
    initialApplicationUsedByMigrationIds.includes(application.id)
  );

  const availableApplications = applications.filter(
    (application) =>
      !applicationsUsedByOtherMigrationsIds.includes(application.id)
  );

  const isArrayDifferent = (a: number[], b: number[]): boolean =>
    a.some((val) => !b.includes(val)) || b.some((val) => !a.includes(val));

  const isNewerSelection = (): boolean => {
    const selectedIds = selectedItems.map((application) => application.id);
    return isArrayDifferent(selectedIds, initialApplicationUsedByMigrationIds);
  };

  const onUpdateMigrationWaveSuccess = (
    response: AxiosResponse<MigrationWave>
  ) => {
    pushNotification({
      title: t("toastr.success.saveWhat", {
        what: response.data.name,
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onUpdateMigrationWaveError = (error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.migrationWave").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: updateMigrationWave } = useUpdateMigrationWaveMutation(
    onUpdateMigrationWaveSuccess,
    onUpdateMigrationWaveError
  );

  const tableControls = useLocalTableControls({
    tableName: "manage-applications-table",
    idProperty: "name",
    items: availableApplications,
    columnNames: {
      name: "Application Name",
      description: "Description",
      businessService: "Business service",
      owner: "Owner",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    isSelectionEnabled: true,
    initialSelected: assignedApplications,
    expandableVariant: "compound",
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
      {
        categoryKey: "businessService",
        title: t("terms.businessService"),
        type: FilterType.select,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.buisnessService").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.businessService?.name || "";
        },
        selectOptions: dedupeFunction(
          applications
            .filter((app) => !!app.businessService?.name)
            .map((app) => app.businessService?.name)
            .map((name) => ({ key: name, value: name }))
        ),
      },
      {
        categoryKey: "owner",
        title: t("terms.owner"),
        type: FilterType.select,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.owner").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.owner?.name || "";
        },
        selectOptions: dedupeFunction(
          applications
            .filter((app) => !!app.owner?.name)
            .map((app) => app.owner?.name)
            .map((name) => ({ key: name, value: name }))
        ),
      },
    ],
    sortableColumns: ["name", "businessService", "owner"],
    getSortValues: (application) => ({
      name: application.name || "",
      businessService: application.businessService?.name || "",
      owner: application.owner?.name || "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
  });
  const {
    currentPageItems,
    numRenderedColumns,
    selectionState: { selectedItems },
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
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

  const onSubmit = () => {
    const payload: MigrationWave = {
      id: migrationWave?.id,
      applications: selectedItems.map((application) => {
        return { id: application.id, name: application.name };
      }),
      name: migrationWave?.name?.trim() || "",
      startDate: migrationWave?.startDate || "",
      endDate: migrationWave?.endDate || "",
      stakeholders: migrationWave?.stakeholders || [],
      stakeholderGroups: migrationWave?.stakeholderGroups || [],
    };
    if (migrationWave)
      updateMigrationWave({
        ...payload,
      });

    onClose();
  };

  return (
    <Form onSubmit={onSubmit}>
      <TextContent>
        <Text component={TextVariants.h5}>Selected wave</Text>
        <TextInput
          value={
            !migrationWave?.name
              ? `${dayjs(migrationWave.startDate).format(
                  "MM/DD/YYYY"
                )} - ${dayjs(migrationWave.endDate).format("MM/DD/YYYY")}`
              : migrationWave.name
          }
          type="text"
          aria-label="wave-name"
          isDisabled={true}
        />
      </TextContent>
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="migration-waves-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="Migration waves table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "description" })} />
              <Th {...getThProps({ columnKey: "businessService" })} />
              <Th {...getThProps({ columnKey: "owner" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={currentPageItems.length === 0}
          noDataEmptyState={
            <NoDataEmptyState
              title={t("composed.noDataStateTitle", {
                what: t("terms.applications").toLowerCase(),
              })}
              description={t("composed.noDataStateBody", {
                how: t("terms.add"),
                what: t("terms.application").toLowerCase(),
              })}
            />
          }
          numRenderedColumns={numRenderedColumns}
        >
          {currentPageItems?.map((application, rowIndex) => {
            return (
              <Tbody
                key={application.id}
                isExpanded={isCellExpanded(application)}
              >
                <Tr {...getTrProps({ item: application })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={application}
                    rowIndex={rowIndex}
                  >
                    <Td width={25} {...getTdProps({ columnKey: "name" })}>
                      {application.name}
                    </Td>
                    <Td
                      width={25}
                      {...getTdProps({ columnKey: "description" })}
                    >
                      {application.description}
                    </Td>
                    <Td
                      width={20}
                      {...getTdProps({ columnKey: "businessService" })}
                    >
                      {application.businessService?.name}
                    </Td>
                    <Td width={20} {...getTdProps({ columnKey: "owner" })}>
                      {application.owner?.name}
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              </Tbody>
            );
          })}
        </ConditionalTableBody>
      </Table>
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="submit"
          variant="primary"
          isDisabled={!isNewerSelection()}
        >
          Save
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant="link"
          isDisabled={false}
          onClick={onClose}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
