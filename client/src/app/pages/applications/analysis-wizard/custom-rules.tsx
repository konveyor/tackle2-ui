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
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

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
import { useTaskGroup } from "./components/TaskGroupContext";
import { CustomRuleFilesUpload } from "@app/components/CustomRuleFilesUpload";
import { localeNumericCompare } from "@app/utils/utils";

export const CustomRules: React.FC = () => {
  const { t } = useTranslation();
  const { taskGroup } = useTaskGroup();

  const { watch, setValue, control, trigger, getValues } =
    useFormContext<AnalysisWizardFormValues>();
  const values = getValues();

  const { selectedTargetLabels, customRulesFiles, rulesKind } = watch();
  const initialActiveTabKeyValue = (value: string): number =>
    value === "manual" ? 0 : value === "repository" ? 1 : 0;

  const [activeTabKey, setActiveTabKey] = React.useState(
    initialActiveTabKeyValue(rulesKind)
  );

  const [newRuleFiles, setNewRuleFiles] = React.useState<IReadFile[] | null>(
    null
  );

  const closeAddCustomRulesModal = () => {
    setNewRuleFiles(null);
  };

  const onAddCustomRulesFiles = () => {
    if (!newRuleFiles) {
      return;
    }

    // Merge "success" loaded files to the customRulesFiles form field
    const newCustomRulesFiles = [
      ...customRulesFiles,
      ...newRuleFiles.filter((file) => file.loadResult === "success"),
    ];

    setValue("customRulesFiles", newCustomRulesFiles, {
      shouldValidate: true,
      shouldDirty: true,
    });
    trigger("customRulesFiles");

    // Find all labels in the rule files and push all of them to the selected target labels list
    newCustomRulesFiles.forEach((file) => {
      const { allLabels } = parseRules(file);

      const formattedAllLabels =
        allLabels?.map((label): TargetLabel => {
          return {
            name: getParsedLabel(label).labelValue,
            label: label,
          };
        }) || [];

      const newLabels = selectedTargetLabels.filter((label) => {
        const newLabelNames = formattedAllLabels.map((label) => label.name);
        return !newLabelNames.includes(label.name);
      });

      setValue("selectedTargetLabels", [...newLabels, ...formattedAllLabels]);
    });
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

  const filterCategories: FilterCategory<IReadFile, "name">[] = [
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

    // TODO: See issue https://github.com/konveyor/tackle2-ui/issues/2249
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
                    const updatedFormLabels = selectedTargetLabels.filter(
                      (label) => !allLabels?.includes(label.label)
                    );
                    setValue("selectedTargetLabels", [...updatedFormLabels]);
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
                      onClick={() => setNewRuleFiles([])}
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

      {newRuleFiles && (
        <Modal
          isOpen={!!newRuleFiles}
          variant="medium"
          title="Add rules"
          onClose={closeAddCustomRulesModal}
          actions={[
            <Button
              key="add"
              variant="primary"
              isDisabled={
                !newRuleFiles.some((file) => file.loadResult === "success") ||
                newRuleFiles.some((file) => file.loadResult !== "success")
              }
              onClick={() => {
                onAddCustomRulesFiles();
                closeAddCustomRulesModal();
              }}
            >
              Add
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={closeAddCustomRulesModal}
            >
              Cancel
            </Button>,
          ]}
        >
          <CustomRuleFilesUpload
            key={newRuleFiles ? 1 : 0} // reset component state every modal open/close
            taskgroupId={taskGroup?.id}
            fileExists={(fileName) =>
              customRulesFiles.some((file) => file.fileName === fileName)
            }
            ruleFiles={newRuleFiles}
            onAddRuleFiles={(ruleFiles) => {
              setNewRuleFiles((existing) => {
                if (!existing) return existing;
                existing.push(...ruleFiles);
                existing.sort((a, b) =>
                  localeNumericCompare(a.fileName, b.fileName)
                );
                return existing;
              });
            }}
            onRemoveRuleFiles={(ruleFiles) => {
              setNewRuleFiles((existing) => {
                if (!existing) return existing;
                const namesToRemove = ruleFiles.map(({ fileName }) => fileName);
                return existing.filter(
                  ({ fileName }) => !namesToRemove.includes(fileName)
                );
              });
            }}
            onChangeRuleFile={(ruleFile: IReadFile) => {
              setNewRuleFiles((existing) => {
                if (!existing) return existing;
                const at = existing.findIndex(
                  ({ fileName }) => fileName !== ruleFile.fileName
                );
                if (at >= 0) existing[at] = ruleFile;
                return existing;
              });
            }}
          />
        </Modal>
      )}
    </>
  );
};
