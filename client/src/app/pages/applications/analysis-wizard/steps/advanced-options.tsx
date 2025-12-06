import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { toggle } from "radash";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Checkbox,
  Flex,
  FlexItem,
  Form,
  Text,
  TextContent,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import {
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core/deprecated";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { Target, TargetLabel } from "@app/api/models";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { StringListField } from "@app/components/StringListField";
import { defaultTargets } from "@app/data/targets";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";
import { useFetchTargets } from "@app/queries/targets";
import { getParsedLabel } from "@app/utils/rules-utils";
import { getValidatedFromErrors, universalComparator } from "@app/utils/utils";

import {
  AdvancedOptionsState,
  AdvancedOptionsValues,
  useAdvancedOptionsSchema,
} from "../schema";
import defaultSources from "../sources";
import { updateSelectedTargetsBasedOnLabels } from "../utils";

interface AdvancedOptionsProps {
  selectedTargets: Target[];
  onSelectedTargetsChanged: (targets: Target[]) => void;
  onStateChanged: (state: AdvancedOptionsState) => void;
  initialState: AdvancedOptionsState;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  selectedTargets,
  onSelectedTargetsChanged,
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();

  const schema = useAdvancedOptionsSchema();
  const form = useForm<AdvancedOptionsValues>({
    defaultValues: {
      selectedSourceLabels: initialState.selectedSourceLabels,
      excludedLabels: initialState.excludedLabels,
      autoTaggingEnabled: initialState.autoTaggingEnabled,
      advancedAnalysisEnabled: initialState.advancedAnalysisEnabled,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });
  const { control, setValue } = form;

  const { excludedLabels, autoTaggingEnabled, advancedAnalysisEnabled } =
    useWatch({ control });

  useFormChangeHandler({ form, onStateChanged });

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  const { targets } = useFetchTargets();

  const allLabelsFromTargets = targets
    .map((target) => target?.labels ?? [])
    .filter(Boolean)
    .flat()
    // Remove duplicates from array of objects based on label value (label.label)
    .filter((v, i, a) => a.findIndex((v2) => v2.label === v.label) === i);

  const allTargetLabelsFromTargets = allLabelsFromTargets.filter(
    (label) => getParsedLabel(label?.label).labelType === "target"
  );

  const allSourceLabelsFromTargets = allLabelsFromTargets.filter(
    (label) => getParsedLabel(label?.label).labelType === "source"
  );

  const defaultTargetsAndTargetsLabels = Array.from(
    new Map(
      defaultTargets
        .concat(allTargetLabelsFromTargets)
        .map((item) => [item.label, item])
    ).values()
  ).sort((t1, t2) => universalComparator(t1.label, t2.label));

  const defaultSourcesAndSourcesLabels = Array.from(
    new Map(
      defaultSources
        .concat(allSourceLabelsFromTargets)
        .map((item) => [item.label, item])
    ).values()
  ).sort((t1, t2) => universalComparator(t1.label, t2.label));

  // Track selected target labels internally for this step
  const [selectedTargetLabels, setSelectedTargetLabels] = React.useState<
    TargetLabel[]
  >([]);

  return (
    <Form
      isHorizontal
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.title.advancedOptions")}
        </Title>
        <Text>{t("wizard.label.advancedOptions")}</Text>
      </TextContent>

      <HookFormPFGroupController
        control={control}
        name="selectedSourceLabels"
        label={t("wizard.terms.target", { count: 2 })}
        fieldId="target-labels"
        renderInput={({
          field: { onChange, onBlur },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const targetSelections = selectedTargetLabels
            .map((formLabel) => {
              const parsedLabel = getParsedLabel(formLabel?.label);
              if (parsedLabel.labelType === "target") {
                return parsedLabel.labelValue;
              }
            })
            .filter(Boolean);
          return (
            <Select
              id="targets"
              toggleId="targets-toggle"
              variant={SelectVariant.typeaheadMulti}
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              aria-label="Select targets"
              selections={targetSelections}
              isOpen={isSelectTargetsOpen}
              onSelect={(_, selection) => {
                const selectionLabel = `konveyor.io/target=${selection}`;
                const matchingLabel = defaultTargetsAndTargetsLabels.find(
                  (label) => label.label === selectionLabel
                );
                const updatedFormLabels = !matchingLabel
                  ? selectedTargetLabels
                  : toggle(
                      selectedTargetLabels,
                      matchingLabel,
                      (tl) => tl.label
                    );
                setSelectedTargetLabels(updatedFormLabels);

                const updatedSelectedTargets =
                  updateSelectedTargetsBasedOnLabels(
                    updatedFormLabels,
                    selectedTargets,
                    targets
                  );
                onSelectedTargetsChanged(updatedSelectedTargets);

                onBlur();
                setSelectTargetsOpen(!isSelectTargetsOpen);
              }}
              onToggle={() => {
                setSelectTargetsOpen(!isSelectTargetsOpen);
              }}
              onClear={() => {
                setSelectedTargetLabels([]);
              }}
              validated={getValidatedFromErrors(error, isDirty, isTouched)}
            >
              {defaultTargetsAndTargetsLabels.map((targetLabel, index) => (
                <SelectOption
                  key={index}
                  component="button"
                  value={getParsedLabel(targetLabel.label).labelValue}
                />
              ))}
            </Select>
          );
        }}
      />
      <HookFormPFGroupController
        control={control}
        name="selectedSourceLabels"
        label={t("wizard.terms.source", { count: 2 })}
        fieldId="sources"
        renderInput={({
          field: { onChange, onBlur, value },
          fieldState: { isDirty, error, isTouched },
        }) => {
          const sourceSelections = value
            .map((formLabel) => {
              const parsedLabel = getParsedLabel(formLabel?.label);
              if (parsedLabel.labelType === "source") {
                return parsedLabel.labelValue;
              }
            })
            .filter(Boolean);

          return (
            <Select
              id="formSources-id"
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              toggleId="sources-toggle"
              variant={SelectVariant.typeaheadMulti}
              aria-label="Select sources"
              selections={sourceSelections}
              isOpen={isSelectSourcesOpen}
              onSelect={(_, selection) => {
                const selectionWithLabelSelector = `konveyor.io/source=${selection}`;
                const matchingLabel =
                  defaultSourcesAndSourcesLabels?.find(
                    (label) => label.label === selectionWithLabelSelector
                  ) || "";

                const formLabelLabels = value.map(
                  (formLabel) => formLabel.label
                );
                if (
                  matchingLabel &&
                  !formLabelLabels.includes(matchingLabel.label)
                ) {
                  onChange([...value, matchingLabel]);
                } else {
                  onChange(
                    value.filter(
                      (formLabel) =>
                        formLabel.label !== selectionWithLabelSelector
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
              {defaultSourcesAndSourcesLabels.map((targetLabel, index) => (
                <SelectOption
                  key={index}
                  component="button"
                  value={getParsedLabel(targetLabel.label).labelValue}
                />
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

      <Checkbox
        className={spacing.mtMd}
        label={t("wizard.composed.enable", {
          what: t("wizard.terms.autoTagging").toLowerCase(),
        })}
        isChecked={autoTaggingEnabled}
        onChange={() => setValue("autoTaggingEnabled", !autoTaggingEnabled)}
        id="enable-auto-tagging-checkbox"
        name="autoTaggingEnabled"
      />

      <Flex>
        <FlexItem>
          <Checkbox
            className={spacing.mtMd}
            label={t("wizard.composed.enable", {
              what: t("wizard.terms.advancedAnalysisDetails").toLowerCase(),
            })}
            isChecked={advancedAnalysisEnabled}
            onChange={() =>
              setValue("advancedAnalysisEnabled", !advancedAnalysisEnabled)
            }
            id="enable-advanced-analysis-details-checkbox"
            name="advancedAnalysisDetailsEnabled"
          />
        </FlexItem>
        <FlexItem>
          <Tooltip
            position="right"
            content={t("wizard.tooltip.advancedAnalysisDetails")}
          >
            <QuestionCircleIcon className={spacing.mlSm} />
          </Tooltip>
        </FlexItem>
      </Flex>
    </Form>
  );
};
