import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  DropdownItem,
  EmptyStateIcon,
  Flex,
  FlexItem,
  Label,
  Panel,
  PanelMain,
  PanelMainBody,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Target, TargetLabel } from "@app/api/models";
import DefaultImage from "@app/images/Icon-Red_Hat-Virtual_server_stack-A-Black-RGB.svg";
import { localeNumericCompare } from "@app/utils/utils";

import { KebabDropdown } from "../KebabDropdown";
import { SimpleSelectBasic } from "../SimpleSelectBasic";

import useFetchImageDataUrl from "./hooks/useFetchImageDataUrl";

import "./target-card.css";

export interface TargetCardProps {
  item: Target;
  cardSelected?: boolean;
  onCardClick?: (
    isSelecting: boolean,
    targetLabelName: string,
    target: Target
  ) => void;
  onSelectedCardTargetChange?: (value: string) => void;
  selectedTargetLabels?: TargetLabel[];
  readOnly?: boolean;
  dndSortHandle?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Force display dropdown box even though there only one option available.
 * This is a business rule to guarantee that option is always present.
 */
const forceSelect = ["Azure"];

export const TargetCard: React.FC<TargetCardProps> = ({
  item: target,
  readOnly = false,
  cardSelected = false,
  selectedTargetLabels,
  onCardClick,
  onSelectedCardTargetChange,
  dndSortHandle,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const imageDataUrl = useFetchImageDataUrl(target);

  const targetLabels = (target?.labels ?? []).sort((a, b) =>
    localeNumericCompare(b.label, a.label)
  );

  const [selectedLabelName, setSelectedLabelName] = React.useState<string>(
    () => {
      const prevSelectedLabel =
        selectedTargetLabels?.find((label) => {
          const labelNames = targetLabels.map((label) => label.name);
          return labelNames?.includes(label.name);
        })?.name || "";

      return (
        prevSelectedLabel ||
        targetLabels[0]?.name ||
        `${target?.name || "target"}-Empty`
      );
    }
  );

  const handleCardClick = () => {
    if (onCardClick && selectedLabelName) {
      onCardClick(!cardSelected, selectedLabelName, target);
    }
  };

  const handleLabelSelection = (selection: string) => {
    setSelectedLabelName(selection);
    if (cardSelected && onSelectedCardTargetChange) {
      onSelectedCardTargetChange(selection);
    }
  };

  const TargetLogo = () => (
    <img
      src={imageDataUrl || DefaultImage}
      alt="Card logo"
      style={{ height: 80, pointerEvents: "none" }}
      onError={(e) => {
        e.currentTarget.src = DefaultImage;
      }}
    />
  );

  const labelChoices =
    target.choice || forceSelect.includes(target.name) ? targetLabels : [];

  const idCard = `target-${target.name.replace(/\s/g, "-")}`;
  const idProv = `${idCard}-provider-${target.provider?.replace(/\s/g, "-")}`;

  return (
    <Card
      key={`target-card-${target.id}`}
      className="target-card"
      id={idCard}
      data-target-name={target.name}
      data-target-id={target.id}
      isSelectable={readOnly}
      isSelected={cardSelected}
      isFullHeight
      isCompact
      isFlat
    >
      <CardHeader
        selectableActions={{
          isChecked: cardSelected,
          name: `${idCard}-select`,
          selectableActionId: `${idCard}-select`,
          selectableActionAriaLabelledby: idCard,
          onChange: handleCardClick,
        }}
      >
        <Label
          id={`${idProv}-label`}
          variant="outline"
          icon={<InfoCircleIcon />}
        >
          {target.provider}
        </Label>
      </CardHeader>
      <CardBody>
        <Flex>
          <FlexItem>{dndSortHandle}</FlexItem>
          <FlexItem className={spacing.mlAuto}>
            {target.custom && readOnly && <Label color="grey">Custom</Label>}
            {target.custom && !readOnly && (
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
            )}
          </FlexItem>
        </Flex>

        <Stack hasGutter>
          <StackItem>
            <Bullseye>
              <EmptyStateIcon color="black" icon={TargetLogo} />
            </Bullseye>
          </StackItem>
          <StackItem>
            <Bullseye>
              <Title headingLevel="h4" size="md">
                {target.name}
              </Title>
            </Bullseye>
          </StackItem>

          {/* Target label choice */}
          {labelChoices.length === 0 ? null : (
            <StackItem className="target-label-choice-container">
              <SimpleSelectBasic
                selectId={`${target.name}-label-menu`}
                toggleId={`${target.name}-toggle`}
                toggleAriaLabel="Select label dropdown target"
                aria-label="Select Label"
                value={selectedLabelName}
                options={labelChoices.map((label) => ({
                  children: label.name,
                  value: label.name,
                }))}
                onChange={(option) => {
                  handleLabelSelection(option);
                }}
              />
            </StackItem>
          )}

          {/* Target description */}
          <StackItem isFilled>
            {target.description ? (
              <Panel isScrollable className="panel-style">
                <PanelMain maxHeight={target.choice ? "9em" : "12em"}>
                  <PanelMainBody>{target.description}</PanelMainBody>
                </PanelMain>
              </Panel>
            ) : null}
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};
