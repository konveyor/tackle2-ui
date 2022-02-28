import React from "react";
import {
  EmptyState,
  EmptyStateIcon,
  Title,
  EmptyStateVariant,
  Card,
  CardBody,
  Select,
  SelectOption,
  SelectVariant,
  SelectOptionObject,
  Text,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";

import "./select-card.css";
import { useState } from "react";
import { TransformationTargets } from "./select-card-gallery";

interface CardSelectOption {
  value: string;
  label: string;
}

export interface SelectCardProps {
  item: TransformationTargets;
  isSelected: boolean;
  value: string;
  onChange: (isSelected: boolean, value: string) => void;
}

export const SelectCard: React.FC<SelectCardProps> = ({
  item,
  isSelected,
  value,
  onChange,
}) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const handleCardClick = (event: React.MouseEvent) => {
    // Workaround to stop 'select' event propagation
    const eventTarget: any = event.target;
    if (eventTarget.type === "button") {
      return;
    }

    if (Array.isArray(item.options)) {
      onChange(!isSelected, value);
    } else {
      onChange(!isSelected, value || item.options);
    }
  };

  const handleSelectToggle = (isOpen: boolean) => {
    setIsSelectOpen(isOpen);
  };

  const handleSelectSelection = (
    event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    event.stopPropagation();
    setIsSelectOpen(false);
    onChange(true, selection as any);
  };

  const getImage = (): React.ComponentType<any> => {
    let result: React.ComponentType<any> = CubesIcon;
    if (item.icon) {
      result = item.icon;
    } else if (item.iconSrc) {
      result = () => (
        <img src={item.iconSrc} alt="Card logo" style={{ height: 80 }} />
      );
    }

    return result;
  };

  return (
    <Card
      onClick={handleCardClick}
      isSelectable
      isSelected={isSelected}
      className="pf-l-stack pf-l-stack__item pf-m-fill"
    >
      <CardBody>
        <EmptyState
          variant={EmptyStateVariant.small}
          className="select-card__component__empty-state"
        >
          <EmptyStateIcon icon={getImage()} />
          <Title headingLevel="h4" size="md">
            {item.label}
          </Title>
          {Array.isArray(item.options) && (
            <Select
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={handleSelectToggle}
              onSelect={handleSelectSelection}
              selections={value}
              isOpen={isSelectOpen}
              direction="down"
            >
              {item.options.map((el: any, index: number) => (
                <SelectOption key={index} value={el.value} />
              ))}
            </Select>
          )}
          <Text style={{ padding: "1em", textAlign: "left" }}>
            {item.description}
          </Text>
        </EmptyState>
      </CardBody>
    </Card>
  );
};
