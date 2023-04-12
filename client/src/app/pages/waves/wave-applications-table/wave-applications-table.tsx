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
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
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

  const tableControls = useTableControls({
    items: applications,
    columnNames: {
      appName: "Name",
      description: "Description",
      businessService: "Business service",
      owner: "Owner",
    },
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
  const {
    numRenderedColumns,
    paginationState: {
      paginationProps, // TODO maybe paginationProps should be in propHelpers and not part of the responsibility of usePaginationState
      currentPageItems,
    },
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
        aria-label={`Applications table for wave ${wave.name}`}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "appName", isSortable: true })} />
              <Th
                {...getThProps({ columnKey: "description", isSortable: true })}
              />
              <Th
                {...getThProps({
                  columnKey: "businessService",
                  isSortable: true,
                })}
              />
              <Th {...getThProps({ columnKey: "owner", isSortable: true })} />
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
                  <Td width={25} {...getTdProps({ columnKey: "appName" })}>
                    {app.name}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "description" })}>
                    {app.description}
                  </Td>
                  <Td
                    width={10}
                    {...getTdProps({ columnKey: "businessService" })}
                  >
                    {app?.businessService?.name}
                  </Td>
                  <Td width={10} {...getTdProps({ columnKey: "owner" })}>
                    TODO: Owner
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
