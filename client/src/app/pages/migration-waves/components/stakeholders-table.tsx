import React from "react";
import { Stakeholder, MigrationWave } from "@app/api/models";
import { useTranslation } from "react-i18next";
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
  migrationWave: MigrationWave;
  stakeholders: Stakeholder[];
}

type Role = "Owner" | "Contributor" | null;

export const WaveStakeholdersTable: React.FC<IWaveStakeholdersTableProps> = ({
  migrationWave,
  stakeholders,
}) => {
  const { t } = useTranslation();

  const getRole = (stakeholder: Stakeholder): Role => {
    if (stakeholder.owns && stakeholder.owns.length > 0) return "Owner";
    if (stakeholder.contributes && stakeholder.contributes.length > 0)
      return "Contributor";
    return null;
  };

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: stakeholders,
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
      role: getRole(stakeholder) as string,
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
          isNoData={stakeholders.length === 0}
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
                    {getRole(stakeholder)}
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
