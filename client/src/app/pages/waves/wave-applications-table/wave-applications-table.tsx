import React from "react";
import { Application, Wave } from "@app/api/models";
import { useTranslation } from "react-i18next";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { ComposableTableWithControls } from "@app/shared/components/composable-table-with-controls";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import { Button } from "@patternfly/react-core";
import { Tbody, Td, Tr } from "@patternfly/react-table";
import alignment from "@patternfly/react-styles/css/utilities/Alignment/alignment";

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

  const getSortValues = (item: Application) => [
    item?.name || "",
    "",
    item?.businessService?.name || "",
    //TODO: Add owner
    "",
    "", // Action column
  ];

  // TODO add sort stuff to ComposableTableWithControls
  const { sortBy, onSort, sortedItems } = useSortState(
    applications,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  return (
    <ComposableTableWithControls
      variant="compact"
      aria-label={`Applications table for wave ${wave.name}`}
      columnNames={columnNames}
      hasActionsColumn
      paginationProps={paginationProps}
      withoutBottomPagination={true}
      isNoData={applications.length === 0}
      renderTableBody={() => (
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
      )}
    />
  );
};
