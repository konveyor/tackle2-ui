import React from "react";
import { Application, Stakeholder, Wave } from "@app/api/models";
import { useTranslation } from "react-i18next";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { ComposableTableWithControls } from "@app/shared/components/composable-table-with-controls";
import { IComposableRow } from "@app/shared/components/composable-table-with-controls/composable-table-with-controls";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import { Button } from "@patternfly/react-core";

export interface IWaveStakeholdersTableProps {
  stakeholders: Stakeholder[];
}

export const WaveStakeholdersTable: React.FC<IWaveStakeholdersTableProps> = ({
  stakeholders,
}) => {
  const { t } = useTranslation();
  console.log("what is going on here - stakeholders", stakeholders);

  //TODO: Make dynamic
  const columnNames = {
    name: "Name",
    jobFunction: "Job Function",
    role: "role",
    owner: "Stakeholders",
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

  const { sortBy, onSort, sortedItems } = useSortState(
    stakeholders,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const rows: IComposableRow[] = [];
  currentPageItems?.forEach((item, index) => {
    rows.push({
      id: item.name,
      cells: [
        {
          id: "name",
          title: item.name,
          width: 25,
        },
        {
          id: "jobFunction",
          title: item.jobFunction?.name,
          width: 10,
        },
        {
          id: "role",
          title: "TODO: Role",
          width: 10,
        },
        {
          id: "email",
          title: item.email,
          width: 10,
        },
        {
          id: "groups",
          title: item?.stakeholderGroups?.length?.toString(),
          width: 10,
        },
        {
          children: (
            <Button type="button" variant="plain" onClick={() => {}}>
              <TrashIcon />
            </Button>
          ),
          width: 10,
          style: { textAlign: "right" },
        },
      ],
    });
  });

  return (
    <ComposableTableWithControls
      variant="compact"
      rowItems={rows}
      columnNames={columnNames}
      paginationProps={paginationProps}
      withoutBottomPagination={true}
    ></ComposableTableWithControls>
  );
};
