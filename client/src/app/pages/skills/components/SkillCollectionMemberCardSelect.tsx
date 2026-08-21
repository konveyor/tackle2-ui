import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";

import type { SkillCard } from "@app/api/agentic/contract";

interface SkillCollectionMemberCardSelectProps {
  toggleId: string;
  ariaLabel: string;
  /** Name of the currently referenced SkillCard ("" = nothing chosen). */
  value: string;
  skillCards: SkillCard[];
  onSelect: (card: SkillCard) => void;
}

/**
 * Single-select over the cluster's SkillCards for a collection member of
 * kind "Skill card". Options show `displayName ?? name` with the resource
 * name as the description when it differs. A value that is no longer in
 * the list (edit of a collection whose card was deleted) stays selectable
 * so saving does not silently drop it.
 */
export const SkillCollectionMemberCardSelect: React.FC<
  SkillCollectionMemberCardSelectProps
> = ({ toggleId, ariaLabel, value, skillCards, onSelect }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const byName = new Map(
    skillCards
      .filter((c) => !!c.metadata.name)
      .map((c) => [c.metadata.name as string, c])
  );
  const selected = value ? byName.get(value) : undefined;
  const isMissing = value.length > 0 && !selected;

  const labelOf = (card: SkillCard) =>
    card.spec.displayName?.trim() || (card.metadata.name ?? "");

  const toggleText = selected
    ? labelOf(selected)
    : value || t("agentic.skills.selectSkillCard");

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      id={toggleId}
      ref={toggleRef}
      aria-label={ariaLabel}
      onClick={() => setIsOpen((open) => !open)}
      isExpanded={isOpen}
      isFullWidth
      status={isMissing ? "warning" : undefined}
    >
      {toggleText}
      {selected && labelOf(selected) !== selected.metadata.name && (
        <span
          style={{
            marginLeft: "0.5rem",
            color: "var(--pf-t--global--text--color--subtle)",
          }}
        >
          {selected.metadata.name}
        </span>
      )}
    </MenuToggle>
  );

  return (
    <Select
      id={`${toggleId}-select`}
      aria-label={ariaLabel}
      toggle={toggle}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      selected={value || undefined}
      onSelect={(_e, selection) => {
        const card = byName.get(String(selection));
        if (card) onSelect(card);
        setIsOpen(false);
      }}
      isScrollable
      maxMenuHeight="20rem"
      shouldFocusToggleOnSelect
    >
      <SelectList id={`${toggleId}-listbox`}>
        {isMissing && (
          <SelectOption
            key={value}
            value={value}
            isSelected
            description={t("agentic.skills.skillCardMissing")}
          >
            {value}
          </SelectOption>
        )}
        {skillCards.length === 0 && !isMissing && (
          <SelectOption isDisabled value="">
            {t("agentic.skills.noSkillCardsToSelect")}
          </SelectOption>
        )}
        {Array.from(byName.values()).map((card) => {
          const name = card.metadata.name ?? "";
          const label = labelOf(card);
          return (
            <SelectOption
              key={name}
              value={name}
              isSelected={name === value}
              description={label !== name ? name : undefined}
            >
              {label}
            </SelectOption>
          );
        })}
      </SelectList>
    </Select>
  );
};
