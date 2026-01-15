import { Label, LabelGroup, LabelProps } from "@patternfly/react-core";

import { ParsedTargetLabel } from "@app/utils/rules-utils";

export const GroupOfLabels = ({
  groupName,
  items,
  labelColor = "grey",
}: {
  groupName?: string;
  items: ParsedTargetLabel[];
  labelColor?: LabelProps["color"];
}) => {
  return (
    <LabelGroup categoryName={groupName} numLabels={5} isCompact>
      {items.map((item) => (
        <Label key={item.label} color={labelColor}>
          {item.value}
        </Label>
      ))}
    </LabelGroup>
  );
};
