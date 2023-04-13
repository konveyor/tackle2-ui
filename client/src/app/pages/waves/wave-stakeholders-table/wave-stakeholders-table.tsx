import React from "react";
import { Stakeholder, Wave } from "@app/api/models";
import { useTranslation } from "react-i18next";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {
  Button,
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
import { useTableControls } from "@app/shared/hooks/use-table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";

export interface IWaveStakeholdersTableProps {
  wave: Wave;
  stakeholders: Stakeholder[];
}

export const WaveStakeholdersTable: React.FC<IWaveStakeholdersTableProps> = ({
  wave,
  stakeholders,
}) => {
  const { t } = useTranslation();
  console.log("what is going on here - stakeholders", stakeholders);

  const tableControls = useTableControls({
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
      role: "", // TODO
      email: "", // TODO
      groups: "", // TODO
    }),
    sortableColumns: ["name", "jobFunction", "role", "email"],
    hasPagination: true,
    variant: "compact",
  });
  const {
    numRenderedColumns,
    paginationState: { paginationProps, currentPageItems },
    propHelpers: {
      toolbarProps,
      paginationToolbarItemProps,
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
              idPrefix={`expanded-wave-${wave.name}-apps-table`}
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable
        {...tableProps}
        aria-label={`Stakeholders table for wave ${wave.name}`}
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
                    TODO: Role
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "email" })}>
                    {stakeholder.email}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "groups" })}>
                    {stakeholder?.stakeholderGroups?.length?.toString()}
                  </Td>
                  <Td width={10} className={alignment.textAlignRight}>
                    <Button type="button" variant="plain" onClick={() => {}}>
                      <TrashIcon />
                    </Button>
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
