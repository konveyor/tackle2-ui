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
import "./target-card.css";
import DefaultRuleBundleIcon from "@app/images/Icon-Red_Hat-Virtual_server_stack-A-Black-RGB.svg";
import { RuleBundle } from "@app/api/models";

export interface TargetCardProps {
  item: RuleBundle;
  cardSelected?: boolean;
  isEditable?: boolean;
  onCardClick?: (isSelecting: boolean, value: string) => void;
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
  onCardClick,
  handleProps,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isCardSelected, setCardSelected] = React.useState(cardSelected);
  const [isRuleTargetSelectOpen, setRuleTargetSelectOpen] =
    React.useState(false);
  const [selectedRuleTarget, setSelectedRuleTarget] = React.useState(
    item.rulesets[0]?.metadata?.target
  );

  const handleCardClick = (event: React.MouseEvent) => {
    // Stop 'select' event propagation
    const eventTarget: any = event.target;
    if (eventTarget.type === "button") return;

    setCardSelected(!isCardSelected);
    onCardClick && onCardClick(!isCardSelected, selectedRuleTarget);
  };

  const handleRuleTargetSelection = (
    event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    event.stopPropagation();
    setRuleTargetSelectOpen(false);
    setSelectedRuleTarget(selection as string);
  };

  const getImage = (): React.ComponentType => {
    let result: React.ComponentType<any> = CubesIcon;
    const imagePath = item.image.id
      ? `/hub/files/${item.image.id}`
      : DefaultRuleBundleIcon;
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
            {!readOnly && item.custom ? (
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
          {item.kind === "category" &&
          (item.rulesets.length > 1 || forceSelect.includes(item.name)) ? (
            <Select
              toggleId={`${item.name}-toggle`}
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={(isExpanded) => setRuleTargetSelectOpen(isExpanded)}
              onSelect={handleRuleTargetSelection}
              selections={selectedRuleTarget}
              isOpen={isRuleTargetSelectOpen}
            >
              {item.rulesets.map((ruleset) => (
                <SelectOption
                  key={ruleset.name}
                  value={ruleset.metadata.target}
                >
                  {ruleset.metadata.target}
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
