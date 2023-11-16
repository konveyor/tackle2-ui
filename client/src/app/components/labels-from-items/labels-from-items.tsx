import React from "react";
import { Label, LabelGroup } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

export function LabelsFromItems<T extends { name: string }>({
  items,
  noneMessage,
}: {
  items?: T[];
  noneMessage?: string;
}): JSX.Element {
  const { t } = useTranslation();

  if (items && items.length > 0) {
    return (
      <LabelGroup>
        {items.map((item, index) => (
          <Label key={index}>{item.name}</Label>
        ))}
      </LabelGroup>
    );
  }
  return <div>{noneMessage || t("terms.none")}</div>;
}
