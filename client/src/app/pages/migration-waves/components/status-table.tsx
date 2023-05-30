import React, { useState } from "react";
import { Application, Tracker, MigrationWave, Ticket } from "@app/api/models";
import { useTranslation } from "react-i18next";
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  Modal,
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
import { getTrackerTypesByProjectId } from "@app/queries/trackers";

export interface IWaveStatusTableProps {
  migrationWave: MigrationWave;
  applications: Application[];
  trackers: Tracker[];
  tickets: Ticket[];
  getTicket: (tickets: Ticket[], id: number) => Ticket | undefined;
  removeApplication: (migrationWave: MigrationWave, id: number) => void;
}

export const WaveStatusTable: React.FC<IWaveStatusTableProps> = ({
  migrationWave,
  applications,
  trackers,
  tickets,
  getTicket,
  removeApplication,
}) => {
  const { t } = useTranslation();
  const [codeModalState, setCodeModalState] = useState<
    string | null | undefined
  >("");

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

  const getTicketStatus = (appId: number) => {
    const status = getTicket(tickets, appId)?.status;
    return status === "" ? "Creating issue" : status;
  };

  const getTicketIssue = (appId: number | undefined) => {
    if (appId) {
      const ticket = getTicket(tickets, appId);
      if (ticket) {
        const types = getTrackerTypesByProjectId(
          trackers,
          ticket.tracker.name,
          ticket.parent
        );
        const type = types.find((kind) => kind.id === ticket.kind);
        if (type) return type.name;
      }
    }
    return "";
  };

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
                    {getTicket(tickets, app.id)?.error ? (
                      <Button
                        type="button"
                        variant="plain"
                        onClick={() =>
                          setCodeModalState(
                            getTicket(tickets, app.id)
                              ? getTicket(tickets, app.id)?.message
                              : ""
                          )
                        }
                      >
                        Error
                      </Button>
                    ) : (
                      getTicketStatus(app.id)
                    )}
                  </Td>
                  <Td width={20} {...getTdProps({ columnKey: "issue" })}>
                    {getTicketIssue(app.id)}
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
      </TableComposable>
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
