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
import { ConditionalTableBody } from "@app/shared/components/table-controls";

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

  const columnNames = {
    name: "Name",
    jobFunction: "Job Function",
    role: "Role",
    email: "Email",
    groups: "Stakeholder groups",
  } as const;

  const {
    numRenderedColumns,
    paginationState: { paginationProps, currentPageItems },
    propHelpers: { toolbarProps, paginationToolbarItemProps, tableProps },
  } = useTableControls({
    items: stakeholders,
    columnNames,
    hasActionsColumn: true,
    getSortValues: (stakeholder) => ({
      name: stakeholder.name || "",
      jobFunction: stakeholder.jobFunction?.name || "",
      role: "", // TODO
      email: "", // TODO
      groups: "", // TODO
    }),
    hasPagination: true,
    variant: "compact",
  });

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
          {/* TODO is there any way we can abstract this Thead into a component? how do we make sure we can still put modifier props on the Th for each column? */}
          {Object.keys(columnNames).map((columnKey) => (
            <Th key={columnKey}>
              {columnNames[columnKey as keyof typeof columnNames]}
            </Th>
          ))}
        </Thead>
        <ConditionalTableBody
          isNoData={stakeholders.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((stakeholder) => (
              <Tr key={stakeholder.name}>
                <Td width={25} dataLabel={columnNames.name}>
                  {stakeholder.name}
                </Td>
                <Td width={10} dataLabel={columnNames.jobFunction}>
                  {stakeholder.jobFunction?.name}
                </Td>
                <Td width={10} dataLabel={columnNames.role}>
                  TODO: Role
                </Td>
                <Td width={10} dataLabel={columnNames.email}>
                  {stakeholder.email}
                </Td>
                <Td width={10} dataLabel={columnNames.groups}>
                  {stakeholder?.stakeholderGroups?.length?.toString()}
                </Td>
                <Td width={10} className={alignment.textAlignRight}>
                  <Button type="button" variant="plain" onClick={() => {}}>
                    <TrashIcon />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </TableComposable>
    </>
  );
};
