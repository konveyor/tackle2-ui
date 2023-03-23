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
import {
  cellWidth,
  ICell,
  IRow,
  Table,
  TableBody,
  TableHeader,
  TableText,
} from "@patternfly/react-table";
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
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { Identity, IReadFile, Ref } from "@app/api/models";
import { NoDataEmptyState } from "@app/shared/components/no-data-empty-state";

import "./wizard.css";
import { AnalysisWizardFormValues } from "./schema";
import { parseRules } from "@app/common/CustomRules/rules-utils";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import {
  IdentityDropdown,
  toIdentityDropdown,
  toOptionLike,
} from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import useRuleFiles from "@app/common/CustomRules/useRuleFiles";
interface CustomRulesProps {
  taskgroupID: number | null;
}
export const CustomRules: React.FC<CustomRulesProps> = (props) => {
  const { t } = useTranslation();

  const { watch, setValue, control, getValues } =
    useFormContext<AnalysisWizardFormValues>();
  const values = getValues();

  const { formSources, formTargets, customRulesFiles } = watch();
  const [activeTabKey, setActiveTabKey] = React.useState(0);

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
  } = useRuleFiles(props?.taskgroupID, customRulesFiles);

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
  const emptyIdentity: Identity = { id: 0, name: "None", createUser: "" };

  let sourceIdentityOptions: Identity[] =
    identities?.filter((i) => i.kind === "source") || [];
  sourceIdentityOptions.unshift(emptyIdentity);
  sourceIdentityOptions = sourceIdentityOptions.map((i) =>
    toIdentityDropdown(i)
  );

  const toOptionWithValue = (
    value: IdentityDropdown
  ): OptionWithValue<IdentityDropdown> => ({
    value,
    toString: () => value?.name || "",
  });

  const filterCategories: FilterCategory<IReadFile>[] = [
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

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
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
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

  const rows: IRow[] = [];
  filteredItems?.forEach((item) => {
    const { source, target, total } = parseRules(item);

    rows.push({
      entity: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.fileName}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {source} / {target}
            </TableText>
          ),
        },
        {
          title: <TableText wrapModifier="truncate">{total}</TableText>,
        },
        {
          title: (
            <div className="pf-c-inline-edit__action pf-m-enable-editable">
              <Button
                id="remove-rule-button"
                type="button"
                variant="plain"
                onClick={() => {
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
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.customRules")}
        </Title>
        <Text> {t("wizard.label.customRules")}</Text>
      </TextContent>
      <HookFormPFGroupController
        control={control}
        name="rulesKind"
        label="Custom rules"
        fieldId="type-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
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
      ></HookFormPFGroupController>
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
                  <FilterToolbar<IReadFile>
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
              renderInput={({ field: { value, name, onBlur, onChange } }) => (
                <SimpleSelect
                  id="associated-credentials-select"
                  toggleId="associated-credentials-select-toggle"
                  toggleAriaLabel="Associated credentials dropdown toggle"
                  aria-label={name}
                  value={value ? toOptionWithValue(value) : undefined}
                  options={sourceIdentityOptions.map(toOptionWithValue)}
                  onChange={(selection) => {
                    const selectionValue = selection as OptionWithValue<Ref>;
                    onChange(selectionValue.value);
                  }}
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
                !ruleFiles.find((file) => file.loadResult === "success")
              }
              onClick={(event) => {
                setCustomRulesModalOpen(false);
                const validFiles = ruleFiles.filter(
                  (file) => file.loadResult === "success"
                );
                const updatedCustomRulesFiles = [
                  ...customRulesFiles,
                  ...validFiles,
                ];
                setValue("customRulesFiles", updatedCustomRulesFiles, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                updatedCustomRulesFiles.forEach((file) => {
                  const { source, target } = parseRules(file);
                  if (source && !formSources.includes(source)) {
                    setValue("formSources", [...formSources, source]);
                  }
                  if (target && !formTargets.includes(target)) {
                    setValue("formTargets", [...formTargets, target]);
                  }
                });
                setRuleFiles([]);
                setUploadError("");
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
                accept: ".xml",
              }}
            >
              <MultipleFileUploadMain
                titleIcon={<UploadIcon />}
                titleText="Drag and drop files here"
                titleTextSeparator="or"
                infoText="Accepted file types: XML with '.windup.xml' suffix."
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
