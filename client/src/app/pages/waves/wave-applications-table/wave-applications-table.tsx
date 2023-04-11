import React from "react";
import { Application, Wave } from "@app/api/models";
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
import { ConditionalTableBody } from "@app/shared/components/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";

export interface IWaveApplicationsTableProps {
  wave: Wave;
  applications: Application[];
}

export const WaveApplicationsTable: React.FC<IWaveApplicationsTableProps> = ({
  wave,
  applications,
}) => {
  const { t } = useTranslation();
  const columnNames = {
    appName: "Name",
    description: "Description",
    businessService: "Business service",
    owner: "Owner",
  } as const;

  const {
    numRenderedColumns,
    paginationState: {
      paginationProps, // TODO maybe paginationProps should be in propHelpers and not part of the responsibility of usePaginationState
      currentPageItems,
    },
    propHelpers: { toolbarProps, paginationToolbarItemProps, tableProps },
  } = useTableControls({
    items: applications,
    columnNames,
    hasActionsColumn: true,
    getSortValues: (app) => ({
      appName: app.name || "",
      description: "", // TODO
      businessService: app.businessService?.name || "",
      owner: "", // TODO
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
        aria-label={`Applications table for wave ${wave.name}`}
      >
        <Thead>
          <Tr>
            {/* TODO is there any way we can abstract this Thead into a component? how do we make sure we can still put modifier props on the Th for each column? */}
            {/* TODO implement sorting first so we can see how that fits into the abstraction */}
            {Object.keys(columnNames).map((columnKey) => (
              <Th key={columnKey}>
                {columnNames[columnKey as keyof typeof columnNames]}
              </Th>
            ))}
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={applications.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((app) => (
              <Tr key={app.name}>
                <Td width={25} dataLabel={columnNames.appName}>
                  {app.name}
                </Td>
                <Td width={10} dataLabel={columnNames.description}>
                  {app.description}
                </Td>
                <Td width={10} dataLabel={columnNames.businessService}>
                  {app?.businessService?.name}
                </Td>
                <Td width={10} dataLabel={columnNames.owner}>
                  TODO: Owner
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
