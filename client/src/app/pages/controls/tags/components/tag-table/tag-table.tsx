import React from "react";
import { useTranslation } from "react-i18next";

import {
  cellWidth,
  IActions,
  ICell,
  IRow,
  IRowData,
  Table,
  TableBody,
  TableHeader,
} from "@patternfly/react-table";

import { Tag, TagCategory } from "@app/api/models";
import "./tag-table.css";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Tag => {
  return rowData[ENTITY_FIELD];
};

export interface TabTableProps {
  tagCategory: TagCategory;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export const TagTable: React.FC<TabTableProps> = ({
  tagCategory: tagCategory,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const columns: ICell[] = [
    {
      title: t("terms.tagName"),
      transforms: [cellWidth(100)],
      cellFormatters: [],
      props: {
        className: "columnPadding",
      },
    },
  ];

  const rows: IRow[] = [];
  (tagCategory.tags || [])
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((item) => {
      rows.push({
        [ENTITY_FIELD]: item,
        noPadding: true,
        cells: [
          {
            title: item.name,
          },
        ],
      });
    });

  // Rows

  const editRow = (row: Tag) => {
    onEdit(row);
  };

  const deleteRow = (row: Tag) => {
    onDelete(row);
  };

  const actions: IActions = [
    {
      title: t("actions.edit"),
      onClick: (
        event: React.MouseEvent,
        rowIndex: number,
        rowData: IRowData
      ) => {
        const row: Tag = getRow(rowData);
        editRow(row);
      },
    },
    {
      title: t("actions.delete"),
      onClick: (
        event: React.MouseEvent,
        rowIndex: number,
        rowData: IRowData
      ) => {
        const row: Tag = getRow(rowData);
        deleteRow(row);
      },
    },
  ];

  return (
    <Table
      borders={false}
      variant="compact"
      aria-label="Tag table"
      cells={columns}
      rows={rows}
      actions={actions}
    >
      <TableHeader />
      <TableBody />
    </Table>
  );
};
