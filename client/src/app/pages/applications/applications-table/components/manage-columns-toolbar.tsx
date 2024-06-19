import {
  Button,
  OverflowMenu,
  OverflowMenuGroup,
  OverflowMenuItem,
  ToolbarItem,
} from "@patternfly/react-core";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnState } from "@app/hooks/table-controls/column/useColumnState";
import { ManageColumnsModal } from "./manage-columns-modal";
import { ColumnsIcon } from "@patternfly/react-icons";

interface ManageColumnsToolbarProps<TColumnKey extends string> {
  columns: ColumnState<TColumnKey>[];
  defaultColumns: ColumnState<TColumnKey>[];
  setColumns: (newColumns: ColumnState<TColumnKey>[]) => void;
}

export const ManageColumnsToolbar = <TColumnKey extends string>({
  columns,
  setColumns,
  defaultColumns,
}: ManageColumnsToolbarProps<TColumnKey>) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <ToolbarItem>
        <OverflowMenu breakpoint="md">
          <OverflowMenuGroup groupType="button" isPersistent>
            <OverflowMenuItem isPersistent>
              <Button
                variant="plain"
                onClick={() => setIsOpen(true)}
                icon={<ColumnsIcon />}
              ></Button>
            </OverflowMenuItem>
          </OverflowMenuGroup>
        </OverflowMenu>
      </ToolbarItem>
      {isOpen && (
        <ManageColumnsModal
          onClose={() => setIsOpen(false)}
          description={t("message.manageColumnsDescription")}
          setColumns={setColumns}
          columns={columns}
          saveLabel={t("actions.save")}
          cancelLabel={t("actions.cancel")}
          title={t("dialog.title.manageColumns")}
          defaultColumns={defaultColumns}
        />
      )}
    </>
  );
};
