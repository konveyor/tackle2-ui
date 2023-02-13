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
  DropdownItem,
  Flex,
  FlexItem,
  Button,
  ButtonVariant,
} from "@patternfly/react-core";
import { CubesIcon, GripVerticalIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { KebabDropdown } from "@app/shared/components";
import { useTranslation } from "react-i18next";
import { MigrationTarget } from "@app/api/models";
import "./target-card.css";

export interface TargetCardProps {
  item: MigrationTarget;
  cardSelected?: boolean;
  isEditable?: boolean;
  onChange?: (isNewCard: boolean, value: string) => void;
  handleProps?: any;
  readOnly?: boolean;
}

// Force display dropdown box even though there only one option available.
// This is a business rule to guarantee that option is alwyas present.
const forceSelect = ["Azure"];

export const TargetCard: React.FC<TargetCardProps> = ({
  item,
  readOnly,
  cardSelected,
  onChange = () => {},
  handleProps,
}) => {
  const { t } = useTranslation();
  const [isCardSelected, setCardSelected] = React.useState(cardSelected);
  const [isSelectOpen, setSelectOpen] = React.useState(false);
  const [selectedRelease, setSelectedRelease] = React.useState(
    item.options ? item.options[0][0] : ""
  );

  const handleCardClick = (event: React.MouseEvent) => {
    // Stop 'select' event propagation
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
    if (item.image) {
      result = () => (
        <img
          src={item.image}
          alt="Card logo"
          style={{ height: 80, pointerEvents: "none" }}
        />
      );
    }

    return result;
  };

  return (
    <Card
      onClick={handleCardClick}
      isSelectable={!!cardSelected}
      isSelected={isCardSelected}
      className="pf-l-stack pf-l-stack__item pf-m-fill"
    >
      <CardBody>
        <Flex>
          <FlexItem>
            <Button
              className="grabbable"
              id="drag-button"
              aria-label="drag button"
              variant={ButtonVariant.plain}
              {...handleProps}
              {...handleProps?.listeners}
              {...handleProps?.attributes}
            >
              <GripVerticalIcon></GripVerticalIcon>
            </Button>
          </FlexItem>
          <FlexItem className={spacing.mlAuto}>
            {!readOnly && item.custom ? (
              <KebabDropdown
                dropdownItems={[
                  <DropdownItem key="edit-custom-card" onClick={() => {}}>
                    {t("actions.edit")}
                  </DropdownItem>,
                  <DropdownItem key="delite-custom-card" onClick={() => {}}>
                    {t("actions.delete")}
                  </DropdownItem>,
                ]}
              />
            ) : null}
          </FlexItem>
        </Flex>
        <EmptyState
          variant={EmptyStateVariant.small}
          className="select-card__component__empty-state"
        >
          <EmptyStateIcon icon={getImage()} />
          <Title headingLevel="h4" size="md">
            {item.name}
          </Title>
          {item.options &&
          (item.options.length > 1 || forceSelect.includes(item.name)) ? (
            <Select
              toggleId={`${item.name}-toggle`}
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={(isExpanded) => setSelectOpen(isExpanded)}
              onSelect={handleSelectSelection}
              selections={selectedRelease}
              isOpen={isSelectOpen}
            >
              {item.options.map((element) => (
                <SelectOption key={element[0]} value={element[0]}>
                  {element[1]}
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
