import React, { useState } from "react";
import { MigrationWave, Ticket, WaveWithStatus } from "@app/api/models";
import { useTranslation } from "react-i18next";
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  Modal,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import alignment from "@patternfly/react-styles/css/utilities/Alignment/alignment";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { SimplePagination } from "@app/components/SimplePagination";
import { useHistory } from "react-router-dom";
import { useFetchTickets } from "@app/queries/tickets";
import { TicketIssue } from "./ticket-issue";
import { useDeleteTicketMutation } from "@app/queries/migration-waves";
import UnlinkIcon from "@patternfly/react-icons/dist/esm/icons/unlink-icon";

type SetCellExpandedArgs = {
  item: WaveWithStatus;
  isExpanding?: boolean;
  columnKey?:
    | "stakeholders"
    | "applications"
    | "name"
    | "startDate"
    | "endDate"
    | "status";
};

export interface IWaveStatusTableProps {
  migrationWave: WaveWithStatus;
  removeApplication: (migrationWave: MigrationWave, id: number) => void;
  setCellExpanded: (args: SetCellExpandedArgs) => void;
}

export const WaveStatusTable: React.FC<IWaveStatusTableProps> = ({
  migrationWave,
  removeApplication,
  setCellExpanded,
}) => {
  const { t } = useTranslation();
  const [codeModalState, setCodeModalState] = useState<
    string | null | undefined
  >("");
  const history = useHistory();

  const { tickets } = useFetchTickets();
  const { mutate: deleteTicket } = useDeleteTicketMutation();

  const tableControls = useLocalTableControls({
    tableName: "wave-applications-table",
    idProperty: "name",
    items: migrationWave.fullApplications,
    columnNames: {
      appName: "Application name",
      status: "Status",
      issue: "Issue",
    },
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    getSortValues: (app) => ({
      appName: app.name || "",
      status: app.comments || "",
      issue: "",
    }),
    sortableColumns: ["appName", "status", "issue"],
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

  const getTicketByApplication = (tickets: Ticket[], id: number = 0) =>
    tickets.find((ticket) => ticket.application?.id === id);

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
      <Table
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
          isNoData={migrationWave.applications.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((app, rowIndex) => {
              const ticket = getTicketByApplication(tickets, app.id);
              return (
                <Tr key={app.name} {...getTrProps({ item: app })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={app}
                    rowIndex={rowIndex}
                  >
                    <Td width={20} {...getTdProps({ columnKey: "appName" })}>
                      {app.name}
                    </Td>
                    <Td width={20} {...getTdProps({ columnKey: "status" })}>
                      {getTicketByApplication(tickets, app.id)?.error ? (
                        <Button
                          type="button"
                          variant="plain"
                          onClick={() =>
                            setCodeModalState(
                              getTicketByApplication(tickets, app.id)
                                ? getTicketByApplication(tickets, app.id)
                                    ?.message
                                : ""
                            )
                          }
                        >
                          Error
                        </Button>
                      ) : (
                        getTicketByApplication(tickets, app?.id)?.status || ""
                      )}
                    </Td>
                    <Td width={30} {...getTdProps({ columnKey: "issue" })}>
                      <TicketIssue
                        ticket={getTicketByApplication(tickets, app.id)}
                      />
                    </Td>
                    <Td className={alignment.textAlignRight}>
                      {ticket?.id && (
                        <Tooltip
                          content={t("message.unlinkTicket")}
                          position="top"
                          entryDelay={1000}
                        >
                          <Button
                            variant="link"
                            icon={<UnlinkIcon />}
                            onClick={() => deleteTicket(ticket.id)}
                          />
                        </Tooltip>
                      )}
                      <Button
                        type="button"
                        variant="plain"
                        onClick={() => {
                          const updatedApplications =
                            migrationWave.applications.filter(
                              (application) => application.id !== app.id
                            );

                          const updatedMigrationWave = {
                            ...migrationWave,
                            applications: updatedApplications,
                          };
                          if (updatedApplications.length === 0) {
                            removeApplication(migrationWave, app.id);
                            setCellExpanded({
                              item: updatedMigrationWave,
                              isExpanding: false,
                              columnKey: "status",
                            });
                          } else {
                            removeApplication(migrationWave, app.id);
                          }
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <Modal
        title={t("composed.error", {
          what: t("terms.issue"),
        })}
        width="50%"
        isOpen={!!codeModalState}
        onClose={() => setCodeModalState(null)}
      >
        <CodeBlock>
          <CodeBlockCode id="code-content">{codeModalState}</CodeBlockCode>
        </CodeBlock>
      </Modal>
    </>
  );
};
