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
} from "@patternfly/react-table";
import { Tag, TagCategory } from "@app/api/models";
import "./tag-table.css";

export interface TabTableProps {
  tagCategory: TagCategory;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export const TagTable: React.FC<TabTableProps> = ({
  tagCategory,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <Table borders={false} aria-label="Tag table" variant="compact" isNested>
      <Thead noWrap>
        <Tr>
          <Th>{t("terms.tagName")}</Th>
          <Td />
        </Tr>
      </Thead>
      <Tbody>
        {(tagCategory.tags || [])
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((tag) => (
            <Tr key={tag.name}>
              <Td>{tag.name}</Td>
              <Td isActionCell>
                <ActionsColumn
                  items={[
                    {
                      title: t("actions.edit"),
                      onClick: () => onEdit(tag),
                    },
                    {
                      title: t("actions.delete"),
                      onClick: () => onDelete(tag),
                    },
                  ]}
                />
              </Td>
            </Tr>
          ))}
      </Tbody>
    </Table>
  );
};
