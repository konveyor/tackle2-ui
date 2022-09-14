import React from "react";
import { useTranslation } from "react-i18next";

import { Split, SplitItem } from "@patternfly/react-core";

import { DEFAULT_COLOR_LABELS } from "@app/Constants";
import "./color.css";

export interface ColorProps {
  hex: string;
}

export const Color: React.FC<ColorProps> = ({ hex }) => {
  const { t } = useTranslation();

  const colorName = DEFAULT_COLOR_LABELS.get(hex.toLowerCase());

  return (
    <Split hasGutter>
      <SplitItem>
        <div
          className="color"
          style={{ backgroundColor: hex }}
          cy-data="color-box"
        ></div>
      </SplitItem>
      <SplitItem isFilled>
        <span cy-data="color-label">
          {colorName ? t(`colors.${colorName}`) : hex}
        </span>
      </SplitItem>
    </Split>
  );
};
