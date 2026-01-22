import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { toggle } from "radash";
import { UseFormSetValue, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import {
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core/deprecated";
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
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("analysisSteps.labels.title")}
        </Title>
        <Text>{t("analysisSteps.labels.description")}</Text>
      </TextContent>

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
                groupName="Manual custom rules"
                items={customLabels.target}
              />
            </FlexItem>
          )}
        </Flex>
      </FormGroup>

      <HookFormPFGroupController
        control={control}
        label="Additional target labels"
        name="additionalTargetLabels"
        fieldId="additional-target-labels"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const selections = parseLabels(value).map((label) => label.value);
          return (
            <Select
              id="additional-target-labels"
              toggleId="additional-target-labels-toggle"
              variant={SelectVariant.typeaheadMulti}
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              aria-label="Select targets"
              selections={selections}
              isOpen={isSelectTargetsOpen}
              onSelect={(_, selection) => {
                const selectedLabel = availableTargetLabels.find(
                  (label) => label.value === selection
                );
                if (selectedLabel) {
                  onChange(
                    toggle(
                      value,
                      selectedLabel.targetLabel,
                      (label) => label.label
                    )
                  );
                }
                onBlur();
                setSelectTargetsOpen(!isSelectTargetsOpen);
              }}
              onToggle={() => {
                setSelectTargetsOpen(!isSelectTargetsOpen);
              }}
              onClear={() => {
                onChange([]);
              }}
              validated={getValidatedFromErrors(error, isDirty, isTouched)}
            >
              {availableTargetLabels.map(({ value }, index) => (
                <SelectOption key={index} component="button" value={value} />
              ))}
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
                groupName="Manual custom rules"
                items={customLabels.source}
              />
            </FlexItem>
          )}
        </Flex>
      </FormGroup>

      <HookFormPFGroupController
        control={control}
        label="Additional source labels"
        name="additionalSourceLabels"
        fieldId="additional-source-labels"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const selections = parseLabels(value).map((label) => label.value);
          return (
            <Select
              id="additional-source-labels"
              toggleId="additional-source-labels-toggle"
              variant={SelectVariant.typeaheadMulti}
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              aria-label="Select sources"
              selections={selections}
              isOpen={isSelectSourcesOpen}
              onSelect={(_, selection) => {
                const selectedLabel = availableSourceLabels.find(
                  (label) => label.value === selection
                );
                if (selectedLabel) {
                  onChange(
                    toggle(
                      value,
                      selectedLabel.targetLabel,
                      (label) => label.label
                    )
                  );
                }
                onBlur();
                setSelectSourcesOpen(!isSelectSourcesOpen);
              }}
              onToggle={() => {
                setSelectSourcesOpen(!isSelectSourcesOpen);
              }}
              onClear={() => {
                onChange([]);
              }}
              validated={getValidatedFromErrors(error, isDirty, isTouched)}
            >
              {availableSourceLabels.map(({ value }, index) => (
                <SelectOption key={index} component="button" value={value} />
              ))}
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
