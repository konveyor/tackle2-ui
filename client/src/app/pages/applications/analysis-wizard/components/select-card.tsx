import * as React from "react";
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
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { ITransformationTargets, targetsLabels } from "../targets";

import "./select-card.css";

export interface SelectCardProps {
  item: ITransformationTargets;
  cardSelected: boolean;
  onChange: (isNewCard: boolean, value: string) => void;
}

export const SelectCard: React.FC<SelectCardProps> = ({
  item,
  cardSelected,
  onChange,
}) => {
  const [isCardSelected, setCardSelected] = React.useState(cardSelected);
  const [isSelectOpen, setSelectOpen] = React.useState(false);
  const [selectedRelease, setSelectedRelease] = React.useState(
    [...item.options][0]
  );

  const handleCardClick = (event: React.MouseEvent) => {
    // Workaround to stop 'select' event propagation
    const eventTarget: any = event.target;
    if (eventTarget.type === "button") return;

    setCardSelected(!isCardSelected);
    onChange(!isCardSelected, selectedRelease);
  };

  const handleSelectSelection = (
    event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    event.stopPropagation();
    setSelectOpen(false);
    setSelectedRelease(selection as string);
  };

  const getImage = (): React.ComponentType<any> => {
    let result: React.ComponentType<any> = CubesIcon;
    if (item.iconSrc) {
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
      isSelected={isCardSelected}
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
          {item.forceSelect === true || item.options.length > 1 ? (
            <Select
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={(isExpanded) => setSelectOpen(isExpanded)}
              onSelect={handleSelectSelection}
              selections={selectedRelease}
              isOpen={isSelectOpen}
            >
              {[...item.options].map((element) => (
                <SelectOption key={element} value={element}>
                  {targetsLabels.get(element)}
                </SelectOption>
              ))}
            </Select>
          ) : null}
          <Text className={`${spacing.pMd} pf-u-text-align-left`}>
            {item.description}
          </Text>
        </EmptyState>
      </CardBody>
    </Card>
  );
};
