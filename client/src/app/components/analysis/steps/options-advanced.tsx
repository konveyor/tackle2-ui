import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { toggle } from "radash";
import { UseFormSetValue, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Checkbox,
  Flex,
  FlexItem,
  Form,
  FormGroup,
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
import { AnalysisProfile, Target, TargetLabel } from "@app/api/models";
import { TargetLabelSchema } from "@app/api/schemas";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { StringListField } from "@app/components/StringListField";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";
import { useIsArchitect } from "@app/hooks/useIsArchitect";
import { useFetchAnalysisProfiles } from "@app/queries/analysis-profiles";
import { parseAndGroupLabels, parseLabels } from "@app/utils/rules-utils";
import { duplicateNameCheck, getValidatedFromErrors } from "@app/utils/utils";

import { GroupOfLabels } from "../components/group-of-labels";
import { useSourceLabels } from "../hooks/useSourceLabels";
import { useTargetLabels } from "../hooks/useTargetLabels";

import { CustomRulesStepState } from "./custom-rules";

export interface AdvancedOptionsValues {
  additionalTargetLabels: TargetLabel[];
  additionalSourceLabels: TargetLabel[];

  excludedLabels: string[];
  autoTaggingEnabled: boolean;
  advancedAnalysisEnabled: boolean;

  saveAsProfile: boolean;
  profileName?: string;
}

export interface AdvancedOptionsState extends AdvancedOptionsValues {
  isValid: boolean;
}

export const useAdvancedOptionsSchema = ({
  existingProfiles = [],
  showSaveAsProfile = true,
}: {
  existingProfiles?: AnalysisProfile[];
  showSaveAsProfile?: boolean;
}): yup.SchemaOf<AdvancedOptionsValues> => {
  const { t } = useTranslation();
  return yup.object({
    additionalTargetLabels: yup.array().of(TargetLabelSchema),
    additionalSourceLabels: yup.array().of(TargetLabelSchema),
    excludedLabels: yup.array().of(yup.string().defined()),
    autoTaggingEnabled: yup.bool().defined(),
    advancedAnalysisEnabled: yup.bool().defined(),
    saveAsProfile: yup.bool().defined(),
    profileName: yup.string().when("saveAsProfile", {
      is: true,
      then: (schema) =>
        showSaveAsProfile
          ? schema
              .required()
              .test(
                "unique-name",
                t("validation.duplicateAnalysisProfileName"),
                (value) =>
                  duplicateNameCheck(existingProfiles, null, value ?? "")
              )
          : schema, // When not showing save as profile, no validation needed
    }),
  });
};

interface OptionsAdvancedProps {
  selectedTargets: [Target, TargetLabel | null][];
  customRules: CustomRulesStepState;
  onStateChanged: (state: AdvancedOptionsState) => void;
  initialState: AdvancedOptionsState;

  /**
   * Whether to show the "Save as profile" section.
   * Defaults to true (analysis wizard behavior).
   * Set to false for profile wizard where the profile is being directly edited.
   */
  showSaveAsProfile?: boolean;
}

export const OptionsAdvanced: React.FC<OptionsAdvancedProps> = ({
  selectedTargets,
  customRules,
  onStateChanged,
  initialState,
  showSaveAsProfile = true,
}) => {
  const { t } = useTranslation();
  const { analysisProfiles } = useFetchAnalysisProfiles();

  const schema = useAdvancedOptionsSchema({
    existingProfiles: analysisProfiles,
    showSaveAsProfile,
  });
  const form = useForm<AdvancedOptionsValues>({
    defaultValues: {
      additionalTargetLabels: initialState.additionalTargetLabels,
      additionalSourceLabels: initialState.additionalSourceLabels,
      excludedLabels: initialState.excludedLabels,
      autoTaggingEnabled: initialState.autoTaggingEnabled,
      advancedAnalysisEnabled: initialState.advancedAnalysisEnabled,
      saveAsProfile: initialState.saveAsProfile,
      profileName: initialState.profileName,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });
  const setValue: UseFormSetValue<AdvancedOptionsValues> = React.useCallback(
    (name, value) => {
      form.setValue(name, value, { shouldValidate: true });
    },
    [form]
  );
  const { control } = form;

  const {
    excludedLabels,
    autoTaggingEnabled,
    advancedAnalysisEnabled,
    saveAsProfile,
  } = useWatch({ control });

  useFormChangeHandler({ form, onStateChanged });

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);

  // TODO: Include labels parsed from uploaded manual custom rule files?
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
  const canSaveAsProfile = useIsArchitect();

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

      {showSaveAsProfile && canSaveAsProfile && (
        <>
          <Checkbox
            className={spacing.mtMd}
            label={t("wizard.label.saveAsProfile")}
            isChecked={saveAsProfile}
            onChange={() => setValue("saveAsProfile", !saveAsProfile)}
            id="save-as-profile-checkbox"
            name="saveAsProfile"
          />
          <HookFormPFTextInput
            control={control}
            name="profileName"
            label={t("terms.name")}
            fieldId="analysis-profile-name"
            isDisabled={!saveAsProfile}
            isRequired={saveAsProfile}
          />
        </>
      )}

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
            name="advancedAnalysisEnabled"
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

// Re-export with original name for backward compatibility
export { OptionsAdvanced as OptionsManual };
