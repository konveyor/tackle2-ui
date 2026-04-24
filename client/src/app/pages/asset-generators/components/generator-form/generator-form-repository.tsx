import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
} from "@patternfly/react-core";

import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { useFetchIdentities } from "@app/queries/identities";

const REPOSITORY_KIND_OPTIONS = [
  { value: "git", label: "Git" },
  { value: "subversion", label: "Subversion" },
];

export const GeneratorFormRepository: React.FC = () => {
  const { t } = useTranslation();
  const { control, trigger } = useFormContext();

  const { identities } = useFetchIdentities();
  const identitiesOptions = React.useMemo(
    () =>
      identities
        .filter(({ kind }) => kind === "source")
        .map(({ name }) => ({ value: name, label: name })),
    [identities]
  );

  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Toggle repository section"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: t("terms.generatorTemplateRepository"),
            id: "template-repository-header",
          }}
        />
      }
    >
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
            ariaLabel={name}
            value={value ?? undefined}
            options={REPOSITORY_KIND_OPTIONS}
            onSelect={(selection) => {
              onChange(selection);
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
          <TypeaheadSelect
            placeholderText={t("composed.selectOne", {
              what: t("terms.credentials").toLowerCase(),
            })}
            toggleId="credentials-toggle"
            toggleAriaLabel="Credentials select dropdown toggle"
            ariaLabel={name}
            value={value}
            options={identitiesOptions}
            onSelect={(selection) => onChange(selection ?? "")}
          />
        )}
      />
    </FormFieldGroupExpandable>
  );
};
