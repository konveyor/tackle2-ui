import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  DropdownToggleCheckbox,
  ToolbarItem,
} from "@patternfly/react-core";

import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";

export interface IToolbarBulkSelectorProps {
  areAllSelected: boolean;
  areAllExpanded?: boolean;
  onSelectAll: (flag: boolean) => void;
  onExpandAll?: (flag: boolean) => void;
  selectedRows: any;
  onSelectMultiple: any;
  currentPageItems: any;
  paginationProps: any;
  isExpandable?: boolean;
}

export const ToolbarBulkSelector: React.FC<IToolbarBulkSelectorProps> = ({
  currentPageItems,
  areAllSelected,
  onSelectAll,
  onExpandAll,
  areAllExpanded,
  selectedRows,
  onSelectMultiple,
  paginationProps,
  isExpandable,
}) => {
  // i18
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const toggleCollapseAll = (collapse: boolean) => {
    onExpandAll && onExpandAll(!collapse);
  };
  const collapseAllBtn = () => (
    <Button
      variant="control"
      title={`${!areAllExpanded ? "Expand" : "Collapse"} all`}
      onClick={() => {
        areAllExpanded !== undefined && toggleCollapseAll(areAllExpanded);
      }}
    >
      {areAllExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
    </Button>
  );

  const getBulkSelectState = () => {
    let state: boolean | null;
    if (areAllSelected) {
      state = true;
    } else if (selectedRows.length === 0) {
      state = false;
    } else {
      state = null;
    }
    return state;
  };
  const [bulkSelectOpen, setBulkSelectOpen] = React.useState(false);
  const handleSelectAll = (checked: boolean) => {
    onSelectAll(!!checked);
  };

  const dropdownItems = [
    <DropdownItem
      onClick={() => {
        handleSelectAll(false);
      }}
      data-action="none"
      key="select-none"
      component="button"
    >
      Select none (0)
    </DropdownItem>,
    <DropdownItem
      onClick={() => {
        onSelectMultiple(
          currentPageItems.map((app: any) => app),
          true
        );
      }}
      data-action="page"
      key="select-page"
      component="button"
    >
      Select page ({currentPageItems.length})
    </DropdownItem>,
    <DropdownItem
      onClick={() => {
        handleSelectAll(true);
      }}
      data-action="all"
      key="select-all"
      component="button"
    >
      Select all ({paginationProps.itemCount})
    </DropdownItem>,
  ];

  return (
    <>
      {isExpandable && <ToolbarItem>{collapseAllBtn()}</ToolbarItem>}
      <ToolbarItem>
        <Dropdown
          toggle={
            <DropdownToggle
              splitButtonItems={[
                <DropdownToggleCheckbox
                  id="bulk-selected-apps-checkbox"
                  key="bulk-select-checkbox"
                  aria-label="Select all"
                  onChange={() => {
                    if (getBulkSelectState() !== false) {
                      onSelectAll(false);
                    } else {
                      onSelectAll(true);
                    }
                  }}
                  isChecked={getBulkSelectState()}
                />,
              ]}
              onToggle={(isOpen) => {
                setBulkSelectOpen(isOpen);
              }}
            />
          }
          isOpen={bulkSelectOpen}
          dropdownItems={dropdownItems}
        />
      </ToolbarItem>
    </>
  );
};
