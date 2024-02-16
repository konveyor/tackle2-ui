import React from "react";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { SimplePagination } from "@app/components/SimplePagination";
import { MigrationWave, WaveWithStatus } from "@app/api/models";
import { useTranslation } from "react-i18next";
import { useDeleteTicketMutation } from "@app/queries/migration-waves";
import { useFetchTickets } from "@app/queries/tickets";

export interface IWaveApplicationsTableProps {
  migrationWave: WaveWithStatus;
  removeApplication: (migrationWave: MigrationWave, id: number) => void;
}

export const WaveApplicationsTable: React.FC<IWaveApplicationsTableProps> = ({
  migrationWave,
  removeApplication,
}) => {
  const { t } = useTranslation();
  const { mutate: deleteTicket } = useDeleteTicketMutation();
  const { tickets } = useFetchTickets();

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: migrationWave.fullApplications,
    columnNames: {
      appName: "Name",
      description: "Description",
      businessService: "Business service",
      owner: "Owner",
    },
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    getSortValues: (app) => ({
      appName: app.name || "",
      businessService: app.businessService?.name || "",
      owner: app.owner?.name || "",
    }),
    sortableColumns: ["appName", "businessService", "owner"],
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
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <ToolbarItem {...paginationToolbarItemProps}>
            {migrationWave.fullApplications.length > 9 && (
              <SimplePagination
                idPrefix={`expanded-migration-wave-${migrationWave.name}-apps-table`}
                isTop
                paginationProps={paginationProps}
                isCompact
              />
            )}
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table
        {...tableProps}
        aria-label={`Applications table for migration wave ${migrationWave.name}`}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "appName" })} />
              <Th {...getThProps({ columnKey: "description" })} />
              <Th {...getThProps({ columnKey: "businessService" })} />
              <Th {...getThProps({ columnKey: "owner" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={migrationWave.applications.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((app, rowIndex) => {
              const matchingTicket = tickets.find((ticket) => {
                return ticket.application && ticket.application.id === app.id;
              });

              return (
                <Tr key={app.name} {...getTrProps({ item: app })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={app}
                    rowIndex={rowIndex}
                  >
                    <Td width={15} {...getTdProps({ columnKey: "appName" })}>
                      {app.name}
                    </Td>
                    <Td
                      width={15}
                      {...getTdProps({ columnKey: "description" })}
                    >
                      {app.description}
                    </Td>
                    <Td
                      width={15}
                      {...getTdProps({ columnKey: "businessService" })}
                    >
                      {app?.businessService?.name}
                    </Td>
                    <Td width={15} {...getTdProps({ columnKey: "owner" })}>
                      {app?.owner?.name}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t("actions.delete"),
                            onClick: () =>
                              removeApplication(migrationWave, app.id),
                          },
                          matchingTicket && {
                            title: t("actions.unlink"),
                            onClick: () => {
                              matchingTicket?.id &&
                                deleteTicket(matchingTicket?.id);
                            },
                          },
                        ].filter(Boolean)}
                      />
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      {migrationWave.fullApplications.length > 9 && (
        <SimplePagination
          idPrefix={`expanded-migration-wave-${migrationWave.name}-apps-table`}
          isTop={false}
          paginationProps={paginationProps}
          isCompact
        />
      )}
    </>
  );
};
