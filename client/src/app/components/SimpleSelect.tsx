import React, { useState } from "react";

import {
  Select as SelectD,
  SelectOption as SelectDOption,
  SelectOptionObject as SelectDOptionObject,
  SelectOptionProps as SelectDOptionProps,
  SelectProps as SelectDProps,
} from "@patternfly/react-core/deprecated";

import {
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from "@patternfly/react-core";

export interface OptionWithValue<T = string> extends SelectDOptionObject {
  value: T;
  props?: Partial<SelectDOptionProps>; // Extra props for <SelectDOption>, e.g. children, className
}

type OptionLike = string | SelectDOptionObject | OptionWithValue;

export interface ISimpleSelectProps
  extends Omit<
    SelectDProps,
    "onChange" | "isOpen" | "onToggle" | "onSelect" | "selections" | "value"
  > {
  "aria-label": string;
  onChange: (selection: OptionLike) => void;
  options: OptionLike[];
  value?: OptionLike | OptionLike[];
}

// TODO we can probably add a type param here so we can render e.g. <SimpleSelect<AnalysisMode> ... /> and infer OptionWithValue<AnalysisMode>

export const SimpleSelect: React.FC<ISimpleSelectProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  toggleAriaLabel,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDOpen, setDIsOpen] = useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      ref={toggleRef}
      onClick={() => {
        setIsOpen(!isOpen);
      }}
      isExpanded={isOpen}
    >
      {(Array.isArray(value) ? value[0] : value)?.toString()}
    </MenuToggle>
  );
  console.log(options);
  return (
    <>
      <Select
        isOpen={isOpen}
        toggle={toggle}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        onSelect={(_, selection) => {
          onChange(selection as string);
          if (props.variant !== "checkbox") {
            setIsOpen(false);
          }
        }}
      >
        <SelectList>
          {options.map((option, index) => (
            <SelectOption
              key={`${index}-${option.toString()}`}
              value={option}
              // {...(typeof option === "object" && (option as OptionWithValue).props)}
            >
              {option.toString()}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
      <SelectD
        menuAppendTo="parent" // prevent menu from being clipped by modal edges
        maxHeight={200}
        placeholderText={placeholderText}
        toggleAriaLabel={toggleAriaLabel}
        isOpen={isDOpen}
        onToggle={(_, isDOpen) => setDIsOpen(isDOpen)}
        onSelect={(_, selection) => {
          onChange(selection);
          if (props.variant !== "checkbox") {
            setIsOpen(false);
          }
        }}
        selections={value}
        {...props}
      >
        {options.map((option, index) => (
          <SelectDOption
            key={`${index}-${option.toString()}`}
            value={option}
            {...(typeof option === "object" &&
              (option as OptionWithValue).props)}
          />
        ))}
      </SelectD>
    </>
  );
};
