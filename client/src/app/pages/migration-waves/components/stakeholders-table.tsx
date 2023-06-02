import React from "react";
import { WaveWithStatus, Role } from "@app/api/models";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";

export interface IWaveStakeholdersTableProps {
  migrationWave: WaveWithStatus;
}

export const WaveStakeholdersTable: React.FC<IWaveStakeholdersTableProps> = ({
  migrationWave,
}) => {
  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: migrationWave.allStakeholders,
    columnNames: {
      name: "Name",
      jobFunction: "Job Function",
      role: "Role",
      email: "Email",
      groups: "Stakeholder groups",
    },
    hasActionsColumn: true,
    getSortValues: (stakeholder) => ({
      name: stakeholder.name || "",
      jobFunction: stakeholder.jobFunction?.name || "",
      role: stakeholder.role || "",
      email: stakeholder.email,
    }),
    sortableColumns: ["name", "jobFunction", "role", "email"],
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
        aria-label={`Stakeholders table for migration wave ${migrationWave.name}`}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "jobFunction" })} />
              <Th {...getThProps({ columnKey: "role" })} />
              <Th {...getThProps({ columnKey: "email" })} />
              <Th {...getThProps({ columnKey: "groups" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={migrationWave.stakeholders.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((stakeholder, rowIndex) => (
              <Tr key={stakeholder.name}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={stakeholder}
                  rowIndex={rowIndex}
                >
                  <Td width={25} {...getTdProps({ columnKey: "name" })}>
                    {stakeholder.name}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "jobFunction" })}>
                    {stakeholder.jobFunction?.name}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "role" })}>
                    {stakeholder.role}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "email" })}>
                    {stakeholder.email}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "groups" })}>
                    {stakeholder?.stakeholderGroups
                      ?.map((group) => group.name)
                      .join(", ")}
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
