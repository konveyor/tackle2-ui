import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleCheckbox,
  ToolbarItem,
} from "@patternfly/react-core";

export interface IToolbarBulkSelectorProps {
  areAllSelected: boolean;
  itemCounts: {
    selected: number;
    page: number;
    filtered?: number;
    totalItems: number;
  };
  onSelectNone: () => void;
  onSelectCurrentPage: () => void;
  onSelectAllFiltered?: () => void;
  onSelectAll?: () => void;
}

/**
 * Selection options:
 *   - Default Button / Select Page
 *   - Split / None, Count: 0
 *   - Split / Page (every record on the current page), Count: records in current page
 *   - (Optional) Split / All Filtered (every record matching the filter), Count: filtered records
 *   - (Optional) Split / All (every record, every page), Count: items size
 *
 * If no handler for the optional action is provided, the action is not rendered.
 */
export const ToolbarBulkSelector = ({
  areAllSelected,
  itemCounts: { totalItems, filtered, page, selected },
  onSelectNone,
  onSelectCurrentPage,
  onSelectAllFiltered,
  onSelectAll,
}: IToolbarBulkSelectorProps): JSX.Element | null => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const handleClose = (handler: () => void) => () => {
    handler();
    setIsOpen(false);
  };

  const isChecked = useMemo(() => {
    if (areAllSelected && totalItems > 0) {
      return true;
    }
    if (selected === 0) {
      return false;
    }
    return null;
  }, [areAllSelected, totalItems, selected]);

  const dropdownItems = [
    <DropdownItem
      onClick={handleClose(onSelectNone)}
      data-action="none"
      key="select-none"
      component="button"
    >
      {t("actions.selectNone")}
    </DropdownItem>,
    <DropdownItem
      onClick={handleClose(onSelectCurrentPage)}
      data-action="page"
      key="select-page"
      component="button"
    >
      {t("actions.selectPage", { count: page })}
    </DropdownItem>,
    onSelectAllFiltered !== undefined && (
      <DropdownItem
        onClick={handleClose(onSelectAllFiltered)}
        data-action="all"
        key="select-all-filtered"
        component="button"
      >
        {t("actions.selectAllFiltered", { count: filtered })}
      </DropdownItem>
    ),
    onSelectAll !== undefined && (
      <DropdownItem
        onClick={handleClose(onSelectAll)}
        data-action="all"
        key="select-all"
        component="button"
      >
        {t("actions.selectAll", { count: totalItems })}
      </DropdownItem>
    ),
  ].filter(Boolean);

  return (
    <ToolbarItem>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={(flag) => setIsOpen(flag)}
        toggle={(toggleRef) => (
          <MenuToggle
            isDisabled={totalItems === 0}
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            splitButtonOptions={{
              items: [
                <MenuToggleCheckbox
                  id="bulk-selected-items-checkbox"
                  key="bulk-select-checkbox"
                  aria-label={t("actions.selectPage", { count: page })}
                  onChange={(checked) => {
                    if (checked) {
                      onSelectCurrentPage();
                    } else {
                      onSelectNone();
                    }
                  }}
                  isChecked={isChecked}
                >
                  {selected === 0
                    ? ""
                    : t("composed.selectedCount", {
                        count: selected,
                      })}
                </MenuToggleCheckbox>,
              ],
            }}
          />
        )}
      >
        <DropdownList>{dropdownItems}</DropdownList>
      </Dropdown>
    </ToolbarItem>
  );
};
