import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
  IAction,
  IRow,
  IRowData,
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

  const editRow = (row: Tag) => {
    onEdit(row);
  };

  const deleteRow = (row: Tag) => {
    onDelete(row);
  };

  const defaultActions = (tag: IRowData): IAction[] => [
    {
      title: t("actions.edit"),
      onClick: () => editRow(getRow(tag)),
    },
    {
      title: t("actions.delete"),
      onClick: () => deleteRow(getRow(tag)),
    },
  ];

  return (
    <Table borders={false} aria-label="Tag table" variant="compact" isNested>
      <Thead noWrap>
        <Tr>
          <Th>{t("terms.tagName")}</Th>
          <Td></Td>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((row: IRow) => {
          const rowActions = defaultActions(row);
          return (
            <Tr>
              {row.cells?.map((cell: any) => <Td>{cell.title}</Td>)}
              <Td isActionCell>
                {rowActions && <ActionsColumn items={rowActions} />}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
