import React from "react";
import { Stakeholder, Wave } from "@app/api/models";
import { useTranslation } from "react-i18next";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { ComposableTableWithControls } from "@app/shared/components/composable-table-with-controls";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import { Button } from "@patternfly/react-core";
import { Td, Tr } from "@patternfly/react-table";
import alignment from "@patternfly/react-styles/css/utilities/Alignment/alignment";

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

  //TODO: Make dynamic
  const columnNames = {
    name: "Name",
    jobFunction: "Job Function",
    role: "Role",
    email: "Email",
    groups: "Stakeholder groups",
    actions: "",
  };

  const getSortValues = (item: Stakeholder) => [
    item?.name || "",
    item?.jobFunction?.name || "",
    //TODO: Add role
    "",
    "",
    "", // Action column
  ];

  // TODO add sort stuff to ComposableTableWithControls
  const { sortBy, onSort, sortedItems } = useSortState(
    stakeholders,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  return (
    <ComposableTableWithControls
      variant="compact"
      aria-label={`Stakeholders table for wave ${wave.name}`}
      columnNames={columnNames}
      hasActionsColumn
      paginationProps={paginationProps}
      withoutBottomPagination={true}
      isNoData={stakeholders.length === 0}
      renderTableBody={() => (
        <>
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
        </>
      )}
    />
  );
};
