import { FC, useState } from "react";
import {
  Button,
  ButtonProps,
  Divider,
  Dropdown,
  DropdownItemProps,
  DropdownList,
  MenuToggle,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuDropdownItem,
  OverflowMenuDropdownItemProps,
  OverflowMenuGroup,
  OverflowMenuItem,
  OverflowMenuItemProps,
  OverflowMenuProps,
} from "@patternfly/react-core";
/** direct import from dist/esm needed as OverflowMenuContext is not exported via barrel file */
import { OverflowMenuContext } from "@patternfly/react-core/dist/esm/components/OverflowMenu/OverflowMenuContext";
import { EllipsisVIcon } from "@patternfly/react-icons";

import { ConditionalTooltip } from "./ConditionalTooltip";

export type OverflowActionMenuItemProps = {
  itemKey: string;
  isSeparator?: boolean;
  useOnlyIconWhenShared?: boolean;
} & DropdownItemProps &
  Pick<ButtonProps, "variant"> &
  Pick<OverflowMenuDropdownItemProps, "isShared"> &
  Pick<OverflowMenuItemProps, "isPersistent">;

export interface OverflowActionMenuProps {
  toggleId: string;
  toggleAriaLabel: string;
  items: OverflowActionMenuItemProps[];
  breakpoint?: OverflowMenuProps["breakpoint"];
}

/**
 * Divider that follows the overflow menu breakpoint.
 * This allows hiding the divider when the items are moved outside the dropdown
 */
export const OverflowMenuDivider: FC<{ isShared?: boolean }> = ({
  isShared,
}) => (
  <OverflowMenuContext.Consumer>
    {(value) => (!isShared || value.isBelowBreakpoint) && <Divider />}
  </OverflowMenuContext.Consumer>
);

export const OverflowActionMenu: FC<OverflowActionMenuProps> = ({
  toggleId,
  toggleAriaLabel,
  items,
  breakpoint = "lg",
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const onToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const isPersistent = items.some((item) => item.isPersistent);
  const dropdownItems = items.map(
    ({ itemKey, title, isSeparator, isShared, ...rest }) =>
      isSeparator ? (
        <OverflowMenuDivider key={itemKey} isShared={isShared} />
      ) : (
        <OverflowMenuDropdownItem
          key={itemKey}
          {...{
            itemId: itemKey,
            isShared,
            title,
            ...rest,
          }}
        >
          {title}
        </OverflowMenuDropdownItem>
      )
  );
  const sharedItems = items.filter(
    (item) => item.isShared && !item.isSeparator
  );

  return (
    <OverflowMenu breakpoint={breakpoint}>
      <OverflowMenuContent isPersistent={isPersistent}>
        <OverflowMenuGroup groupType="button" isPersistent={isPersistent}>
          {sharedItems.map(
            ({
              itemKey,
              title,
              tooltipProps,
              useOnlyIconWhenShared,
              isPersistent,
              ...rest
            }) => (
              <OverflowMenuItem key={itemKey} isPersistent={isPersistent}>
                <ConditionalTooltip
                  isTooltipEnabled={!!tooltipProps?.content}
                  content={tooltipProps?.content}
                >
                  <Button
                    onClick={rest.onClick}
                    variant={rest.variant}
                    aria-label={rest["aria-label"]}
                    isAriaDisabled={rest.isAriaDisabled}
                    isDisabled={rest.isDisabled}
                    icon={rest.icon}
                    ouiaId={rest.ouiaId}
                    isDanger={rest.isDanger}
                  >
                    {useOnlyIconWhenShared ? null : title}
                  </Button>
                </ConditionalTooltip>
              </OverflowMenuItem>
            )
          )}
        </OverflowMenuGroup>
      </OverflowMenuContent>
      <OverflowMenuControl
        hasAdditionalOptions={items.length - sharedItems.length > 0}
      >
        <Dropdown
          onSelect={onToggle}
          popperProps={{ position: "right" }}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              variant="plain"
              aria-label={toggleAriaLabel}
              onClick={onToggle}
              isExpanded={isMenuOpen}
              icon={<EllipsisVIcon />}
              ouiaId={toggleId}
            />
          )}
          isOpen={isMenuOpen}
          onOpenChange={(isOpen) => setIsMenuOpen(isOpen)}
        >
          <DropdownList>{dropdownItems}</DropdownList>
        </Dropdown>
      </OverflowMenuControl>
    </OverflowMenu>
  );
};
