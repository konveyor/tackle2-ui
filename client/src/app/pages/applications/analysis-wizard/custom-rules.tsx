import * as React from "react";
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Form,
  Modal,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from "@patternfly/react-core";
import { cellWidth, ICell, IRow, TableText } from "@patternfly/react-table";
import {
  Table,
  TableBody,
  TableHeader,
} from "@patternfly/react-table/deprecated";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { IReadFile, TargetLabel } from "@app/api/models";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";

import "./wizard.css";
import { AnalysisWizardFormValues } from "./schema";
import { getParsedLabel, parseRules } from "@app/utils/rules-utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { toOptionLike } from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import useRuleFiles from "@app/hooks/useRuleFiles";
import { useTaskGroup } from "./components/TaskGroupContext";

export const CustomRules: React.FC = () => {
  const { t } = useTranslation();
  const { taskGroup, updateTaskGroup } = useTaskGroup();

  const { watch, setValue, control, getValues } =
    useFormContext<AnalysisWizardFormValues>();
  const values = getValues();

  const { formLabels, customRulesFiles, rulesKind } = watch();
  const initialActiveTabKeyValue = (value: string): number =>
    value === "manual" ? 0 : value === "repository" ? 1 : 0;

  const [activeTabKey, setActiveTabKey] = React.useState(
    initialActiveTabKeyValue(rulesKind)
  );

  const [isAddCustomRulesModalOpen, setCustomRulesModalOpen] =
    React.useState(false);

  const onCloseCustomRuleModal = () => {
    setCustomRulesModalOpen(false);
  };

  const {
    ruleFiles,
    setRuleFiles,
    handleFileDrop,
    showStatus,
    uploadError,
    setUploadError,
    setStatus,
    getloadPercentage,
    getloadResult,
    successfullyReadFileCount,
    handleFile,
    removeFiles,
  } = useRuleFiles(taskGroup?.id, values.customRulesFiles);

  const repositoryTypeOptions: OptionWithValue<string>[] = [
    {
      value: "git",
      toString: () => `Git`,
    },
    {
      value: "svn",
      toString: () => `Subversion`,
    },
  ];

  const { identities } = useFetchIdentities();

  const sourceIdentityOptions = identities
    .filter((identity) => identity.kind === "source")
    .map((sourceIdentity) => {
      return {
        value: sourceIdentity.name,
        toString: () => sourceIdentity.name,
      };
    });

  const filterCategories: FilterCategory<IReadFile, "name">[] = [
    {
      key: "name",
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.fileName || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useLegacyFilterState(
    values?.customRulesFiles || [],
    filterCategories
  );

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [cellWidth(20)],
    },
    {
      title: `${t("wizard.terms.source")} /  ${t("wizard.terms.target")}`,
      transforms: [cellWidth(20)],
    },
    { title: t("wizard.terms.numberOfRules"), transforms: [cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-v5-c-table__inline-edit-action",
      },
    },
  ];

  const rows: IRow[] = [];
  filteredItems?.forEach((item) => {
    const { source, target, total } = parseRules(item);

    const sourceLabelName = getParsedLabel(source)?.labelValue ?? "";
    const targetLabelName = getParsedLabel(target)?.labelValue ?? "";
    const sourceTargetLabel = `${sourceLabelName} / ${targetLabelName}`;

    rows.push({
      entity: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.fileName}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">{sourceTargetLabel}</TableText>
          ),
        },
        {
          title: <TableText wrapModifier="truncate">{total}</TableText>,
        },
        {
          title: (
            <div className="pf-v5-c-inline-edit__action pf-m-enable-editable">
              <Button
                id="remove-rule-button"
                type="button"
                variant="plain"
                onClick={() => {
                  customRulesFiles.forEach((file) => {
                    const { allLabels } = parseRules(file);
                    const updatedFormLabels = formLabels.filter(
                      (label) => !allLabels?.includes(label.label)
                    );
                    setValue("formLabels", [...updatedFormLabels]);
                  });

                  // Remove rule file from list
                  const updatedFileList = customRulesFiles.filter(
                    (file) => file.fileName !== item.fileName
                  );
                  setValue("customRulesFiles", updatedFileList, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              >
                <TrashIcon />
              </Button>
            </div>
          ),
        },
      ],
    });
  });

  return (
    <>
      <TextContent className={spacing.mbSm}>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.customRules")}
        </Title>
        <Text> {t("wizard.label.customRules")}</Text>
      </TextContent>
      {values.selectedTargets.length === 0 &&
        values.customRulesFiles.length === 0 &&
        !values.sourceRepository && (
          <Alert
            variant="warning"
            isInline
            title={t("wizard.label.ruleFileRequiredDetails")}
          />
        )}
      <HookFormPFGroupController
        control={control}
        name="rulesKind"
        fieldId="type-select"
        renderInput={({ field: { onChange } }) => (
          <Tabs
            className={spacing.mtSm}
            activeKey={activeTabKey}
            onSelect={(_event, tabIndex) => {
              setActiveTabKey(tabIndex as number);
              if (tabIndex === 0) onChange("manual");
              if (tabIndex === 1) onChange("repository");
            }}
          >
            <Tab eventKey={0} title={<TabTitleText>Manual</TabTitleText>} />
            <Tab eventKey={1} title={<TabTitleText>Repository</TabTitleText>} />
          </Tabs>
        )}
      />
      {activeTabKey === 0 && (
        <>
          <div className="line">
            <Toolbar
              className="pf-m-toggle-group-container"
              collapseListedFiltersBreakpoint="xl"
              clearAllFilters={handleOnClearAllFilters}
              clearFiltersButtonText="clear Filter"
            >
              <ToolbarContent>
                <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
                  <FilterToolbar
                    filterCategories={filterCategories}
                    filterValues={filterValues}
                    setFilterValues={setFilterValues}
                  />
                </ToolbarToggleGroup>
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      id="add-rules"
                      type="button"
                      aria-label="add rules"
                      variant="primary"
                      onClick={() => setCustomRulesModalOpen(true)}
                    >
                      {t("composed.add", {
                        what: t("wizard.terms.rules").toLowerCase(),
                      })}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>
          </div>
          {filteredItems.length > 0 ? (
            <Table
              aria-label="Custom rules table"
              className="custom-rules-table"
              cells={columns}
              rows={rows}
            >
              <TableHeader />
              <TableBody />
            </Table>
          ) : (
            <NoDataEmptyState
              title={t("wizard.label.noCustomRules")}
              description={t("composed.add", {
                what: t("wizard.terms.rules").toLowerCase(),
              })}
            />
          )}
        </>
      )}
      {activeTabKey === 1 && (
        <>
          <Form className={spacing.mtLg}>
            <HookFormPFGroupController
              control={control}
              name="repositoryType"
              label="Repository type"
              fieldId="repo-type-select"
              isRequired
              renderInput={({ field: { value, name, onChange } }) => (
                <SimpleSelect
                  id="repo-type-select"
                  toggleId="repo-type-select-toggle"
                  toggleAriaLabel="Repository type select dropdown toggle"
                  aria-label={name}
                  value={
                    value
                      ? toOptionLike(value, repositoryTypeOptions)
                      : undefined
                  }
                  options={repositoryTypeOptions}
                  onChange={(selection) => {
                    const selectionValue = selection as OptionWithValue<string>;
                    onChange(selectionValue.value);
                  }}
                />
              )}
            />
            <HookFormPFTextInput
              control={control}
              name="sourceRepository"
              label="Source repository"
              fieldId="sourceRepository"
              isRequired
            />
            <HookFormPFTextInput
              control={control}
              name="branch"
              label="Branch"
              fieldId="branch"
            />
            <HookFormPFTextInput
              control={control}
              name="rootPath"
              label="Root path"
              fieldId="rootPath"
            />
            <HookFormPFGroupController
              control={control}
              name="associatedCredentials"
              label="Associated credentials"
              fieldId="credentials-select"
              renderInput={({ field: { value, name, onChange } }) => (
                <SimpleSelect
                  id="associated-credentials-select"
                  toggleId="associated-credentials-select-toggle"
                  toggleAriaLabel="Associated credentials dropdown toggle"
                  aria-label={name}
                  variant={"typeahead"}
                  value={
                    value
                      ? toOptionLike(value, sourceIdentityOptions)
                      : undefined
                  }
                  options={sourceIdentityOptions}
                  onChange={(selection) => {
                    const selectionValue = selection as OptionWithValue<string>;
                    onChange(selectionValue.value);
                  }}
                  onClear={() => onChange("")}
                />
              )}
            />
          </Form>
        </>
      )}

      {isAddCustomRulesModalOpen && (
        <Modal
          isOpen={isAddCustomRulesModalOpen}
          variant="medium"
          title="Add rules"
          onClose={() => {
            setRuleFiles([]);
            setUploadError("");
            onCloseCustomRuleModal();
          }}
          actions={[
            <Button
              key="add"
              variant="primary"
              isDisabled={
                !ruleFiles.find((file) => file.loadResult === "success") ||
                ruleFiles.some((file) => file.loadResult === "danger")
              }
              onClick={(event) => {
                let hasExistingRuleFile = null;
                const validFiles = ruleFiles.filter(
                  (file) => file.loadResult === "success"
                );
                try {
                  ruleFiles.forEach((ruleFile) => {
                    hasExistingRuleFile = customRulesFiles.some(
                      (file) => file.fileName === ruleFile.fileName
                    );
                    if (hasExistingRuleFile) {
                      const error = new Error(
                        `File "${ruleFile.fileName}" is already uploaded`
                      );
                      throw error.toString();
                    }
                  });
                } catch (error) {
                  setUploadError(error as string);
                }

                if (!hasExistingRuleFile) {
                  const updatedCustomRulesFiles = [
                    ...customRulesFiles,
                    ...validFiles,
                  ];
                  setValue("customRulesFiles", updatedCustomRulesFiles, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  updatedCustomRulesFiles.forEach((file) => {
                    const { allLabels } = parseRules(file);

                    const formattedAllLabels =
                      allLabels?.map((label): TargetLabel => {
                        return {
                          name: getParsedLabel(label).labelValue,
                          label: label,
                        };
                      }) || [];
                    const newLabels = formLabels.filter((label) => {
                      const newLabelNames = formattedAllLabels.map(
                        (label) => label.name
                      );
                      return !newLabelNames.includes(label.name);
                    });
                    setValue("formLabels", [
                      ...newLabels,
                      ...formattedAllLabels,
                    ]);
                  });

                  setRuleFiles([]);
                  setUploadError("");
                  setCustomRulesModalOpen(false);
                }
              }}
            >
              Add
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={() => {
                setRuleFiles([]);
                setUploadError("");
                onCloseCustomRuleModal();
              }}
            >
              Cancel
            </Button>,
          ]}
        >
          <>
            {uploadError !== "" && (
              <Alert
                className={`${spacing.mtMd} ${spacing.mbMd}`}
                variant="danger"
                isInline
                title={uploadError}
                actionClose={
                  <AlertActionCloseButton onClose={() => setUploadError("")} />
                }
              />
            )}
            <MultipleFileUpload
              onFileDrop={handleFileDrop}
              dropzoneProps={{
                accept: {
                  "text/yaml": [".yml", ".yaml"],
                  "text/xml": [".xml"],
                },
              }}
            >
              <MultipleFileUploadMain
                titleIcon={<UploadIcon />}
                titleText="Drag and drop files here"
                titleTextSeparator="or"
                infoText="Accepted file types: .yml, .yaml, .xml "
              />
              {showStatus && (
                <MultipleFileUploadStatus
                  statusToggleText={`${successfullyReadFileCount} of ${ruleFiles.length} files uploaded`}
                  statusToggleIcon={setStatus()}
                >
                  {ruleFiles.map((file) => (
                    <MultipleFileUploadStatusItem
                      file={file.fullFile}
                      key={file.fileName}
                      customFileHandler={handleFile}
                      onClearClick={() => removeFiles([file.fileName])}
                      progressValue={getloadPercentage(file.fileName)}
                      progressVariant={getloadResult(file.fileName)}
                    />
                  ))}
                </MultipleFileUploadStatus>
              )}
            </MultipleFileUpload>
          </>
        </Modal>
      )}
    </>
  );
};
