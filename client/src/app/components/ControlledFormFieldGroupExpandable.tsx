import * as React from "react";
import { FormFieldGroupExpandableProps } from "@patternfly/react-core";
import { InternalFormFieldGroup } from "@patternfly/react-core/dist/esm/components/Form/InternalFormFieldGroup";

export interface ControlledFormFieldGroupExpandableProps extends FormFieldGroupExpandableProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const ControlledFormFieldGroupExpandable: React.FunctionComponent<
  ControlledFormFieldGroupExpandableProps
> = ({
  children,
  className,
  header,
  toggleAriaLabel,
  isExpanded,
  onToggle,
  ...props
}) => {
  return (
    <InternalFormFieldGroup
      className={className}
      header={header}
      isExpandable={true}
      isExpanded={isExpanded}
      onToggle={onToggle}
      toggleAriaLabel={toggleAriaLabel}
      {...props}
    >
      {children}
    </InternalFormFieldGroup>
  );
};
ControlledFormFieldGroupExpandable.displayName =
  "ControlledFormFieldGroupExpandable";
