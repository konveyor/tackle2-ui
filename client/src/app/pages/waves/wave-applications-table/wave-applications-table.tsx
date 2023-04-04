import React from "react";
import { Application } from "@app/api/models";
import { useTranslation } from "react-i18next";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { ComposableTableWithControls } from "@app/shared/components/composable-table-with-controls";
import { IComposableRow } from "@app/shared/components/composable-table-with-controls/composable-table-with-controls";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import { Button } from "@patternfly/react-core";

export interface IWaveApplicationsTableProps {
  applications: Application[];
}

export const WaveApplicationsTable: React.FC<IWaveApplicationsTableProps> = ({
  applications,
}) => {
  const { t } = useTranslation();
  const columnNames = {
    appName: "Name",
    description: "Description",
    businessService: "Business service",
    owner: "Owner",
    actions: "",
  };

  const getSortValues = (item: Application) => [
    item?.name || "",
    "",
    item?.businessService?.name || "",
    //TODO: Add owner
    "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    applications,
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
          id: "appName",
          title: item.name,
          width: 25,
        },
        {
          id: "description",
          title: item.description,
          width: 10,
        },
        {
          id: "businessServiceName",
          title: item?.businessService?.name,
          width: 10,
        },
        {
          id: "owner",
          title: "TODO: Owner",
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
