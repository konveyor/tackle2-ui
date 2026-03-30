import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { toggle as radashToggle } from "radash";
import { UseFormSetValue, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Button,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Label,
  LabelGroup,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Title,
} from "@patternfly/react-core";
import { TimesIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Target, TargetLabel } from "@app/api/models";
import { TargetLabelSchema } from "@app/api/schemas";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { StringListField } from "@app/components/StringListField";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";
import { parseAndGroupLabels, parseLabels } from "@app/utils/rules-utils";
import { getValidatedFromErrors } from "@app/utils/utils";

import { GroupOfLabels } from "../components/group-of-labels";
import { useSourceLabels } from "../hooks/useSourceLabels";
import { useTargetLabels } from "../hooks/useTargetLabels";

import { CustomRulesStepState } from "./custom-rules";

export interface AnalysisLabelsValues {
  additionalTargetLabels: TargetLabel[];
  additionalSourceLabels: TargetLabel[];
  excludedLabels: string[];
}

export interface AnalysisLabelsState extends AnalysisLabelsValues {
  isValid: boolean;
}

export const useAnalysisLabelsSchema =
  (): yup.SchemaOf<AnalysisLabelsValues> => {
    return yup.object({
      additionalTargetLabels: yup.array().of(TargetLabelSchema),
      additionalSourceLabels: yup.array().of(TargetLabelSchema),
      excludedLabels: yup.array().of(yup.string().defined()),
    });
  };

interface AnalysisLabelsProps {
  selectedTargets: [Target, TargetLabel | null][];
  customRules: CustomRulesStepState;
  onStateChanged: (state: AnalysisLabelsState) => void;
  initialState: AnalysisLabelsState;
}

