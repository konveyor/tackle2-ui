import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { TablePersistenceKeyPrefix } from "@app/Constants";
import { DevPaths } from "@app/Paths";
import type { AgentRun, AgentRunPhase } from "@app/api/agentic/contract";
import { useHasSomeScopes } from "@app/auth";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useNotifications } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ToolbarBulkExpander } from "@app/components/ToolbarBulkExpander";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { useBulkSelection } from "@app/hooks/selection/useBulkSelection";
import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  useDeleteAgentRunsMutation,
  useFetchAgentRuns,
} from "@app/queries/agent-runs";
import { useFetchApplications } from "@app/queries/applications";
import {
  agenticAgentRunsCreateScopes,
  agenticAgentRunsDeleteScopes,
} from "@app/scopes";
import {
  formatAge,
  formatDuration,
  runApplicationDisplayName,
} from "@app/utils/agentic";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { CreateRunModal } from "./components/CreateRunModal";
import { PhaseLabel } from "./components/PhaseLabel";
import { explanatoryCondition } from "./components/RunConditionSummary";

import "./agent-runs.css";

/** An AgentRun flattened to the fields the table sorts and filters on. */
interface AgentRunRow {
  name: string;
  agent: string;
  application: string;
  phase?: AgentRunPhase;
  reason?: string;
  message?: string;
  isBroken: boolean;
  created: string;
  durationSeconds?: number;
}

// Max ECMAScript time value; anchors the pure age computation in
// getSortValues (the react-hooks/purity rule bans Date.now in render).
const MAX_TIMESTAMP_MS = 8_640_000_000_000_000;

const RUN_PHASES: AgentRunPhase[] = [
  "Pending",
  "Running",
  "Succeeded",
  "Failed",
];

const AgentRunsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = useNotifications();
  const { agentRuns, isLoading, fetchError } = useFetchAgentRuns();
  const { data: applications } = useFetchApplications();
  // Every hub role can list runs; creating one is admin/architect/migrator
  // (tackle2-hub#1119).
  const canCreate = useHasSomeScopes(agenticAgentRunsCreateScopes);
  const canDelete = useHasSomeScopes(agenticAgentRunsDeleteScopes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);

  const rows = useMemo<AgentRunRow[]>(() => {
    const applicationsById = new Map(
      applications.map((app) => [String(app.id), app])
    );
    return agentRuns.map((run: AgentRun) => {
      const condition = explanatoryCondition(run.status?.conditions);
      return {
        name: run.metadata.name ?? "",
        agent: run.spec.agentRef,
        application: runApplicationDisplayName(run, applicationsById),
        phase: run.status?.phase,
        reason: condition?.reason,
        message: condition?.message,
        isBroken: run.status?.phase === "Failed" || condition !== undefined,
        created: run.metadata.creationTimestamp ?? "",
        durationSeconds: run.status?.duration,
      };
    });
  }, [agentRuns, applications]);

  const applicationOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.application).filter(Boolean))].sort(),
    [rows]
  );

  const tableControls = useLocalTableControls({
    tableName: "agent-runs-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.agentRuns,
    idProperty: "name",
    dataNameProperty: "name",
    items: rows,
    isLoading,
    variant: "compact",
    columnNames: {
      name: t("terms.name"),
      agent: t("terms.agent"),
      application: t("terms.application"),
      phase: t("terms.phase"),
      reason: t("terms.reason"),
      age: t("terms.age"),
      duration: t("terms.duration"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isSelectionEnabled: canDelete,
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", { what: t("terms.name").toLowerCase() }) +
          "...",
        getItemValue: (row) => row.name,
      },
      {
        categoryKey: "application",
        title: t("terms.application"),
        type: FilterType.multiselect,
        logicOperator: "OR",
        selectOptions: applicationOptions.map((name) => ({ value: name })),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.application").toLowerCase(),
          }) + "...",
        // Exact match — the default substring matcher would conflate
        // applications whose names prefix each other.
        matcher: (filter, row) => row.application === filter,
      },
      {
        categoryKey: "phase",
        title: t("terms.phase"),
        type: FilterType.multiselect,
        logicOperator: "OR",
        selectOptions: RUN_PHASES.map((phase) => ({ value: phase })),
        placeholderText:
          t("actions.filterBy", { what: t("terms.phase").toLowerCase() }) +
          "...",
        matcher: (filter, row) => row.phase === filter,
      },
      {
        categoryKey: "health",
        title: t("terms.status"),
        type: FilterType.multiselect,
        selectOptions: [
          { value: "broken", label: t("agentic.agentRuns.brokenRuns") },
        ],
        getItemValue: (row) => (row.isBroken ? "broken" : ""),
      },
    ],
    sortableColumns: ["name", "agent", "application", "age"],
    getSortValues: (row) => ({
      name: row.name,
      agent: row.agent,
      application: row.application,
      // Ascending "age" must read newest-first, and the inversion has to
      // stay positive — universalComparator string-compares with numeric
      // collation, which mangles negated timestamps.
      age: row.created
        ? MAX_TIMESTAMP_MS - Date.parse(row.created)
        : Number.MAX_SAFE_INTEGER,
    }),
    initialSort: { columnKey: "age", direction: "asc" },
  });

  const {
    filteredItems,
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      toolbarBulkExpanderProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  const {
    selectedItems,
    propHelpers: { toolbarBulkSelectorProps, getSelectCheckboxTdProps },
  } = useBulkSelection({
    isEqual: (a: AgentRunRow, b: AgentRunRow) => a.name === b.name,
    items: rows,
    filteredItems,
    currentPageItems,
  });

  const terminalFilteredItems = (filteredItems ?? rows).filter(
    (row) => row.phase === "Succeeded" || row.phase === "Failed"
  );
  const activeDeleteCount =
    deleteTarget?.filter(
      (name) =>
        rows.find((row) => row.name === name)?.phase === "Pending" ||
        rows.find((row) => row.name === name)?.phase === "Running"
    ).length ?? 0;

  const deleteMutation = useDeleteAgentRunsMutation(
    (names) => {
      setDeleteTarget(null);
      toolbarBulkSelectorProps.onSelectNone();
      pushNotification({
        title: t("agentic.agentRuns.deleteSuccess", { count: names.length }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const openRun = (name: string) => {
    history.push(formatPath(DevPaths.agentRunDetails, { runName: name }));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.agentRuns")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && agentRuns.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar {...toolbarProps}>
            <ToolbarContent>
              {canDelete && (
                <>
                  <ToolbarBulkExpander {...toolbarBulkExpanderProps} />
                  <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
                </>
              )}
              <FilterToolbar {...filterToolbarProps} />
              {canDelete && (
                <ToolbarGroup variant="action-group">
                  <ToolbarItem>
                    <Button
                      variant="secondary"
                      isDanger
                      isDisabled={selectedItems.length === 0}
                      onClick={() =>
                        setDeleteTarget(selectedItems.map((row) => row.name))
                      }
                    >
                      {t("agentic.agentRuns.deleteSelected")}
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      isDanger
                      isDisabled={terminalFilteredItems.length === 0}
                      onClick={() =>
                        setDeleteTarget(
                          terminalFilteredItems.map((row) => row.name)
                        )
                      }
                    >
                      {t("agentic.agentRuns.clearTerminalWithCount", {
                        count: terminalFilteredItems.length,
                      })}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              )}
              {canCreate && (
                <ToolbarGroup variant="action-group">
                  <ToolbarItem>
                    <Button
                      variant="primary"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      {t("agentic.agentRuns.createRun")}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              )}
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="agent-runs-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Table {...tableProps} aria-label={t("terms.agentRuns")}>
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "agent" })} />
                  <Th {...getThProps({ columnKey: "application" })} />
                  <Th {...getThProps({ columnKey: "phase" })} />
                  <Th {...getThProps({ columnKey: "reason" })} />
                  <Th {...getThProps({ columnKey: "age" })} />
                  <Th {...getThProps({ columnKey: "duration" })} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isLoading}
              isError={!!fetchError}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState
                  headingLevel="h2"
                  icon={CubesIcon}
                  titleText={t("agentic.agentRuns.emptyTitle")}
                >
                  <EmptyStateBody>
                    {t("agentic.agentRuns.emptyBody")}
                  </EmptyStateBody>
                  {canCreate && (
                    <Button
                      variant="primary"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      {t("agentic.agentRuns.createRun")}
                    </Button>
                  )}
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems.map((row, rowIndex) => (
                  <Tr key={row.name} {...getTrProps({ item: row })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      getSelectCheckboxTdProps={
                        canDelete ? getSelectCheckboxTdProps : undefined
                      }
                      item={row}
                      rowIndex={rowIndex}
                    >
                      <Td {...getTdProps({ columnKey: "name" })}>
                        <Link
                          to={formatPath(DevPaths.agentRunDetails, {
                            runName: row.name,
                          })}
                        >
                          {row.name}
                        </Link>
                      </Td>
                      <Td {...getTdProps({ columnKey: "agent" })}>
                        {row.agent}
                      </Td>
                      <Td {...getTdProps({ columnKey: "application" })}>
                        {row.application || "-"}
                      </Td>
                      <Td {...getTdProps({ columnKey: "phase" })}>
                        <PhaseLabel phase={row.phase} />
                      </Td>
                      <Td {...getTdProps({ columnKey: "reason" })}>
                        {row.reason ? (
                          row.message ? (
                            <Tooltip content={row.message}>
                              <span>{row.reason}</span>
                            </Tooltip>
                          ) : (
                            row.reason
                          )
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td {...getTdProps({ columnKey: "age" })}>
                        {formatAge(row.created)}
                      </Td>
                      <Td {...getTdProps({ columnKey: "duration" })}>
                        {formatDuration(row.durationSeconds)}
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                ))}
              </Tbody>
            </ConditionalTableBody>
          </Table>
        </ConditionalRender>
      </PageSection>

      {isCreateOpen && (
        <CreateRunModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(name) => {
            setIsCreateOpen(false);
            openRun(name);
          }}
        />
      )}

      <ConfirmDialog
        title={t("agentic.agentRuns.deleteTitle", {
          count: deleteTarget?.length ?? 0,
        })}
        titleIconVariant="warning"
        isOpen={deleteTarget !== null}
        message={
          <>
            <Content component="p">
              {t("agentic.agentRuns.deleteMessage", {
                count: deleteTarget?.length ?? 0,
              })}
            </Content>
            {activeDeleteCount > 0 && (
              <Content component="p">
                {t("agentic.agentRuns.activeDeleteWarning", {
                  count: activeDeleteCount,
                })}
              </Content>
            )}
            <Content component="p">{t("dialog.message.delete")}</Content>
          </>
        }
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        inProgress={deleteMutation.isLoading}
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.length) deleteMutation.mutate(deleteTarget);
        }}
      />
    </>
  );
};

export default AgentRunsPage;
