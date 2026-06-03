import { useState } from "react";
import * as React from "react";
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  ToolbarItem,
} from "@patternfly/react-core";
import { UserIcon } from "@patternfly/react-icons";

import { useMasqueradeDispatch } from "./MasqueradeAuthStrategy";
import {
  MASQUERADE_PRESETS,
  MasqueradePreset,
  getCurrentPreset,
} from "./masquerade";

/**
 * Developer toolbar item for the MasqueradeAuthStrategy.
 *
 * The toolbar item appears as an avatar/user icon in the masthead. Clicking it opens
 * a dropdown that lets the developer switch the masquerade persona (admin,
 * architect, migrator) without restarting the dev server.
 *
 * Since the MasqueradeAuthStrategy is only selected when NODE_ENV !== "production", this
 * file is tree-shaken from production bundles.
 */
export const MasqueradeDevPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(getCurrentPreset);
  const switchPreset = useMasqueradeDispatch();

  const onSelect = (preset: MasqueradePreset) => {
    switchPreset(preset);
    setCurrentPreset(preset);
    setIsOpen(false);
  };

  const activePreset = MASQUERADE_PRESETS[currentPreset];
  const scopeCount = activePreset.allScopesGranted
    ? "all"
    : `${activePreset.scopes.length}`;

  return (
    <ToolbarItem>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        popperProps={{ position: "end" }}
        toggle={(toggleRef) => (
          <MenuToggle
            isFullHeight
            ref={toggleRef}
            id="masquerade-toggle"
            onClick={() => setIsOpen((o) => !o)}
            aria-label="Masquerade dev panel"
            icon={<UserIcon />}
          >
            {activePreset.label}
          </MenuToggle>
        )}
      >
        <DropdownGroup
          label={`Active scopes: ${scopeCount}`}
          key="masquerade-group"
        >
          <DropdownList>
            {(Object.keys(MASQUERADE_PRESETS) as MasqueradePreset[]).map(
              (preset) => (
                <DropdownItem
                  key={preset}
                  id={`masquerade-${preset}`}
                  component="button"
                  isSelected={currentPreset === preset}
                  onClick={() => onSelect(preset)}
                >
                  <strong>{MASQUERADE_PRESETS[preset].label}</strong>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--pf-v6-global--Color--200)",
                    }}
                  >
                    {MASQUERADE_PRESETS[preset].allScopesGranted
                      ? "all scopes"
                      : `${MASQUERADE_PRESETS[preset].scopes.length} scopes`}
                  </span>
                </DropdownItem>
              )
            )}
          </DropdownList>
        </DropdownGroup>
      </Dropdown>
    </ToolbarItem>
  );
};
