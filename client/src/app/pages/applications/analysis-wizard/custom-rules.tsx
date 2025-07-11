import * as React from "react";
import {
  Alert,
  Button,
  Form,
  Modal,
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
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { unique } from "radash";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { UploadFile, TargetLabel } from "@app/api/models";
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
import { useTaskGroup } from "./components/TaskGroupContext";
import { CustomRuleFilesUpload } from "@app/components/CustomRuleFilesUpload";

const buildSetOfTargetLabelsFromUploadFiles = (
  ruleFiles: UploadFile[],
  existingLabels: TargetLabel[] = []
) => {
  const targetLabels = unique(
    ruleFiles.reduce(
      (acc, file) => {
        const { allLabels } = parseRules(file);
        const fileTargetLabels =
          allLabels?.map(
            (label): TargetLabel => ({
              name: getParsedLabel(label).labelValue,
              label,
            })
          ) ?? [];
        acc.push(...fileTargetLabels);
        return acc;
      },
      [...existingLabels]
    ),
    ({ name }) => name
  );

  return targetLabels;
};

export const CustomRules: React.FC = () => {
  const { t } = useTranslation();
  const [showUploadFiles, setShowUploadFiles] = React.useState(false);

  const { watch, setValue, control, trigger, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const values = getValues();

  const { selectedTargetLabels, customRulesFiles, rulesKind } = watch();

  const initialActiveTabKeyValue = (value: string): number =>
    value === "manual" ? 0 : value === "repository" ? 1 : 0;

  const [activeTabKey, setActiveTabKey] = React.useState(
    initialActiveTabKeyValue(rulesKind)
  );

  const onAddRulesFiles = (ruleFiles: UploadFile[]) => {
    // Merge successfully uploaded files to `customRulesFiles`
    const newCustomRulesFiles = [
      ...customRulesFiles,
      ...ruleFiles.filter((file) => file.status === "uploaded"),
    ];
    setValue("customRulesFiles", newCustomRulesFiles, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Find all labels in the new rule files and push them to `selectedTargetLabels`
    const uniqueNewTargetLabels = buildSetOfTargetLabelsFromUploadFiles(
      ruleFiles,
      selectedTargetLabels
    );
    setValue("selectedTargetLabels", uniqueNewTargetLabels);
  };

  const onRemoveRuleFile = (ruleFile: UploadFile) => {
    // Remove the rule file from `customRulesFiles`
    const newCustomRulesFiles = customRulesFiles.filter(
      (file) => file.fileName !== ruleFile.fileName
    );
    setValue("customRulesFiles", newCustomRulesFiles, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Update the labels ... remove the labels uniquely from the removed files
    const removedLabels = buildSetOfTargetLabelsFromUploadFiles([ruleFile]);
    const currentFileLabels =
      buildSetOfTargetLabelsFromUploadFiles(newCustomRulesFiles);
    const nonFileLabels = selectedTargetLabels.filter(
      (l) =>
        !removedLabels.find((r) => r.label === l.label) &&
        !currentFileLabels.find((c) => c.label === l.label)
    );

    setValue("selectedTargetLabels", [...nonFileLabels, ...currentFileLabels]);
  };

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

  const filterCategories: FilterCategory<UploadFile, "name">[] = [
    {
      categoryKey: "name",
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
    customRulesFiles,
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
      title: `${t("wizard.terms.source", { count: 2 })} / ${t("wizard.terms.target", { count: 2 })}`,
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

    // TODO: See issue https://github.com/konveyor/tackle2-ui/issues/2249
    const sources = getParsedLabel(source).labelValue || t("wizard.terms.none");
    const targets = getParsedLabel(target).labelValue || t("wizard.terms.none");
    const sourceTargetLabel = `${sources} / ${targets}`;

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
                onClick={() => onRemoveRuleFile(item)}
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
                      onClick={() => setShowUploadFiles(true)}
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
                    trigger("sourceRepository");
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

      <UploadNewRulesFiles
        key={showUploadFiles ? 1 : 2} // reset component state every modal open/close
        show={showUploadFiles}
        existingFiles={customRulesFiles}
        onAddFiles={onAddRulesFiles}
        onClose={() => setShowUploadFiles(false)}
      />
    </>
  );
};

const UploadNewRulesFiles: React.FC<{
  show: boolean;
  existingFiles: UploadFile[];
  onAddFiles: (newFiles: UploadFile[]) => void;
  onClose: () => void;
}> = ({ show, existingFiles, onAddFiles, onClose }) => {
  const { taskGroup } = useTaskGroup();
  const doesFileAlreadyExist = React.useCallback(
    (fileName: string) => {
      return existingFiles.some((existing) => existing.fileName === fileName);
    },
    [existingFiles]
  );

  const { control } = useForm({
    defaultValues: {
      uploadedFiles: [] as UploadFile[],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "uploadedFiles",
  });

  const filesToFieldsIndex = (files: UploadFile[]) => {
    const indexes: number[] = [];
    if (files && files.length > 0) {
      fields.forEach(({ fileName }, index) => {
        if (files.some((f) => fileName === f.fileName)) {
          indexes.push(index);
        }
      });
    }
    return indexes;
  };

  const onCloseCancel = () => {
    // TODO: Consider any uploaded files and delete them from hub if necessary
    onClose();
  };

  const onAdd = () => {
    onAddFiles(fields);
    onClose();
  };

  const isAddDisabled = !fields.every(({ status }) => status === "uploaded");

  return (
    <Modal
      isOpen={show}
      variant="medium"
      title="Add rules"
      onClose={onCloseCancel}
      actions={[
        <Button
          key="add"
          variant="primary"
          isDisabled={isAddDisabled}
          onClick={onAdd}
        >
          Add
        </Button>,
        <Button key="cancel" variant="link" onClick={onCloseCancel}>
          Cancel
        </Button>,
      ]}
    >
      <CustomRuleFilesUpload
        taskgroupId={taskGroup?.id}
        fileExists={doesFileAlreadyExist}
        ruleFiles={fields}
        onAddRuleFiles={(ruleFiles) => {
          append(ruleFiles);
        }}
        onRemoveRuleFiles={(ruleFiles) => {
          const indexesToRemove = filesToFieldsIndex(ruleFiles);
          if (indexesToRemove.length > 0) {
            remove(indexesToRemove);
          }
        }}
        onChangeRuleFile={(ruleFile) => {
          const index = fields.findIndex(
            (f) => f.fileName === ruleFile.fileName
          );
          update(index, ruleFile);
        }}
      />
    </Modal>
  );
};
