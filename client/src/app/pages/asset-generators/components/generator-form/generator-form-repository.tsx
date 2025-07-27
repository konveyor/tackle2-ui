import React from "react";
import { useTranslation } from "react-i18next";
import { ExpandableSection } from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { toOptionLike } from "@app/utils/model-utils";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchIdentities } from "@app/queries/identities";

// Static configuration moved outside component to prevent recreation
const REPOSITORY_KIND_OPTIONS = [
  {
    value: "git",
    toString: () => `Git`,
  },
  {
    value: "subversion",
    toString: () => `Subversion`,
  },
];

export const GeneratorFormRepository: React.FC = () => {
  const { t } = useTranslation();
  const [isSourceCodeExpanded, setSourceCodeExpanded] = React.useState(true);
  const { control, trigger } = useFormContext();

  const { identities } = useFetchIdentities();
  const identitiesOptions = React.useMemo(
    () =>
      identities
        .filter(({ kind }) => kind === "source")
        .map(({ name }) => name),
    [identities]
  );

  return (
    <ExpandableSection // TODO: Convert to FormFieldGroupExpandable
      toggleText={t("terms.generatorTemplateRepository")}
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
          isRequired
          renderInput={({ field: { value, name, onChange } }) => (
            <SimpleSelect
              toggleId="repo-type-toggle"
              toggleAriaLabel="Type select dropdown toggle"
              aria-label={name}
              value={
                value ? toOptionLike(value, REPOSITORY_KIND_OPTIONS) : undefined
              }
              options={REPOSITORY_KIND_OPTIONS}
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
          label={t("terms.url")}
          fieldId="repository.url"
          aria-label="source repository url"
          isRequired
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
        <HookFormPFGroupController
          control={control}
          name="credentials"
          label={t("terms.credentials")}
          fieldId="credentials"
          renderInput={({ field: { value, name, onChange } }) => (
            <>
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.credentials").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="credentials-toggle"
                id="credentials-select"
                toggleAriaLabel="Credentials select dropdown toggle"
                aria-label={name}
                value={value}
                options={identitiesOptions}
                onChange={(selection) => {
                  onChange(selection);
                }}
                onClear={() => onChange("")}
              />
            </>
          )}
        />
      </div>
    </ExpandableSection>
  );
};
