import React from "react";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import alignment from "@patternfly/react-styles/css/utilities/Alignment/alignment";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import { MigrationWave, WaveWithStatus } from "@app/api/models";

export interface IWaveApplicationsTableProps {
  migrationWave: WaveWithStatus;
  removeApplication: (migrationWave: MigrationWave, id: number) => void;
}

export const WaveApplicationsTable: React.FC<IWaveApplicationsTableProps> = ({
  migrationWave,
  removeApplication,
}) => {
  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: migrationWave.fullApplications,
    columnNames: {
      appName: "Name",
      description: "Description",
      businessService: "Business service",
      owner: "Owner",
    },
    hasActionsColumn: true,
    getSortValues: (app) => ({
      appName: app.name || "",
      businessService: app.businessService?.name || "",
      owner: app.owner?.name || "",
    }),
    sortableColumns: ["appName", "businessService", "owner"],
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
            {currentPageItems?.map((app, rowIndex) => (
              <Tr key={app.name}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={app}
                  rowIndex={rowIndex}
                >
                  <Td width={15} {...getTdProps({ columnKey: "appName" })}>
                    {app.name}
                  </Td>
                  <Td width={15} {...getTdProps({ columnKey: "description" })}>
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
    </>
  );
};
