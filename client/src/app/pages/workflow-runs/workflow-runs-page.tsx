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
import type {
  AgentWorkflowRun,
  AgentWorkflowRunPhase,
} from "@app/api/agentic/contract";
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
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchWorkflowRuns } from "@app/queries/workflow-runs";
import {
  formatAge,
  formatDuration,
  runApplicationDisplayName,
  workflowRunDuration,
} from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

import { CreateWorkflowRunModal } from "./components/CreateWorkflowRunModal";

function stagesSummary(run: AgentWorkflowRun): string {
  const stages = run.status?.stages ?? [];
  if (stages.length === 0) return "-";
  const done = stages.filter((s) => s.phase === "Succeeded").length;
  const current = run.status?.currentStage;
  return `${done}/${stages.length}${current ? ` · ${current}` : ""}`;
}

/** An AgentWorkflowRun flattened to the fields the table sorts and filters on. */
interface WorkflowRunRow {
  name: string;
  workflow: string;
  application: string;
  phase?: AgentWorkflowRunPhase;
  stages: string;
  created: string;
  durationSeconds?: number;
}

// Max ECMAScript time value; anchors the pure age computation in
// getSortValues (the react-hooks/purity rule bans Date.now in render).
const MAX_TIMESTAMP_MS = 8_640_000_000_000_000;

const RUN_PHASES: AgentWorkflowRunPhase[] = [
  "Pending",
  "Running",
  "Succeeded",
  "Failed",
];

const WorkflowRunsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { workflowRuns, isLoading, fetchError } = useFetchWorkflowRuns();
  const { data: applications } = useFetchApplications();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const rows = useMemo<WorkflowRunRow[]>(() => {
    const applicationsById = new Map(
      applications.map((app) => [String(app.id), app])
    );
    return workflowRuns.map((run: AgentWorkflowRun) => ({
      name: run.metadata.name ?? "",
      workflow: run.spec.workflowRef,
      application: runApplicationDisplayName(run, applicationsById),
      phase: run.status?.phase,
      stages: stagesSummary(run),
      created: run.metadata.creationTimestamp ?? "",
      durationSeconds: workflowRunDuration(run),
    }));
  }, [workflowRuns, applications]);

  const applicationOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.application).filter(Boolean))].sort(),
    [rows]
  );

  const tableControls = useLocalTableControls({
    tableName: "workflow-runs-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.agentWorkflowRuns,
    idProperty: "name",
    dataNameProperty: "name",
    items: rows,
    isLoading,
    variant: "compact",
    columnNames: {
      name: t("terms.name"),
      workflow: t("terms.workflow"),
      application: t("terms.application"),
      phase: t("terms.phase"),
      stages: t("terms.stages"),
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
    sortableColumns: ["name", "workflow", "application", "age"],
    getSortValues: (row) => ({
      name: row.name,
      workflow: row.workflow,
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
    history.push(formatPath(DevPaths.workflowRunDetails, { runName: name }));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.workflowRuns")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && workflowRuns.length === 0 && !fetchError}
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
                    {t("agentic.workflowRuns.create")}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="workflow-runs-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Table {...tableProps} aria-label={t("terms.workflowRuns")}>
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "workflow" })} />
                  <Th {...getThProps({ columnKey: "application" })} />
                  <Th {...getThProps({ columnKey: "phase" })} />
                  <Th {...getThProps({ columnKey: "stages" })} />
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
                  titleText={t("agentic.workflowRuns.emptyTitle")}
                >
                  <EmptyStateBody>
                    {t("agentic.workflowRuns.emptyBody")}
                  </EmptyStateBody>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    {t("agentic.workflowRuns.create")}
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
                          to={formatPath(DevPaths.workflowRunDetails, {
                            runName: row.name,
                          })}
                        >
                          {row.name}
                        </Link>
                      </Td>
                      <Td {...getTdProps({ columnKey: "workflow" })}>
                        {row.workflow}
                      </Td>
                      <Td {...getTdProps({ columnKey: "application" })}>
                        {row.application || "-"}
                      </Td>
                      <Td {...getTdProps({ columnKey: "phase" })}>
                        <PhaseLabel phase={row.phase} />
                      </Td>
                      <Td {...getTdProps({ columnKey: "stages" })}>
                        {row.stages}
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
        <CreateWorkflowRunModal
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

export default WorkflowRunsPage;
