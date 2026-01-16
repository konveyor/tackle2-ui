import * as React from "react";
import { useCallback } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { UseFormSetValue, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  Alert,
  Button,
  Form,
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import { TrashIcon } from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { ICell, IRow, TableText, cellWidth } from "@patternfly/react-table";
import {
  Table,
  TableBody,
  TableHeader,
} from "@patternfly/react-table/deprecated";

import { TargetLabel, Taskgroup, UploadFile } from "@app/api/models";
import { TargetLabelSchema, UploadFileSchema } from "@app/api/schemas";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";
import { useLegacyFilterState } from "@app/hooks/useLegacyFilterState";
import { useFetchIdentities } from "@app/queries/identities";
import { toOptionLike } from "@app/utils/model-utils";
import { getParsedLabel, parseRules } from "@app/utils/rules-utils";
import { buildSetOfTargetLabels } from "@app/utils/upload-file-utils";

import { UploadRulesFiles } from "../components/upload-rules-files";

export interface CustomRulesStepValues {
  rulesKind: "manual" | "repository";
  customRulesFiles: UploadFile[];
  customLabels: TargetLabel[];
  repositoryType?: string;
  sourceRepository?: string;
  branch?: string;
  rootPath?: string;
  associatedCredentials?: string;
}

export interface CustomRulesStepState extends CustomRulesStepValues {
  isValid: boolean;
}

export const useCustomRulesSchema = ({
  isCustomRuleRequired,
}: {
  isCustomRuleRequired: boolean;
}): yup.SchemaOf<CustomRulesStepValues> => {
  return yup.object({
    rulesKind: yup.mixed<"manual" | "repository">().required(),

    // manual tab fields
    customRulesFiles: yup
      .array()
      .of(UploadFileSchema)
      .when("rulesKind", {
        is: "manual",
        then: (schema) =>
          isCustomRuleRequired
            ? schema.min(1, "At least 1 Rule File is required")
            : schema,
        otherwise: (schema) => schema,
      }),
    customLabels: yup.array().of(TargetLabelSchema),

    // repository tab fields
    repositoryType: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) => schema.oneOf(["git", "svn"]).required(),
    }),
    sourceRepository: yup.string().when("rulesKind", {
      is: "repository",
      then: (schema) => schema.repositoryUrl("repositoryType").required(),
    }),
    branch: yup.string(),
    rootPath: yup.string(),
    associatedCredentials: yup.string(),
  });
};

interface CustomRulesProps {
  /**
   * Optional function to ensure a taskgroup exists for file uploads.
   * When provided (analysis wizard), files are uploaded to the taskgroup.
   * When omitted (profile wizard), files are uploaded as standard hub files.
   */
  ensureTaskGroup?: () => Promise<Taskgroup>;
  isCustomRuleRequired: boolean;
  onStateChanged: (state: CustomRulesStepState) => void;
  initialState: CustomRulesStepState;
}

export const CustomRules: React.FC<CustomRulesProps> = ({
  ensureTaskGroup,
  isCustomRuleRequired,
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();
  const [showUploadFiles, setShowUploadFiles] = React.useState(false);
  const [taskgroupId, setTaskgroupId] = React.useState<number | undefined>(
    undefined
  );

  const onShowUploadFiles = async (show: boolean) => {
    // Only request a taskgroup if ensureTaskGroup is provided and we don't have one yet
    if (show && ensureTaskGroup && taskgroupId === undefined) {
      const taskgroup = await ensureTaskGroup();
      setTaskgroupId(taskgroup.id);
    }
    setShowUploadFiles(show);
  };

  const schema = useCustomRulesSchema({ isCustomRuleRequired });
  const form = useForm<CustomRulesStepValues>({
    defaultValues: {
      rulesKind: initialState.rulesKind,
      customRulesFiles: initialState.customRulesFiles,
      customLabels: initialState.customLabels,
      repositoryType: initialState.repositoryType,
      sourceRepository: initialState.sourceRepository,
      branch: initialState.branch,
      rootPath: initialState.rootPath,
      associatedCredentials: initialState.associatedCredentials,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });
  const { control, trigger } = form;
  const setValue: UseFormSetValue<CustomRulesStepValues> = useCallback(
    (name, value) => {
      form.setValue(name, value, { shouldValidate: true });
    },
    [form]
  );

  const [customRulesFiles = [], customLabels = [], sourceRepository] = useWatch(
    {
      control,
      name: ["customRulesFiles", "customLabels", "sourceRepository"],
    }
  );

  const isCustomRuleRequiredAlertVisible =
    isCustomRuleRequired && customRulesFiles.length === 0 && !sourceRepository;

  useFormChangeHandler({ form, onStateChanged });

  const [activeTabKey, setActiveTabKey] = React.useState(() =>
    initialState.rulesKind === "repository" ? 1 : 0
  );

  const onAddRulesFiles = (ruleFiles: UploadFile[]) => {
    // Merge successfully uploaded files to `customRulesFiles`
    const newCustomRulesFiles = [
      ...customRulesFiles,
      ...ruleFiles.filter((file) => file.status === "uploaded"),
    ];
    setValue("customRulesFiles", newCustomRulesFiles);

    // Find all labels in the new rule files and push them to `customLabels`
    const uniqueNewTargetLabels = buildSetOfTargetLabels(
      ruleFiles,
      customLabels
    );
    setValue("customLabels", uniqueNewTargetLabels);
  };

  const onRemoveRuleFile = (ruleFile: UploadFile) => {
    // Remove the rule file from `customRulesFiles`
    const newCustomRulesFiles = customRulesFiles.filter(
      (file) => file.fileName !== ruleFile.fileName
    );
    setValue("customRulesFiles", newCustomRulesFiles);

    // Rebuild the labels from the remaining rule files
    const currentFileLabels = buildSetOfTargetLabels(newCustomRulesFiles);
    setValue("customLabels", currentFileLabels);
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

  const { identitiesByKind } = useFetchIdentities();
  const sourceIdentityOptions = (identitiesByKind.source ?? []).map(
    (identity) => ({
      value: identity.name as string,
      toString: () => identity.name,
    })
  );

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

  // TODO: Replace with the current table and filter state -- set-targets has a similar implementation
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
      {isCustomRuleRequiredAlertVisible && (
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
            // TODO: Use mountOnEnter/unmountOnExit instead of activeKey for tab body rendering?
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
                      onClick={() => onShowUploadFiles(true)}
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

      <UploadRulesFiles
        key={showUploadFiles ? 1 : 2} // reset component state every modal open/close
        show={showUploadFiles}
        taskgroupId={taskgroupId}
        existingFiles={customRulesFiles}
        onAddFiles={onAddRulesFiles}
        onClose={() => onShowUploadFiles(false)}
      />
    </>
  );
};
