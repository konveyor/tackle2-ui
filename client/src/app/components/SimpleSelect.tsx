import { FC, useState } from "react";
import {
  Select,
  SelectOption,
  SelectOptionObject,
  SelectOptionProps,
  SelectProps,
} from "@patternfly/react-core/deprecated";

export interface OptionWithValue<T = string> extends SelectOptionObject {
  value: T;
  props?: Partial<SelectOptionProps>; // Extra props for <SelectOption>, e.g. children, className
}

type OptionLike = string | SelectOptionObject | OptionWithValue;

export interface ISimpleSelectProps extends Omit<
  SelectProps,
  "onChange" | "isOpen" | "onToggle" | "onSelect" | "selections" | "value"
> {
  "aria-label": string;
  onChange: (selection: OptionLike) => void;
  options: OptionLike[];
  value?: OptionLike | OptionLike[];
}

// TODO we can probably add a type param here so we can render e.g. <SimpleSelect<AnalysisMode> ... /> and infer OptionWithValue<AnalysisMode>

export const SimpleSelect: FC<ISimpleSelectProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  toggleAriaLabel,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Select
        menuAppendTo="parent" // prevent menu from being clipped by modal edges
        maxHeight={200}
        placeholderText={placeholderText}
        toggleAriaLabel={toggleAriaLabel}
        isOpen={isOpen}
        onToggle={(_, isOpen) => setIsOpen(isOpen)}
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
          <SelectOption
            key={`${index}-${option.toString()}`}
            value={option}
            {...(typeof option === "object" &&
              (option as OptionWithValue).props)}
          />
        ))}
      </Select>
    </>
  );
};
