import React, { useState } from "react";
import { MigrationWave, Ticket, WaveWithStatus } from "@app/api/models";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  CodeBlock,
  CodeBlockCode,
  Modal,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
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
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { useHistory } from "react-router-dom";
import { useFetchTickets } from "@app/queries/tickets";
import { Paths } from "@app/Paths";
import { TicketIssue } from "./ticket-issue";

export interface IWaveStatusTableProps {
  migrationWave: WaveWithStatus;
  removeApplication: (migrationWave: MigrationWave, id: number) => void;
}

export const WaveStatusTable: React.FC<IWaveStatusTableProps> = ({
  migrationWave,
  removeApplication,
}) => {
  const { t } = useTranslation();
  const [codeModalState, setCodeModalState] = useState<
    string | null | undefined
  >("");
  const history = useHistory();

  const { tickets } = useFetchTickets();

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: migrationWave.fullApplications,
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
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="Create a tracker and/or add applications to the migration wave." />
              <div className="pf-v5-u-text-align-center">
                <Button
                  type="button"
                  id="create-tracker"
                  aria-label="Create Tracker"
                  variant={ButtonVariant.primary}
                  onClick={() => {
                    history.push(Paths.jira);
                  }}
                >
                  Create Tracker
                </Button>
              </div>
            </div>
          }
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
                    {getTicketByApplication(tickets, app.id)?.error ? (
                      <Button
                        type="button"
                        variant="plain"
                        onClick={() =>
                          setCodeModalState(
                            getTicketByApplication(tickets, app.id)
                              ? getTicketByApplication(tickets, app.id)?.message
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
                  <Td width={20} {...getTdProps({ columnKey: "issue" })}>
                    <TicketIssue
                      ticket={getTicketByApplication(tickets, app.id)}
                    />
                  </Td>
                  <Td className={alignment.textAlignRight}>
                    <Button
                      type="button"
                      variant="plain"
                      onClick={() => removeApplication(migrationWave, app.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
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
