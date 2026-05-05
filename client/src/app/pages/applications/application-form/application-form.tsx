import "./application-form.css";
import * as React from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ExpandableSection,
  Form,
  Popover,
  PopoverPosition,
} from "@patternfly/react-core";
import { QuestionCircleIcon } from "@patternfly/react-icons";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import {
  HookFormAutocomplete,
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { RepositoryFields } from "@app/components/repository-fields";
import { SchemaDefinedField } from "@app/components/schema-defined-fields";
import { wrapAsEvent } from "@app/utils/utils";

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

const hasSourceRepository = (application: DecoratedApplication | null) => {
  return !!application?.repository?.kind && !!application?.repository?.url;
};

const hasBinary = (application: DecoratedApplication | null) => {
  return !!application?.binary?.startsWith("mvn://");
};

const hasSourcePlatform = (application: DecoratedApplication | null) => {
  return !!application?.platform?.name;
};

const hasAssetRepository = (application: DecoratedApplication | null) => {
  return !!application?.assets?.kind && !!application?.assets?.url;
};

export const ApplicationFormReady: React.FC<ApplicationFormProps> = ({
  form,
  data: {
    tagItems,
    stakeholdersOptions,
    repositoryKindOptions,
    businessServiceOptions,
    platformFromName,
    platformOptions,
  },
  application,
}) => {
  const { control, setValue } = form;
  const { t } = useTranslation();
  const watchSourcePlatform = useWatch({ control, name: "sourcePlatform" });

  const [isBasicExpanded, setBasicExpanded] = React.useState(true);

  const [isSourceCodeExpanded, setSourceCodeExpanded] = React.useState(
    hasSourceRepository(application)
  );

  const [isBinaryExpanded, setBinaryExpanded] = React.useState(
    hasBinary(application)
  );

  const [isSourcePlatformExpanded, setSourcePlatformExpanded] = React.useState(
    hasSourcePlatform(application)
  );

  const [isAssetRepositoryExpanded, setAssetRepositoryExpanded] =
    React.useState(hasAssetRepository(application));

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
              <TypeaheadSelect
                placeholderText={t("composed.selectOne", {
                  what: t("terms.businessService").toLowerCase(),
                })}
                toggleId="business-service-toggle"
                toggleAriaLabel="Business service select dropdown toggle"
                ariaLabel={name}
                value={value}
                options={businessServiceOptions}
                onSelect={(selection) => onChange(selection ?? "")}
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
              <TypeaheadSelect
                placeholderText={t("composed.selectAn", {
                  what: t("terms.owner").toLowerCase(),
                })}
                toggleId="owner-toggle"
                toggleAriaLabel="Owner select dropdown toggle"
                ariaLabel={name}
                value={value || undefined}
                options={stakeholdersOptions}
                onSelect={(selection) => onChange(selection || null)}
              />
            )}
          />
          <HookFormPFGroupController
            control={control}
            name="contributors"
            label={t("terms.contributors")}
            fieldId="contributors"
            renderInput={({ field: { value, name, onChange } }) => (
              <MultiSelect
                placeholderText={t("composed.selectMany", {
                  what: t("terms.contributors").toLowerCase(),
                })}
                toggleId="contributors-select-toggle"
                toggleAriaLabel="contributors dropdown toggle"
                aria-label={name}
                hasChips={true}
                values={value}
                options={stakeholdersOptions}
                onSelect={(selection) => {
                  if (!selection) {
                    return;
                  }
                  const currentValue = value || [];
                  const e = currentValue.find((f) => f === selection);
                  if (e) {
                    onChange(currentValue.filter((f) => f !== selection));
                  } else {
                    onChange([...currentValue, selection]);
                  }
                }}
                onClear={() => onChange([])}
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
          <RepositoryFields
            form={form}
            prefix="source"
            kindOptions={repositoryKindOptions}
            labels={{
              type: t("terms.repositoryType"),
              url: t("terms.sourceRepo"),
              branch: t("terms.sourceBranch"),
              path: t("terms.sourceRootPath"),
            }}
            fieldIds={{
              type: "repository-type-select",
              url: "sourceRepository",
              branch: "branch",
              path: "rootPath",
            }}
            toggleIds={{
              type: "repo-type-toggle",
            }}
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
              <TypeaheadSelect
                placeholderText={t("composed.selectOne", {
                  what: t("terms.sourcePlatform").toLowerCase(),
                })}
                toggleId="source-platform-toggle"
                toggleAriaLabel="Source platform select dropdown toggle"
                ariaLabel={name}
                value={value || undefined}
                options={platformOptions}
                onSelect={(selection) => {
                  if (selection !== value) {
                    onChange(selection ?? null);
                    setValue("coordinatesDocument", null, {
                      shouldValidate: true,
                    });
                  }
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
              const coordinatesSchema =
                platformFromName(watchSourcePlatform)?.coordinatesSchema;

              return !watchSourcePlatform ? (
                <i>Select a source platform to setup the coordinates.</i>
              ) : !coordinatesSchema ? (
                <i>
                  No coordinates are available for the selected source platform.
                </i>
              ) : (
                <SchemaDefinedField
                  key={`${application?.id ?? -1}-${watchSourcePlatform}`}
                  id={name}
                  jsonDocument={value ?? {}}
                  jsonSchema={coordinatesSchema.definition}
                  onDocumentChanged={(newJsonDocument) => {
                    onChange(wrapAsEvent(newJsonDocument, name));
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
          <RepositoryFields
            form={form}
            prefix="assets"
            kindOptions={repositoryKindOptions}
            labels={{
              type: t("terms.repositoryType"),
              url: t("terms.assetRepository"),
              branch: t("terms.sourceBranch"),
              path: t("terms.sourceRootPath"),
            }}
            fieldIds={{
              type: "asset-repository-type-select",
              url: "assetRepository",
              branch: "assetBranch",
              path: "assetRootPath",
            }}
            toggleIds={{
              type: "asset-repo-type-toggle",
            }}
          />
        </div>
      </ExpandableSection>
    </Form>
  );
};
