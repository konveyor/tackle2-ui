import React from "react";
import { useTranslation } from "react-i18next";
import { Label, LabelGroup, LabelProps } from "@patternfly/react-core";

export function LabelsFromItems<T extends { name: string }>({
  items,
  noneMessage,
  color = "grey",
}: {
  items?: T[];
  noneMessage?: string;
  color?: LabelProps["color"];
}): JSX.Element {
  const { t } = useTranslation();

  if (items && items.length > 0) {
    return (
      <LabelGroup>
        {items.map((item, index) => (
          <Label key={index} color={color}>
            {item.name}
          </Label>
        ))}
      </LabelGroup>
    );
  }
  return <div>{noneMessage || t("terms.none")}</div>;
}
