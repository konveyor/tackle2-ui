import * as React from "react";
import {
  EmptyState,
  EmptyStateIcon,
  Title,
  EmptyStateVariant,
  Card,
  CardBody,
  Text,
  Flex,
  FlexItem,
  Button,
  ButtonVariant,
  Label,
  CardHeader,
  PanelMain,
  PanelMainBody,
  Panel,
} from "@patternfly/react-core";
import { DropdownItem } from "@patternfly/react-core/deprecated";
import {
  Select,
  SelectOption,
  SelectVariant,
  SelectOptionObject,
} from "@patternfly/react-core/deprecated";
import { CubesIcon, GripVerticalIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { KebabDropdown } from "@app/shared/components";
import { useTranslation } from "react-i18next";
import "./target-card.css";
import DefaultRulesetIcon from "@app/images/Icon-Red_Hat-Virtual_server_stack-A-Black-RGB.svg";
import { Target, TargetLabel } from "@app/api/models";

export interface TargetCardProps {
  item: Target;
  cardSelected?: boolean;
  isEditable?: boolean;
  onCardClick?: (
    isSelecting: boolean,
    targetLabelName: string,
    target: Target
  ) => void;
  onSelectedCardTargetChange?: (value: string) => void;
  formLabels?: TargetLabel[];
  handleProps?: any;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Force display dropdown box even though there only one option available.
// This is a business rule to guarantee that option is always present.
const forceSelect = ["Azure"];

export const TargetCard: React.FC<TargetCardProps> = ({
  item: target,
  readOnly,
  cardSelected,
  formLabels,
  onCardClick,
  onSelectedCardTargetChange,
  handleProps,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isCardSelected, setCardSelected] = React.useState(cardSelected);

  const prevSelectedLabel =
    formLabels?.find((formLabel) => {
      const labelNames = target?.labels?.map((label) => label.name);
      return labelNames?.includes(formLabel.name);
    })?.name || "";

  const [isLabelSelectOpen, setLabelSelectOpen] = React.useState(false);

  const [selectedLabelName, setSelectedLabelName] = React.useState<string>(
    prevSelectedLabel ||
      target?.labels?.[0]?.name ||
      `${target?.name || "target"}-Empty`
  );

  const handleCardClick = (event: React.MouseEvent) => {
    // Stop 'select' event propagation
    const eventTarget: any = event.target;
    if (eventTarget.type === "button") return;

    setCardSelected(!isCardSelected);
    onCardClick &&
      selectedLabelName &&
      onCardClick(!isCardSelected, selectedLabelName, target);
  };

  const handleLabelSelection = (
    event: React.MouseEvent | React.ChangeEvent,
    selection: string | SelectOptionObject
  ) => {
    event.stopPropagation();
    setLabelSelectOpen(false);
    setSelectedLabelName(selection as string);
    if (isCardSelected && onSelectedCardTargetChange) {
      onSelectedCardTargetChange(selection as string);
    }
  };

  const getImage = (): React.ComponentType => {
    let result: React.ComponentType<any> = CubesIcon;
    const imagePath = target?.image?.id
      ? `/hub/files/${target?.image.id}`
      : DefaultRulesetIcon;
    if (target.image) {
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
      className="pf-v5-l-stack pf-v5-l-stack__item pf-m-fill"
    >
      <CardHeader
        selectableActions={{
          selectableActionId: "" + target.id,
          isChecked: isCardSelected,
        }}
      />
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
            {readOnly && target.custom ? (
              <Label color="grey">Custom</Label>
            ) : (
              target.custom && (
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
          variant={EmptyStateVariant.sm}
          className="select-card__component__empty-state"
        >
          <EmptyStateIcon icon={getImage()} />
          <Title headingLevel="h4" size="md">
            {target.name}
          </Title>
          {target.choice &&
          ((!!target?.labels?.length && target?.labels?.length > 1) ||
            forceSelect.includes(target.name)) ? (
            <Select
              className={spacing.mtSm}
              toggleId={`${target.name}-toggle`}
              variant={SelectVariant.single}
              aria-label="Select Label"
              onToggle={(_, isExpanded) => setLabelSelectOpen(isExpanded)}
              onSelect={handleLabelSelection}
              selections={selectedLabelName}
              isOpen={isLabelSelectOpen}
              width={250}
            >
              {target?.labels?.map((label) => (
                <SelectOption key={label.name} value={label.name}>
                  {label.name ? label.name : "Empty"}
                </SelectOption>
              ))}
            </Select>
          ) : null}
          {target.description ? (
            <Panel isScrollable className="panel-style">
              <PanelMain maxHeight={target.choice ? "9em" : "12em"}>
                <PanelMainBody>
                  <Text className={`${spacing.pMd} pf-v5-u-text-align-left`}>
                    {target.description}
                  </Text>
                </PanelMainBody>
              </PanelMain>
            </Panel>
          ) : null}
        </EmptyState>
      </CardBody>
    </Card>
  );
};