export const AnalysisLabels: React.FC<AnalysisLabelsProps> = ({
  selectedTargets,
  customRules,
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();

  const schema = useAnalysisLabelsSchema();
  const form = useForm<AnalysisLabelsValues>({
    defaultValues: {
      additionalTargetLabels: initialState.additionalTargetLabels,
      additionalSourceLabels: initialState.additionalSourceLabels,
      excludedLabels: initialState.excludedLabels,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });
  const setValue: UseFormSetValue<AnalysisLabelsValues> = React.useCallback(
    (name, value) => {
      form.setValue(name, value, { shouldValidate: true });
    },
    [form]
  );

  const { control } = form;
  const { excludedLabels } = useWatch({ control });
  useFormChangeHandler({ form, onStateChanged });

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  const [targetFilterValue, setTargetFilterValue] = React.useState("");
  const [sourceFilterValue, setSourceFilterValue] = React.useState("");

  const availableTargetLabels = parseLabels(useTargetLabels());
  const availableSourceLabels = parseLabels(useSourceLabels());

  const targetLabels = selectedTargets.reduce(
    (acc, [target, targetLabel]) => {
      const labels = targetLabel === null ? target.labels : [targetLabel];
      acc[target.name] = parseAndGroupLabels(labels ?? []);
      return acc;
    },
    {} as Record<string, ReturnType<typeof parseAndGroupLabels>>
  );

  const customLabels = parseAndGroupLabels(customRules.customLabels);

  return (
    <Form
      isHorizontal
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Content>
        <Title headingLevel="h3" size="xl">
          {t("analysisSteps.labels.title")}
        </Title>
        <p>{t("analysisSteps.labels.description")}</p>
      </Content>

      {/* TODO: Rotate the GroupOfLabels color so each group has a different color */}
      <FormGroup
        label={"Assigned target labels"}
        fieldId="assigned-target-labels"
      >
        <Flex direction={{ default: "row" }}>
          {Object.entries(targetLabels)
            .filter(([_, { target }]) => target.length > 0)
            .map(([targetName, { target }]) => (
              <FlexItem key={targetName}>
                <GroupOfLabels
                  key={targetName}
                  labelColor={"grey"}
                  groupName={targetName}
                  items={target}
                />
              </FlexItem>
            ))}
          {customLabels.target.length > 0 && (
            <FlexItem key={`manual-custom-rules-${customLabels.target.length}`}>
              <GroupOfLabels
                labelColor={"grey"}
                groupName={t("analysisSteps.review.manualCustomRules")}
                items={customLabels.target}
              />
            </FlexItem>
          )}
        </Flex>
      </FormGroup>

      <HookFormPFGroupController
        control={control}
        label={t("analysisSteps.review.additionalTargetLabels")}
        name="additionalTargetLabels"
        fieldId="additional-target-labels"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const selections = parseLabels(value).map((label) => label.value);
          const filteredTargetLabels = availableTargetLabels.filter(
            (label) =>
              !targetFilterValue ||
              label.value
                .toLowerCase()
                .includes(targetFilterValue.toLowerCase())
          );

          const onTargetSelect = (
            _event: React.MouseEvent<Element, MouseEvent> | undefined,
            selection: SelectOptionProps["value"]
          ) => {
            const selectedLabel = availableTargetLabels.find(
              (label) => label.value === selection
            );
            if (selectedLabel) {
              onChange(
                radashToggle(
                  value,
                  selectedLabel.targetLabel,
                  (label) => label.label
                )
              );
            }
            onBlur();
            setTargetFilterValue("");
          };

          const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              id="additional-target-labels-toggle"
              ref={toggleRef}
              variant="typeahead"
              onClick={() => setSelectTargetsOpen(!isSelectTargetsOpen)}
              isExpanded={isSelectTargetsOpen}
              isFullWidth
              status={
                getValidatedFromErrors(error, isDirty, isTouched) === "error"
                  ? "danger"
                  : undefined
              }
            >
              <TextInputGroup isPlain>
                <TextInputGroupMain
                  value={targetFilterValue}
                  onClick={() => setSelectTargetsOpen(!isSelectTargetsOpen)}
                  onChange={(_event, val) => setTargetFilterValue(val)}
                  autoComplete="off"
                  placeholder="Select targets"
                  aria-label="Select targets"
                >
                  <LabelGroup aria-label="Selected targets">
                    {selections.map((selection, index) => (
                      <Label
                        key={index}
                        onClose={(e) => {
                          e.stopPropagation();
                          const labelToRemove = availableTargetLabels.find(
                            (label) => label.value === selection
                          );
                          if (labelToRemove) {
                            onChange(
                              value.filter(
                                (label: TargetLabel) =>
                                  label.label !==
                                  labelToRemove.targetLabel.label
                              )
                            );
                          }
                        }}
                      >
                        {selection}
                      </Label>
                    ))}
                  </LabelGroup>
                </TextInputGroupMain>
                <TextInputGroupUtilities>
                  {selections.length > 0 && (
                    <Button
                      variant="plain"
                      onClick={() => {
                        onChange([]);
                        setTargetFilterValue("");
                      }}
                      aria-label="Clear selections"
                      icon={<TimesIcon />}
                    />
                  )}
                </TextInputGroupUtilities>
              </TextInputGroup>
            </MenuToggle>
          );

          return (
            <Select
              id="additional-target-labels"
              isOpen={isSelectTargetsOpen}
              selected={selections}
              onSelect={onTargetSelect}
              onOpenChange={(isOpen) => setSelectTargetsOpen(isOpen)}
              toggle={toggle}
              style={{ maxHeight: DEFAULT_SELECT_MAX_HEIGHT, overflow: "auto" }}
            >
              <SelectList>
                {filteredTargetLabels.map(({ value }, index) => (
                  <SelectOption
                    key={index}
                    value={value}
                    isSelected={selections.includes(value)}
                  >
                    {value}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          );
        }}
      />

      {/* TODO: Rotate the GroupOfLabels color so each group has a different color */}
      <FormGroup
        label={"Assigned source labels"}
        fieldId="assigned-source-labels"
      >
        <Flex direction={{ default: "row" }}>
          {Object.entries(targetLabels)
            .filter(([_, { source }]) => source.length > 0)
            .map(([targetName, { source }]) => (
              <FlexItem key={targetName}>
                <GroupOfLabels
                  key={targetName}
                  labelColor={"grey"}
                  groupName={targetName}
                  items={source}
                />
              </FlexItem>
            ))}
          {customLabels.source.length > 0 && (
            <FlexItem>
              <GroupOfLabels
                labelColor={"grey"}
                groupName={t("analysisSteps.review.manualCustomRules")}
                items={customLabels.source}
              />
            </FlexItem>
          )}
        </Flex>
      </FormGroup>

      <HookFormPFGroupController
        control={control}
        label={t("analysisSteps.review.additionalSourceLabels")}
        name="additionalSourceLabels"
        fieldId="additional-source-labels"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const selections = parseLabels(value).map((label) => label.value);
          const filteredSourceLabels = availableSourceLabels.filter(
            (label) =>
              !sourceFilterValue ||
              label.value
                .toLowerCase()
                .includes(sourceFilterValue.toLowerCase())
          );

          const onSourceSelect = (
            _event: React.MouseEvent<Element, MouseEvent> | undefined,
            selection: SelectOptionProps["value"]
          ) => {
            const selectedLabel = availableSourceLabels.find(
              (label) => label.value === selection
            );
            if (selectedLabel) {
              onChange(
                radashToggle(
                  value,
                  selectedLabel.targetLabel,
                  (label) => label.label
                )
              );
            }
            onBlur();
            setSourceFilterValue("");
          };

          const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              id="additional-source-labels-toggle"
              ref={toggleRef}
              variant="typeahead"
              onClick={() => setSelectSourcesOpen(!isSelectSourcesOpen)}
              isExpanded={isSelectSourcesOpen}
              isFullWidth
              status={
                getValidatedFromErrors(error, isDirty, isTouched) === "error"
                  ? "danger"
                  : undefined
              }
            >
              <TextInputGroup isPlain>
                <TextInputGroupMain
                  value={sourceFilterValue}
                  onClick={() => setSelectSourcesOpen(!isSelectSourcesOpen)}
                  onChange={(_event, val) => setSourceFilterValue(val)}
                  autoComplete="off"
                  placeholder="Select sources"
                  aria-label="Select sources"
                >
                  <LabelGroup aria-label="Selected sources">
                    {selections.map((selection, index) => (
                      <Label
                        key={index}
                        onClose={(e) => {
                          e.stopPropagation();
                          const labelToRemove = availableSourceLabels.find(
                            (label) => label.value === selection
                          );
                          if (labelToRemove) {
                            onChange(
                              value.filter(
                                (label: TargetLabel) =>
                                  label.label !==
                                  labelToRemove.targetLabel.label
                              )
                            );
                          }
                        }}
                      >
                        {selection}
                      </Label>
                    ))}
                  </LabelGroup>
                </TextInputGroupMain>
                <TextInputGroupUtilities>
                  {selections.length > 0 && (
                    <Button
                      variant="plain"
                      onClick={() => {
                        onChange([]);
                        setSourceFilterValue("");
                      }}
                      aria-label="Clear selections"
                      icon={<TimesIcon />}
                    />
                  )}
                </TextInputGroupUtilities>
              </TextInputGroup>
            </MenuToggle>
          );

          return (
            <Select
              id="additional-source-labels"
              isOpen={isSelectSourcesOpen}
              selected={selections}
              onSelect={onSourceSelect}
              onOpenChange={(isOpen) => setSelectSourcesOpen(isOpen)}
              toggle={toggle}
              style={{ maxHeight: DEFAULT_SELECT_MAX_HEIGHT, overflow: "auto" }}
            >
              <SelectList>
                {filteredSourceLabels.map(({ value }, index) => (
                  <SelectOption
                    key={index}
                    value={value}
                    isSelected={selections.includes(value)}
                  >
                    {value}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          );
        }}
      />

      <StringListField
        listItems={excludedLabels ?? []}
        setListItems={(items) => setValue("excludedLabels", items)}
        itemToAddSchema={yup
          .string()
          .min(2, t("validation.minLength", { length: 2 }))
          .max(60, t("validation.maxLength", { length: 60 }))}
        itemToAddFieldId="ruleTagToExclude"
        itemToAddLabel={t("wizard.composed.excluded", {
          what: t("wizard.terms.rulesTags"),
        })}
        itemToAddAriaLabel="Add a rule tag to exclude"
        itemNotUniqueMessage="This rule tag is already excluded"
        removeItemButtonId={(tag) => `remove-${tag}-from-excluded-rules-tags`}
        className={spacing.mtMd}
      />
    </Form>
  );
};
