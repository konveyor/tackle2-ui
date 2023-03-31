import React from "react";
import { useTranslation } from "react-i18next";

import { Split, SplitItem } from "@patternfly/react-core";

import { COLOR_NAMES_BY_HEX_VALUE } from "@app/Constants";
import "./color.css";

export interface ColorProps {
  hex: string;
}

export const Color: React.FC<ColorProps> = ({ hex }) => {
  const { t } = useTranslation();

  const colorName = COLOR_NAMES_BY_HEX_VALUE[hex.toLowerCase()];

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
        <span cy-data="color-label" id="color-id">
          {colorName ? t(`colors.${colorName}`) : hex}
        </span>
      </SplitItem>
    </Split>
  );
};
