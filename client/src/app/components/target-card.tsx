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
  Label,
} from "@patternfly/react-core";
import { CubesIcon, GripVerticalIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { KebabDropdown } from "@app/shared/components";
import { useTranslation } from "react-i18next";
import "./target-card.css";
import DefaultRulesetIcon from "@app/images/Icon-Red_Hat-Virtual_server_stack-A-Black-RGB.svg";
import { Ruleset } from "@app/api/models";
import { getParsedLabel } from "@app/common/CustomRules/rules-utils";

export interface TargetCardProps {
  item: Ruleset;
  cardSelected?: boolean;
  isEditable?: boolean;
  onCardClick?: (isSelecting: boolean, value: string) => void;
  onSelectedCardTargetChange?: (value: string) => void;
  formTargets?: string[];
  handleProps?: any;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Force display dropdown box even though there only one option available.
// This is a business rule to guarantee that option is alwyas present.
const forceSelect = ["Azure"];

export const TargetCard: React.FC<TargetCardProps> = ({
  item,
  readOnly,
  cardSelected,
  formTargets,
  onCardClick,
  onSelectedCardTargetChange,
  handleProps,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isCardSelected, setCardSelected] = React.useState(cardSelected);

  const prevSelectedTarget = formTargets?.find(
    (target) =>
      item.rules.map((ruleset) => ruleset?.metadata?.target).indexOf(target) !==
      -1
  );

  const [isRuleTargetSelectOpen, setRuleTargetSelectOpen] =
    React.useState(false);

  const [selectedRuleTarget, setSelectedRuleTarget] = React.useState(
    prevSelectedTarget ||
      item.rules[0]?.metadata?.target ||
      `${item.name}-Empty`
  );

  const handleCardClick = (event: React.MouseEvent) => {
    // Stop 'select' event propagation
    const eventTarget: any = event.target;
    if (eventTarget.type === "button") return;

    setCardSelected(!isCardSelected);
    onCardClick &&
      selectedRuleTarget &&
      onCardClick(!isCardSelected, selectedRuleTarget);
  };

  const handleRuleTargetSelection = (
    event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    event.stopPropagation();
    setRuleTargetSelectOpen(false);
    setSelectedRuleTarget(selection as string);

    //update the formTargets if this card is selected
    if (isCardSelected && onSelectedCardTargetChange) {
      onSelectedCardTargetChange(selection as string);
    }
  };

  const getImage = (): React.ComponentType => {
    let result: React.ComponentType<any> = CubesIcon;
    const imagePath = item?.image?.id
      ? `/hub/files/${item.image.id}`
      : DefaultRulesetIcon;
    if (item.image) {
      result = () => (
        <img
          src={imagePath}
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
            {!readOnly && (
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
            )}
          </FlexItem>
          <FlexItem className={spacing.mlAuto}>
            {readOnly && item.custom ? (
              <Label color="grey">Custom</Label>
            ) : (
              item.custom && (
                <KebabDropdown
                  dropdownItems={[
                    <DropdownItem key="edit-custom-card" onClick={onEdit}>
                      {t("actions.edit")}
                    </DropdownItem>,
                    <DropdownItem key="delete-custom-card" onClick={onDelete}>
                      {t("actions.delete")}
                    </DropdownItem>,
                  ]}
                />
              )
            )}
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
          {item.kind === "category" &&
          (item.rules.length > 1 || forceSelect.includes(item.name)) ? (
            <Select
              toggleId={`${item.name}-toggle`}
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={(isExpanded) => setRuleTargetSelectOpen(isExpanded)}
              onSelect={handleRuleTargetSelection}
              selections={selectedRuleTarget}
              isOpen={isRuleTargetSelectOpen}
              width={250}
            >
              {item.rules.map((rule) => (
                <SelectOption key={rule.name} value={rule?.metadata?.target}>
                  {rule?.metadata?.target
                    ? getParsedLabel(rule.metadata.target)?.labelValue
                    : "Empty"}
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
