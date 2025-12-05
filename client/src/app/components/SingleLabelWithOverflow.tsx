import * as React from "react";
import { Label, LabelGroup, LabelProps, Popover } from "@patternfly/react-core";

export interface ISingleLabelWithOverflowProps extends Omit<
  LabelProps,
  "children"
> {
  labels: string[];
  popoverAriaLabel: string;
}

// TODO i18n

export const SingleLabelWithOverflow: React.FC<
  ISingleLabelWithOverflowProps
> = ({ labels, popoverAriaLabel, ...props }) => {
  if (labels.length === 0) {
    return <>None</>;
  }
  return (
    <LabelGroup>
      <Label {...props}>{labels[0]}</Label>
      {labels.length > 1 ? (
        <Popover
          position="top"
          hasAutoWidth
          aria-label={popoverAriaLabel}
          bodyContent={
            <LabelGroup isVertical>
              {labels.slice(1).map((label) => (
                <Label key={label} {...props}>
                  {label}
                </Label>
              ))}
            </LabelGroup>
          }
        >
          <Label
            variant="outline"
            render={({ className, content }) => (
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className={className}
              >
                {content}
              </a>
            )}
          >
            {labels.length - 1} more
          </Label>
        </Popover>
      ) : null}
    </LabelGroup>
  );
};
