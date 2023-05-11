import React from "react";
import { Application, MigrationWave } from "@app/api/models";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import alignment from "@patternfly/react-styles/css/utilities/Alignment/alignment";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";

import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import { KebabDropdown } from "@app/shared/components";
import { useFetchTickets } from "@app/queries/tickets";

export interface IWaveStatusTableProps {
  migrationWave: MigrationWave;
  applications: Application[];
}

export const WaveStatusTable: React.FC<IWaveStatusTableProps> = ({
  migrationWave,
  applications,
}) => {
  const { t } = useTranslation();

  const { tickets } = useFetchTickets();

  const getTicketByApplication = (id: number = 0) =>
    tickets.find((ticket) => ticket.application.id === id);

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: applications,
    columnNames: {
      appName: "Application name",
      status: "Status",
      issue: "Issue",
    },
    hasActionsColumn: true,
    getSortValues: (app) => ({
      appName: app.name || "",
      status: app.comments || "",
      issue: "",
    }),
    sortableColumns: ["appName", "status", "issue"],
    hasPagination: true,
    variant: "compact",
  });
  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix={`expanded-migration-wave-${migrationWave.name}-apps-table`}
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable
        {...tableProps}
        aria-label={`Applications table for migration wave ${migrationWave.name}`}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "appName" })} />
              <Th {...getThProps({ columnKey: "status" })} />
              <Th {...getThProps({ columnKey: "issue" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={applications.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((app, rowIndex) => (
              <Tr key={app.name}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={app}
                  rowIndex={rowIndex}
                >
                  <Td width={20} {...getTdProps({ columnKey: "appName" })}>
                    {app.name}
                  </Td>
                  <Td width={20} {...getTdProps({ columnKey: "status" })}>
                    {getTicketByApplication(app.id)?.status === ""
                      ? "Creating issue"
                      : getTicketByApplication(app.id)?.status}
                  </Td>
                  <Td width={20} {...getTdProps({ columnKey: "issue" })}>
                    {getTicketByApplication(app.id)?.parent}
                  </Td>
                  <Td width={10} className={alignment.textAlignRight}>
                    <Button type="button" variant="plain" onClick={() => {}}>
                      <TrashIcon />
                    </Button>
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </TableComposable>
    </>
  );
};
