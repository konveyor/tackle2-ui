import React from "react";
import { LabelGroup, LabelProps } from "@patternfly/react-core";
import { LabelCustomColor } from "../LabelCustomColor";
import { useTranslation } from "react-i18next";

interface RandomColorLabelProps extends LabelProps {}

export const RandomColorLabel: React.FC<RandomColorLabelProps> = ({
  ...props
}) => {
  const getRandomColor = (() => {
    "use strict";

    const randomInt = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    return () => {
      const h = randomInt(0, 360);
      const s = randomInt(42, 98);
      const l = randomInt(40, 90);
      return `hsl(${h},${s}%,${l}%)`;
    };
  })();

  const randomColor = getRandomColor();

  return <LabelCustomColor color={randomColor} {...props} />;
};

export function LabelsFromItems<T extends { name: string }>({
  items,
  noneMessage,
}: {
  items?: T[];
  noneMessage?: string;
}): JSX.Element {
  const { t } = useTranslation();

  if (items?.length ?? 0 === 0) {
    return <div>{noneMessage || t("terms.none")}</div>;
  }

  return (
    <LabelGroup>
      {items?.map((item, index) => (
        <RandomColorLabel key={index}>{item.name}</RandomColorLabel>
      ))}
    </LabelGroup>
  );
}
