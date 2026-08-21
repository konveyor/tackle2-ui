import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import {
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { TablePersistenceKeyPrefix } from "@app/Constants";
import { DevPaths } from "@app/Paths";
import type { AgentRun, AgentRunPhase } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchAgentRuns } from "@app/queries/agent-runs";
import { useFetchApplications } from "@app/queries/applications";
import {
  formatAge,
  formatDuration,
  runApplicationDisplayName,
} from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

import { CreateRunModal } from "./components/CreateRunModal";
import { PhaseLabel } from "./components/PhaseLabel";

import "./agent-runs.css";

/** An AgentRun flattened to the fields the table sorts and filters on. */
interface AgentRunRow {
  name: string;
  agent: string;
  application: string;
  phase?: AgentRunPhase;
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
  const { agentRuns, isLoading, fetchError } = useFetchAgentRuns();
  const { data: applications } = useFetchApplications();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const rows = useMemo<AgentRunRow[]>(() => {
    const applicationsById = new Map(
      applications.map((app) => [String(app.id), app])
    );
    return agentRuns.map((run: AgentRun) => ({
      name: run.metadata.name ?? "",
      agent: run.spec.agentRef,
      application: runApplicationDisplayName(run, applicationsById),
      phase: run.status?.phase,
      created: run.metadata.creationTimestamp ?? "",
      durationSeconds: run.status?.duration,
    }));
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
      age: t("terms.age"),
      duration: t("terms.duration"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
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
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
  } = tableControls;

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
              <FilterToolbar {...filterToolbarProps} />
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
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    {t("agentic.agentRuns.createRun")}
                  </Button>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems.map((row, rowIndex) => (
                  <Tr key={row.name} {...getTrProps({ item: row })}>
                    <TableRowContentWithControls
                      {...tableControls}
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
    </>
  );
};

export default AgentRunsPage;
