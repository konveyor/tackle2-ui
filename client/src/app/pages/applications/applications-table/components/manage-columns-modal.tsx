import "./manage-columns-modal.css";

import { useState } from "react";
import {
  Button,
  Content,
  ContentVariants,
  DataList,
  DataListCell,
  DataListCheck,
  DataListControl,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { ColumnState } from "@app/hooks/table-controls/column/useColumnState";

export interface ManagedColumnsProps<TColumnKey extends string> {
  onClose(): void;
  columns: ColumnState<TColumnKey>[];
  setColumns: (newColumns: ColumnState<TColumnKey>[]) => void;
  description?: string;
  saveLabel?: string;
  cancelLabel?: string;
  title?: string;
  restoreLabel?: string;
  defaultColumns: ColumnState<TColumnKey>[];
}

export const ManageColumnsModal = <TColumnKey extends string>({
  description = "Selected columns will be displayed in the table.",
  onClose,
  columns,
  setColumns,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  title = "Manage Columns",
  restoreLabel = "Restore defaults",
  defaultColumns,
}: ManagedColumnsProps<TColumnKey>) => {
  const [editedColumns, setEditedColumns] =
    useState<ColumnState<TColumnKey>[]>(columns);

  const onSelect = (id: TColumnKey, isVisible: boolean): void => {
    setEditedColumns(
      editedColumns.map((col) => ({
        ...col,
        isVisible: col.id === id ? isVisible : col.isVisible,
      }))
    );
  };
  const restoreDefaults = () => setEditedColumns([...defaultColumns]);

  const onSave = () => {
    // If ordering is implemented, update accordingly
    setColumns(editedColumns);
    onClose();
  };

  return (
    <Modal isOpen={true} variant="small" onClose={onClose}>
      <ModalHeader
        title={title}
        description={
          <Content component={ContentVariants.p}>{description}</Content>
        }
      />
      <ModalBody>
        <DataList aria-label={title} id="table-column-management" isCompact>
          {editedColumns.map(({ id, label, isVisible, isIdentity }, index) => (
            <DataListItem key={index}>
              <DataListItemRow className="custom-data-list-item-row">
                <DataListControl>
                  <DataListCheck
                    aria-labelledby={`check-${id}`}
                    checked={isVisible || isIdentity}
                    isDisabled={isIdentity}
                    onChange={(e, checked) => onSelect(id, checked)}
                  />
                </DataListControl>
                <DataListItemCells
                  className="custom-data-list-cell"
                  dataListCells={[
                    <DataListCell key="primary">
                      <span id={`draggable-${id}`}>{label}</span>
                    </DataListCell>,
                  ]}
                />
              </DataListItemRow>
            </DataListItem>
          ))}
        </DataList>
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" onClick={onSave}>
          {saveLabel}
        </Button>
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button key="restore" variant="link" onClick={restoreDefaults}>
          {restoreLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
