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

import { MigrationWave } from "@app/api/models";
import { ToolbarBulkSelector } from "@app/shared/components";
import { NotificationsContext } from "@app/shared/notifications-context";
import { useFetchApplications } from "@app/queries/applications";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { dedupeFunction } from "@app/utils/utils";
import { useUpdateMigrationWaveMutation } from "@app/queries/migration-waves";

export interface ManageApplicationsFormProps {
  migrationWave: MigrationWave;
  migrationWaves: MigrationWave[];
  onClose: () => void;
}

export const ManageApplicationsForm: React.FC<ManageApplicationsFormProps> = ({
  migrationWave,
  migrationWaves,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { data: applications, isFetching } = useFetchApplications();

  const assignedApplications = migrationWaves
    .filter((wave) => wave.id !== migrationWave.id)
    .map((wave) => wave.applications.map((application) => application.id))
    .flat();

  const availableApplications = applications.filter(
    (application) => !assignedApplications.includes(application.id)
  );

  const onUpdateMigrationWaveSuccess = (
    response: AxiosResponse<MigrationWave>
  ) => {
    pushNotification({
      title: t("toastr.success.save", {
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
    idProperty: "name",
    items: availableApplications,
    columnNames: {
      name: "Application Name",
      description: "Description",
      businessService: "Business service",
      owner: "Owner",
    },
    isSelectable: true,
    expandableVariant: "compound",
    hasActionsColumn: true,
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
      {
        key: "businessService",
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
        key: "owner",
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
    hasPagination: true,
    isLoading: isFetching,
  });
  const {
    currentPageItems,
    numRenderedColumns,
    expansionState: { isCellExpanded },
    selectionState: { selectedItems },
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTdProps,
    },
  } = tableControls;

  const onSubmit = () => {
    const payload: MigrationWave = {
      id: migrationWave?.id,
      applications: selectedItems.map((application) => {
        return { id: application.id, name: application.name };
      }),
      name: migrationWave?.name.trim() || "",
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
          value={migrationWave.name}
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
      <TableComposable {...tableProps} aria-label="Migration waves table">
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
          isLoading={isFetching}
          //   isError={error}
          isNoData={applications.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          {currentPageItems?.map((application, rowIndex) => {
            return (
              <Tbody
                key={application.id}
                isExpanded={isCellExpanded(application)}
              >
                <Tr>
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
      </TableComposable>
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="wave-form-submit"
          variant="primary"
          isDisabled={selectedItems.length < 1 || isFetching}
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
