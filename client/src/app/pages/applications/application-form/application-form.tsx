import "./application-form.css";
import React from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ExpandableSection,
  Form,
  Popover,
  PopoverPosition,
} from "@patternfly/react-core";
import { QuestionCircleIcon } from "@patternfly/react-icons";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import {
  HookFormAutocomplete,
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { toOptionLike } from "@app/utils/model-utils";

import { DecoratedApplication } from "../useDecoratedApplications";

import { useApplicationForm } from "./useApplicationForm";
import { useApplicationFormData } from "./useApplicationFormData";

export interface ApplicationFormProps {
  form: ReturnType<typeof useApplicationForm>["form"];
  data: ReturnType<typeof useApplicationFormData>;
  application: DecoratedApplication | null;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = (props) => {
  const { isDataReady } = props.data;
  return (
    <ConditionalRender when={!isDataReady} then={<AppPlaceholder />}>
      <ApplicationFormReady {...props} key={props.application?.id ?? -1} />
    </ConditionalRender>
  );
};

export const ApplicationFormReady: React.FC<ApplicationFormProps> = ({
  form: { control, trigger, getValues, setValue },
  data: {
    tagItems,
    stakeholdersOptions,
    repositoryKindOptions,
    stakeholders,
    businessServiceOptions,
    sourcePlatformFromName,
    sourcePlatformOptions,
  },
  application,
}) => {
  const { t } = useTranslation();
  const watchKind = useWatch({ control, name: "kind" });
  const watchAssetKind = useWatch({ control, name: "assetKind" });
  const values = getValues();

  const [isBasicExpanded, setBasicExpanded] = React.useState(true);

  const [isSourceCodeExpanded, setSourceCodeExpanded] = React.useState(
    application === null || (!!values.kind && !!values.sourceRepository)
  );

  const [isBinaryExpanded, setBinaryExpanded] = React.useState(
    application !== null &&
      !!values.group &&
      !!values.artifact &&
      !!values.version
  );

  const [isSourcePlatformExpanded, setSourcePlatformExpanded] = React.useState(
    application !== null && !!values.sourcePlatform
  );

  const [isAssetRepositoryExpanded, setAssetRepositoryExpanded] =
    React.useState(
      application !== null && !!values.assetKind && !!values.assetRepository
    );

  return (
    <Form>
      <ExpandableSection
        toggleText={"Basic information"}
        className="toggle"
        onToggle={() => setBasicExpanded(!isBasicExpanded)}
        isExpanded={isBasicExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFTextInput
            control={control}
            name="name"
            label="Name"
            fieldId="name"
            isRequired
          />
          <HookFormPFTextInput
            control={control}
            name="description"
            label="Description"
            fieldId="description"
          />
          <HookFormPFGroupController
            control={control}
            name="businessServiceName"
            label={t("terms.businessService")}
            fieldId="businessService"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.businessService").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="business-service-toggle"
                id="business-service-select"
                toggleAriaLabel="Business service select dropdown toggle"
                aria-label={name}
                value={
                  value
                    ? toOptionLike(value, businessServiceOptions)
                    : undefined
                }
                options={businessServiceOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
                onClear={() => onChange("")}
              />
            )}
          />

          <HookFormAutocomplete
            items={tagItems}
            control={control}
            name="tags"
            label={t("terms.manualTags")}
            fieldId="tags"
            noResultsMessage={t("message.noResultsFoundTitle")}
            placeholderText={t("composed.selectMany", {
              what: t("terms.tags").toLowerCase(),
            })}
            searchInputAriaLabel="tags-select-toggle"
          />

          <HookFormPFGroupController
            control={control}
            name="owner"
            label={t("terms.owner")}
            fieldId="owner"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectAn", {
                  what: t("terms.owner").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="owner-toggle"
                id="owner-select"
                toggleAriaLabel="Owner select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, stakeholdersOptions) : undefined
                }
                options={stakeholdersOptions}
                onClear={() => onChange("")}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
                onBlur={onChange}
              />
            )}
          />
          <HookFormPFGroupController
            control={control}
            name="contributors"
            label={t("terms.contributors")}
            fieldId="contributors"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.contributors").toLowerCase(),
                })}
                id="contributors-select"
                variant="typeaheadmulti"
                toggleId="contributors-select-toggle"
                toggleAriaLabel="contributors dropdown toggle"
                aria-label={name}
                value={value
                  .map((formContributor) =>
                    stakeholders?.find(
                      (stakeholder) => stakeholder.name === formContributor
                    )
                  )
                  .map((matchingStakeholder) =>
                    matchingStakeholder
                      ? {
                          value: matchingStakeholder.name,
                          toString: () => matchingStakeholder.name,
                        }
                      : undefined
                  )
                  .filter((e) => e !== undefined)}
                options={stakeholdersOptions}
                onChange={(selection) => {
                  const selectionWithValue =
                    selection as OptionWithValue<string>;

                  const currentValue = value || [];
                  const e = currentValue.find(
                    (f) => f === selectionWithValue.value
                  );
                  if (e) {
                    onChange(
                      currentValue.filter((f) => f !== selectionWithValue.value)
                    );
                  } else {
                    onChange([...currentValue, selectionWithValue.value]);
                  }
                }}
                onClear={() => onChange([])}
                noResultsFoundText={t("message.noResultsFoundTitle")}
              />
            )}
          />
          <HookFormPFTextArea
            control={control}
            name="comments"
            label={t("terms.comments")}
            fieldId="comments"
            resizeOrientation="vertical"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection
        toggleText={t("terms.sourceCode")}
        className="toggle"
        onToggle={() => setSourceCodeExpanded(!isSourceCodeExpanded)}
        isExpanded={isSourceCodeExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFGroupController
            control={control}
            name="kind"
            label="Repository type"
            fieldId="repository-type-select"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                toggleId="repo-type-toggle"
                toggleAriaLabel="Type select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, repositoryKindOptions) : undefined
                }
                options={repositoryKindOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                  trigger("sourceRepository");
                }}
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="sourceRepository"
            label={t("terms.sourceRepo")}
            fieldId="sourceRepository"
            aria-label="source repository url"
            isRequired={repositoryKindOptions.some(
              ({ value }) => value === watchKind
            )}
          />
          <HookFormPFTextInput
            control={control}
            type="text"
            aria-label="Repository branch"
            name="branch"
            label={t("terms.sourceBranch")}
            fieldId="branch"
          />
          <HookFormPFTextInput
            control={control}
            name="rootPath"
            label={t("terms.sourceRootPath")}
            fieldId="rootPath"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection
        toggleText={t("terms.binary")}
        className="toggle"
        onToggle={() => setBinaryExpanded(!isBinaryExpanded)}
        isExpanded={isBinaryExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFTextInput
            control={control}
            name="group"
            label={t("terms.binaryGroup")}
            fieldId="group"
          />
          <HookFormPFTextInput
            control={control}
            name="artifact"
            label={t("terms.binaryArtifact")}
            fieldId="artifact"
          />
          <HookFormPFTextInput
            control={control}
            name="version"
            label={t("terms.binaryVersion")}
            fieldId="version"
          />
          <HookFormPFTextInput
            control={control}
            name="packaging"
            fieldId="packaging"
            label={t("terms.binaryPackaging")}
            labelIcon={
              <Popover
                position={PopoverPosition.top}
                aria-label="binary packaging details"
                bodyContent={t("message.binaryPackaging")}
                className="popover"
              >
                <span className="pf-v5-c-icon pf-m-info">
                  <QuestionCircleIcon />
                </span>
              </Popover>
            }
          />
        </div>
      </ExpandableSection>

      <ExpandableSection
        toggleText={t("terms.sourcePlatform")}
        className="toggle"
        onToggle={() => setSourcePlatformExpanded(!isSourcePlatformExpanded)}
        isExpanded={isSourcePlatformExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFGroupController
            control={control}
            name="sourcePlatform"
            label={t("terms.sourcePlatform")}
            fieldId="sourcePlatform"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
                placeholderText={t("composed.selectOne", {
                  what: t("terms.sourcePlatform").toLowerCase(),
                })}
                variant="typeahead"
                toggleId="source-platform-toggle"
                id="source-platform-select"
                toggleAriaLabel="Source platform select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, sourcePlatformOptions) : undefined
                }
                options={sourcePlatformOptions}
                onChange={(selection) => {
                  const name = (selection as OptionWithValue<string>).value;
                  if (name !== value) {
                    onChange(name);
                    setValue("coordinatesDocument", null, {
                      shouldValidate: true,
                    });
                  }
                }}
                onClear={() => {
                  onChange(null);
                  setValue("coordinatesDocument", null, {
                    shouldValidate: true,
                  });
                }}
              />
            )}
          />
          <HookFormPFGroupController
            control={control}
            name="coordinatesDocument"
            label={t("terms.sourcePlatformCoordinates")}
            fieldId="coordinatesDocument"
            renderInput={({ field: { value, name, onChange } }) => {
              const sp = values.sourcePlatform;
              const cs = sourcePlatformFromName(sp)?.coordinatesSchema;

              return !sp ? (
                <i>Select a source platform to setup the coordinates.</i>
              ) : !cs ? (
                <i>
                  No coordinates are available for the selected source platform.
                </i>
              ) : (
                <SchemaDefinedField
                  key={`${application?.id ?? -1}-${values.sourcePlatform}`}
                  id={name}
                  jsonDocument={value ?? {}}
                  jsonSchema={cs.definition}
                  onDocumentChanged={(newJsonDocument) => {
                    // Note: Since the shape of the json document __could__ look like an event
                    //       object, we wrap it up so it will always be processed correctly.
                    onChange({
                      target: {
                        name,
                        value: newJsonDocument,
                      },
                    });
                  }}
                />
              );
            }}
          />
        </div>
      </ExpandableSection>

      <ExpandableSection
        toggleText={t("terms.assetRepository")}
        className="toggle"
        onToggle={() => setAssetRepositoryExpanded(!isAssetRepositoryExpanded)}
        isExpanded={isAssetRepositoryExpanded}
      >
        <div className="pf-v5-c-form">
          <HookFormPFGroupController
            control={control}
            name="assetKind"
            label="Asset repository type"
            fieldId="asset-repository-type-select"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                toggleId="asset-repo-type-toggle"
                toggleAriaLabel="Type select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, repositoryKindOptions) : undefined
                }
                options={repositoryKindOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                  trigger("assetRepository");
                }}
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="assetRepository"
            label={t("terms.assetRepository")}
            fieldId="assetRepository"
            aria-label="asset repository url"
            isRequired={repositoryKindOptions.some(
              ({ value }) => value === watchAssetKind
            )}
          />
          <HookFormPFTextInput
            control={control}
            type="text"
            aria-label="Repository branch"
            name="assetBranch"
            label={t("terms.sourceBranch")}
            fieldId="assetBranch"
          />
          <HookFormPFTextInput
            control={control}
            name="assetRootPath"
            label={t("terms.sourceRootPath")}
            fieldId="assetRootPath"
          />
        </div>
      </ExpandableSection>
    </Form>
  );
};
