import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  DropdownToggleCheckbox,
} from "@patternfly/react-core";

export interface IToolbarBulkSelectorProps {
  pageSize: number;
  totalItems: number;
  totalSelectedRows: number;
  areAllRowsSelected: boolean;
  onSelectNone: () => void;
  onSelectCurrentPage: () => void;
  onSelectAll: () => void;

  isFetching: boolean;
  fetchError?: any;
}

export const ToolbarBulkSelector: React.FC<IToolbarBulkSelectorProps> = ({
  pageSize,
  totalItems,
  areAllRowsSelected,
  totalSelectedRows,
  onSelectNone,
  onSelectCurrentPage,
  onSelectAll,

  isFetching,
  fetchError,
}) => {
  // i18
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const onDropDownSelect = () => {
    setIsOpen((current) => !current);
  };

  const onDropDownToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  if (fetchError) {
    return (
      <Dropdown
        toggle={<DropdownToggle isDisabled>Error</DropdownToggle>}
        isOpen={false}
        dropdownItems={[]}
      />
    );
  }

  return (
    <Dropdown
      isOpen={isOpen}
      position={DropdownPosition.left}
      onSelect={onDropDownSelect}
      dropdownItems={[
        <DropdownItem key="item-1" onClick={onSelectNone}>
          {t("actions.selectNone")} (0 items)
        </DropdownItem>,
        <DropdownItem key="item-2" onClick={onSelectCurrentPage}>
          {t("actions.selectPage")} ({pageSize} items)
        </DropdownItem>,
        <DropdownItem key="item-3" onClick={onSelectAll}>
          {t("actions.selectAll")} ({totalItems} items)
        </DropdownItem>,
      ]}
      toggle={
        <DropdownToggle
          onToggle={onDropDownToggle}
          isDisabled={isFetching}
          splitButtonItems={[
            <DropdownToggleCheckbox
              id="toolbar-bulk-select"
              key="toolbar-bulk-select"
              aria-label="Select"
              isDisabled={isFetching}
              isChecked={
                areAllRowsSelected
                  ? true
                  : totalSelectedRows === 0
                  ? false
                  : null
              }
              onClick={() => {
                totalSelectedRows > 0 ? onSelectNone() : onSelectAll();
              }}
            ></DropdownToggleCheckbox>,
          ]}
        >
          {totalSelectedRows !== 0 && (
            <>
              {totalSelectedRows} {t("terms.selected").toLowerCase()}
            </>
          )}
        </DropdownToggle>
      }
    />
  );
};
