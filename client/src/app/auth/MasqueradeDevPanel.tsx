/**
 * A small developer tool rendered inside the SsoToolbarItem when AUTH_REQUIRED
 * is false. Mimics the react-query devtools pattern: visible in dev mode only,
 * absent from production builds.
 *
 * The panel appears as an avatar/user icon in the masthead. Clicking it opens
 * a dropdown that lets the developer switch the masquerade persona (admin,
 * architect, migrator) without restarting the dev server. Changing the persona
 * writes to localStorage and triggers a page reload so all RBAC checks re-evaluate.
 *
 * This component is only rendered when isAuthRequired === false. The guard lives
 * in SsoToolbarItem — this file can be tree-shaken in prod builds.
 */

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

import {
  MASQUERADE_PRESETS,
  MasqueradePreset,
  getCurrentPreset,
  getMasqueradeRoles,
  setMasqueradePreset,
} from "./masquerade";

export const MasqueradeDevPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<MasqueradePreset | null>(
    getCurrentPreset
  );

  const activeRoles = getMasqueradeRoles();

  const onSelect = (preset: MasqueradePreset) => {
    setMasqueradePreset(preset);
    setCurrentPreset(preset);
    setIsOpen(false);
    // Reload so all hooks re-read from localStorage
    window.location.reload();
  };

  const presetLabel =
    currentPreset && MASQUERADE_PRESETS[currentPreset]
      ? MASQUERADE_PRESETS[currentPreset].label
      : "Dev";

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
            {presetLabel}
          </MenuToggle>
        )}
      >
        <DropdownGroup
          label={`Active roles: ${activeRoles.length ? activeRoles.join(", ") : "none"}`}
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
                    {MASQUERADE_PRESETS[preset].roles.join(", ")}
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
