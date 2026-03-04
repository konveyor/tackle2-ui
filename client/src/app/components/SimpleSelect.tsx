import { useState } from "react";
import * as React from "react";
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectOption,
  SelectOptionProps,
  SelectProps,
} from "@patternfly/react-core";

export interface OptionWithValue<T = string> {
  /** Human readable value.
   * 1. used as option content (may be overridden by optionProps.children)
   * 2. if not present the value prop is used instead.
   * 3. used for filtering the list of available options. If optionProps.children is used then its content should logically match the label prop.
   * 4. should be unique within the list of options (to avoid user confusion)
   */
  label?: string;
  // pass through props
  optionProps?: SelectOptionProps;
  // identity prop used to tract selection - should be unique within the list.
  value: string;
}

type OptionLike = string | SelectOptionProps | OptionWithValue;

export interface ISimpleSelectProps
  extends Omit<
    SelectProps,
    | "onChange"
    | "isOpen"
    | "onToggle"
    | "onSelect"
    | "selections"
    | "value"
    | "toggle"
  > {
  "aria-label": string;
  onChange: (selection: OptionLike) => void;
  options: OptionLike[];
  value?: OptionLike | OptionLike[];
  placeholderText?: string;
  toggleAriaLabel?: string;
  isDisabled?: boolean;
  toggleId?: string;
}

// TODO we can probably add a type param here so we can render e.g. <SimpleSelect<AnalysisMode> ... /> and infer OptionWithValue<AnalysisMode>

export const SimpleSelect: React.FC<ISimpleSelectProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  toggleAriaLabel = "Select",
  isDisabled,
  toggleId,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      id={toggleId}
      aria-label={toggleAriaLabel}
      isDisabled={isDisabled}
      isExpanded={isOpen}
      onClick={() => setIsOpen(!isOpen)}
      ref={toggleRef}
    />
  );

  return (
    <>
      <Select
        // menuAppendTo="parent" // prevent menu from being clipped by modal edges
        // maxHeight={200}
        // placeholderText={placeholderText}
        // toggleAriaLabel={toggleAriaLabel}
        isOpen={isOpen}
        // onToggle={(_, isOpen) => setIsOpen(isOpen)}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        onSelect={(_, selection) => {
          onChange(selection as OptionLike);
          // if (props.variant !== "checkbox") {
          //   setIsOpen(false);
          // }
        }}
        // selections={value}
        selected={value}
        {...props}
        toggle={toggle}
      >
        {options.map((option, index) => (
          <SelectOption
            key={`${index}-${option.toString()}`}
            value={option}
            {...(typeof option === "object" &&
              (option as OptionWithValue).optionProps)}
          />
        ))}
      </Select>
    </>
  );
};
