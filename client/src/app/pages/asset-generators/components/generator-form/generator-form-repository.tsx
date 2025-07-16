import React from "react";
import { useTranslation } from "react-i18next";
import { ExpandableSection } from "@patternfly/react-core";
import { Control, UseFormTrigger } from "react-hook-form";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { toOptionLike } from "@app/utils/model-utils";

interface GeneratorFormRepositoryProps {
  control: Control<any>;
  trigger: UseFormTrigger<any>;
  kindOptions: OptionWithValue<string>[];
}

export const GeneratorFormRepository: React.FC<
  GeneratorFormRepositoryProps
> = ({ control, trigger, kindOptions }) => {
  const { t } = useTranslation();
  const [isSourceCodeExpanded, setSourceCodeExpanded] = React.useState(false);

  return (
    <ExpandableSection
      toggleText={t("terms.sourceCode")}
      className="toggle"
      onToggle={() => setSourceCodeExpanded(!isSourceCodeExpanded)}
      isExpanded={isSourceCodeExpanded}
    >
      <div className="pf-v5-c-form">
        <HookFormPFGroupController
          control={control}
          name="repository.kind"
          label={t("terms.repositoryType")}
          fieldId="repository-type-select"
          renderInput={({ field: { value, name, onChange } }) => (
            <SimpleSelect
              toggleId="repo-type-toggle"
              toggleAriaLabel="Type select dropdown toggle"
              aria-label={name}
              value={value ? toOptionLike(value, kindOptions) : undefined}
              options={kindOptions}
              onChange={(selection) => {
                const selectionValue = selection as OptionWithValue<string>;
                onChange(selectionValue.value);
                trigger("repository.url");
              }}
            />
          )}
        />
        <HookFormPFTextInput
          control={control}
          name="repository.url"
          label={t("terms.sourceRepo")}
          fieldId="repository.url"
          aria-label="source repository url"
        />
        <HookFormPFTextInput
          control={control}
          type="text"
          aria-label="Repository branch"
          name="repository.branch"
          label={t("terms.sourceBranch")}
          fieldId="branch"
        />
        <HookFormPFTextInput
          control={control}
          name="repository.path"
          label={t("terms.sourceRootPath")}
          fieldId="path"
        />
      </div>
    </ExpandableSection>
  );
};
