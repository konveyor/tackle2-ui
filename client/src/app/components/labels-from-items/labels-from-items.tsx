import React from "react";
import { LabelProps } from "@patternfly/react-core";
import { LabelCustomColor } from "../LabelCustomColor";
import { useTranslation } from "react-i18next";

interface RandomColorLabelProps extends LabelProps {}

export const RandomColorLabel: React.FC<RandomColorLabelProps> = ({
  ...props
}) => {
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const randomColor = getRandomColor();

  return <LabelCustomColor color={randomColor} {...props} />;
};

export function LabelsFromItems<T extends { name: string }>({
  items,
  noneMessage,
}: {
  items: T[];
  noneMessage?: string;
}): JSX.Element {
  const { t } = useTranslation();

  if (items.length === 0) {
    return <div>{noneMessage || t("terms.none")}</div>;
  }

  return (
    <div>
      {items.map((item, index) => (
        <RandomColorLabel key={index}>{item.name}</RandomColorLabel>
      ))}
    </div>
  );
}
