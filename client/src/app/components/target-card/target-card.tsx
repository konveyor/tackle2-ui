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
  isCardSelected?: boolean;
  onChange?: (
    isSelected: boolean,
    selectedLabel: TargetLabel | null,
    target: Target
  ) => void;
  selectedLabel?: TargetLabel | null;
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
  isCardSelected = false,
  selectedLabel,
  onChange,
  dndSortHandle,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const imageDataUrl = useFetchImageDataUrl(target);

  const handleToggleSelection = () => {
    if (onChange) {
      onChange(!isCardSelected, selectedLabel ?? null, target);
    }
  };

  const handleLabelChange = (labelName: string) => {
    if (onChange) {
      const selectedLabel = labelChoices.find(
        (label) => label.name === labelName
      );
      onChange(isCardSelected, selectedLabel ?? null, target);
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

  const { labelChoices, labelOptions } = React.useMemo(() => {
    let labelChoices: TargetLabel[] = [];
    if (target.choice || forceSelect.includes(target.name)) {
      labelChoices = target?.labels ?? [];
      labelChoices.sort((a, b) => localeNumericCompare(b.label, a.label));
    }
    const labelOptions = labelChoices.map((label) => ({
      children: label.name,
      value: label.name,
    }));
    return { labelChoices, labelOptions };
  }, [target]);

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
      isSelected={isCardSelected}
      isFullHeight
      isCompact
      isFlat
    >
      <CardHeader
        selectableActions={{
          isChecked: isCardSelected,
          name: `${idCard}-select`,
          selectableActionId: `${idCard}-select`,
          selectableActionAriaLabelledby: idCard,
          onChange: handleToggleSelection,
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
                value={selectedLabel?.name}
                options={labelOptions}
                onChange={handleLabelChange}
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
