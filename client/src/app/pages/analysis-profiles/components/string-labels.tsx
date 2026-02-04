import * as React from "react";
import { useTranslation } from "react-i18next";
import { Label, LabelGroup } from "@patternfly/react-core";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";

/** Helper to display a list of string labels */
export const StringLabels: React.FC<{
  items?: string[];
  color?: "grey" | "blue" | "green";
  overflowLabelCount?: number;
}> = ({ items, color = "grey", overflowLabelCount }) => {
  const { t } = useTranslation();

  if (items && items.length > 0) {
    return (
      <LabelGroup numLabels={overflowLabelCount ?? items.length}>
        {items.map((item) => (
          <Label key={item} color={color}>
            {item}
          </Label>
        ))}
      </LabelGroup>
    );
  }
  return <EmptyTextMessage message={t("terms.none")} />;
};
