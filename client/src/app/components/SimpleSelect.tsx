import { useState } from "react";
import * as React from "react";
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
  SelectProps,
} from "@patternfly/react-core";

export interface SelectOptionObject {
  toString(): string;
}

export interface OptionWithValue<T = string> extends SelectOptionObject {
  value: T;
  props?: Partial<SelectOptionProps>; // Extra props for <SelectOption>, e.g. children, className
}

type OptionLike = string | SelectOptionObject | OptionWithValue;

export interface ISimpleSelectProps
  extends Omit<
    SelectProps,
    "toggle" | "isOpen" | "onSelect" | "onOpenChange" | "variant"
  > {
  "aria-label": string;
  onChange: (selection: OptionLike) => void;
  options: OptionLike[];
  value?: OptionLike | OptionLike[];
  placeholderText?: string;
  toggleAriaLabel?: string;
  variant?: "single" | "checkbox" | "typeahead" | "typeaheadmulti";
  // Props carried over from PF v5 Select API for compatibility
  toggleId?: string;
  maxHeight?: number | string;
  onClear?: () => void;
  hasInlineFilter?: boolean;
  isDisabled?: boolean;
  menuAppendTo?: HTMLElement | (() => HTMLElement) | "inline" | "parent";
  loadingVariant?: string;
  noResultsFoundText?: string;
  width?: number | string;
}

// TODO we can probably add a type param here so we can render e.g. <SimpleSelect<AnalysisMode> ... /> and infer OptionWithValue<AnalysisMode>

export const SimpleSelect: React.FC<ISimpleSelectProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  toggleAriaLabel,
  variant = "single",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayValue = (): string => {
    if (!value) return placeholderText;
    if (Array.isArray(value)) {
      if (value.length === 0) return placeholderText;
      return value.map((v) => v.toString()).join(", ");
    }
    return value.toString();
  };

  const isOptionSelected = (option: OptionLike): boolean => {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.some((v) => v.toString() === option.toString());
    }
    return value.toString() === option.toString();
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      aria-label={toggleAriaLabel}
      style={{ width: "100%" }}
    >
      {getDisplayValue()}
    </MenuToggle>
  );

  return (
    <>
      <Select
        isOpen={isOpen}
        onSelect={(_, selection: SelectOptionProps["value"]) => {
          onChange(selection as OptionLike);
          if (variant !== "checkbox") {
            setIsOpen(false);
          }
        }}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        toggle={toggle}
        {...props}
      >
        <SelectList>
          {options.map((option, index) => (
            <SelectOption
              key={`${index}-${option.toString()}`}
              value={option}
              isSelected={isOptionSelected(option)}
              {...(typeof option === "object" &&
                (option as OptionWithValue).props)}
            >
              {option.toString()}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </>
  );
};
